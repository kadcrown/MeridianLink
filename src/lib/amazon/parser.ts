import { URL } from 'url';
import { getMarketplace, AMAZON_MARKETPLACES } from './marketplaces';
import { safelyExpandAmazonShortLink, isRecognizedAmazonHost } from '../security/ssrf';

export interface ParsedAmazonUrl {
  originalUrl: string;
  normalizedUrl: string;
  marketplaceId: string;
  marketplaceDomain: string;
  asin?: string;
  existingTag?: string;
  suggestedTitle?: string;
  suggestedSlug: string;
  searchKeywords?: string;
  preservedUtm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

// Common Amazon ASIN regex: 10 alphanumeric characters (uppercase letters and digits, often starting with B)
const ASIN_REGEX = /(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin|o|product)\/([A-Z0-9]{10})(?:[/?]|$)/i;
const DIRECT_ASIN_PATH_REGEX = /^\/([A-Z0-9]{10})(?:[/?]|$)/i;

// Tracking / noise parameters that should be stripped
const TRACKING_PARAMS_TO_REMOVE = [
  'ref',
  'ref_',
  'linkCode',
  'linkId',
  'camp',
  'creative',
  'creativeASIN',
  'ascsubtag',
  'keywords',
  'qid',
  'sr',
  'crid',
  'sprefix',
  'pd_rd_w',
  'pd_rd_r',
  'pd_rd_wg',
  'pf_rd_p',
  'pf_rd_r',
  'pf_rd_s',
  'pf_rd_t',
  'pf_rd_i',
  'pf_rd_m',
  'th',
  'psc',
  'tag', // Will be re-injected per region
];

/**
 * Extracts 10-character Amazon ASIN from URL path or query params.
 */
export function extractAsin(urlPathAndQuery: string): string | undefined {
  const match = urlPathAndQuery.match(ASIN_REGEX);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }

  const directMatch = urlPathAndQuery.match(DIRECT_ASIN_PATH_REGEX);
  if (directMatch && directMatch[1]) {
    return directMatch[1].toUpperCase();
  }

  return undefined;
}

/**
 * Generates a clean URL slug from a title or ASIN.
 */
export function generateSlug(titleOrAsin?: string): string {
  if (!titleOrAsin) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `link-${randomSuffix}`;
  }

  const sanitized = titleOrAsin
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);

  if (!sanitized) {
    return `item-${Math.random().toString(36).substring(2, 7)}`;
  }

  return sanitized;
}

/**
 * Parses and extracts all metadata from an Amazon product or short URL.
 */
export async function parseAmazonUrl(rawUrl: string): Promise<ParsedAmazonUrl> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('URL cannot be empty');
  }

  // 1. Safe expansion if it is an Amazon short link
  const expandedUrl = await safelyExpandAmazonShortLink(trimmed);
  const parsed = new URL(expandedUrl);

  // 2. Validate host
  if (!isRecognizedAmazonHost(parsed.hostname)) {
    throw new Error(`Hostname "${parsed.hostname}" is not a recognized Amazon domain or short link`);
  }

  // 3. Determine marketplace
  const marketplace = getMarketplace(parsed.hostname) || AMAZON_MARKETPLACES.US;
  const marketplaceId = marketplace.id;
  const marketplaceDomain = marketplace.domain;

  // 4. Extract ASIN
  const asin = extractAsin(parsed.pathname + parsed.search);

  // 5. Extract existing affiliate tag if present
  const existingTag = parsed.searchParams.get('tag') || undefined;

  // 6. Extract UTM parameters to preserve
  const preservedUtm = {
    source: parsed.searchParams.get('utm_source') || undefined,
    medium: parsed.searchParams.get('utm_medium') || undefined,
    campaign: parsed.searchParams.get('utm_campaign') || undefined,
    term: parsed.searchParams.get('utm_term') || undefined,
    content: parsed.searchParams.get('utm_content') || undefined,
  };

  // 7. Extract search keywords if it's a search page
  let searchKeywords = parsed.searchParams.get('k') || parsed.searchParams.get('field-keywords') || undefined;

  // 8. Try to extract suggested title from product path (e.g. /Sony-WH-1000XM5-Canceling-Headphones/dp/B09XS7JWHH)
  let suggestedTitle: string | undefined;
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const firstPart = decodeURIComponent(pathParts[0]);
    if (firstPart !== 'dp' && firstPart !== 'gp' && firstPart !== 'exec' && !firstPart.match(/^[A-Z0-9]{10}$/i)) {
      suggestedTitle = firstPart.replace(/-/g, ' ');
    }
  }

  if (!suggestedTitle && asin) {
    suggestedTitle = `Amazon Item (${asin})`;
  } else if (!suggestedTitle && searchKeywords) {
    suggestedTitle = `Amazon Search: ${searchKeywords}`;
  }

  // 9. Build canonical normalized URL
  let normalizedUrl: string;
  if (asin) {
    normalizedUrl = `https://${marketplaceDomain}/dp/${asin}`;
  } else {
    // Clean unwanted tracking params
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (!TRACKING_PARAMS_TO_REMOVE.includes(key.toLowerCase()) && !key.toLowerCase().startsWith('utm_')) {
        cleanParams.append(key, value);
      }
    }
    const queryString = cleanParams.toString();
    normalizedUrl = `https://${marketplaceDomain}${parsed.pathname}${queryString ? `?${queryString}` : ''}`;
  }

  const suggestedSlug = generateSlug(suggestedTitle || asin);

  return {
    originalUrl: trimmed,
    normalizedUrl,
    marketplaceId,
    marketplaceDomain,
    asin,
    existingTag,
    suggestedTitle,
    suggestedSlug,
    searchKeywords,
    preservedUtm,
  };
}
