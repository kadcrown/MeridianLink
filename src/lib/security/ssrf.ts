import { URL } from 'url';

const PRIVATE_IP_RANGES = [
  /^127\./,                         // Loopback
  /^10\./,                          // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./,                    // Class C private
  /^169\.254\./,                    // Link-local / AWS metadata
  /^0\./,                           // Zero address
  /^::1$/,                          // IPv6 loopback
  /^fe80:/i,                        // IPv6 link-local
  /^fc00:/i,                        // IPv6 unique local
  /^fd[0-9a-f]{2}:/i,               // IPv6 unique local
];

const ALLOWED_AMAZON_SHORTENERS = [
  'amzn.to',
  'amzn.eu',
  'amzn.asia',
  'a.co',
  'amzn.in',
  'amzn.cl',
  'amzn.gr',
];

const AMAZON_DOMAINS = [
  'amazon.com',
  'amazon.ca',
  'amazon.co.uk',
  'amazon.de',
  'amazon.fr',
  'amazon.it',
  'amazon.es',
  'amazon.nl',
  'amazon.se',
  'amazon.pl',
  'amazon.com.be',
  'amazon.co.jp',
  'amazon.in',
  'amazon.com.au',
  'amazon.com.br',
  'amazon.com.mx',
  'amazon.sg',
  'amazon.sa',
  'amazon.ae',
  'amazon.com.tr',
  'amazon.eg',
  'smile.amazon.com',
  'amzn.com',
];

/**
 * Checks if a hostname or IP address points to an internal/private network.
 */
export function isPrivateHostnameOrIp(hostname: string): boolean {
  const cleanHost = hostname.trim().toLowerCase();

  if (
    cleanHost === 'localhost' ||
    cleanHost.endsWith('.localhost') ||
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal') ||
    cleanHost.endsWith('.lan') ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '0.0.0.0' ||
    cleanHost === '::1'
  ) {
    return true;
  }

  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(cleanHost)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 */
export function isSafePublicUrl(urlString: string): { isSafe: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isSafe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    if (isPrivateHostnameOrIp(parsed.hostname)) {
      return { isSafe: false, reason: 'Disallowed private or local hostname/IP' };
    }

    // Disallow non-standard ports for external web requests
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return { isSafe: false, reason: `Disallowed port: ${parsed.port}` };
    }

    return { isSafe: true, parsedUrl: parsed };
  } catch {
    return { isSafe: false, reason: 'Invalid URL syntax' };
  }
}

/**
 * Validates whether a URL belongs to Amazon or recognized Amazon shorteners.
 */
export function isRecognizedAmazonHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');

  if (ALLOWED_AMAZON_SHORTENERS.includes(host)) {
    return true;
  }

  for (const domain of AMAZON_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Safely resolves Amazon short links with SSRF checks on every hop.
 */
export async function safelyExpandAmazonShortLink(shortUrl: string, maxHops = 5): Promise<string> {
  let currentUrl = shortUrl;
  let hops = 0;

  while (hops < maxHops) {
    const safety = isSafePublicUrl(currentUrl);
    if (!safety.isSafe || !safety.parsedUrl) {
      throw new Error(`SSRF blocked: ${safety.reason}`);
    }

    if (!isRecognizedAmazonHost(safety.parsedUrl.hostname)) {
      throw new Error(`Unrecognized Amazon domain: ${safety.parsedUrl.hostname}`);
    }

    // If it's already a direct amazon product/store URL, return it
    if (!ALLOWED_AMAZON_SHORTENERS.includes(safety.parsedUrl.hostname.toLowerCase().replace(/^www\./, ''))) {
      return currentUrl;
    }

    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const location = response.headers.get('location');
      if (!location || response.status < 300 || response.status >= 400) {
        // No further redirect, return current
        return currentUrl;
      }

      // Resolve relative redirect if any
      currentUrl = new URL(location, currentUrl).toString();
      hops++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to resolve short link: ${message}`);
    }
  }

  return currentUrl;
}
