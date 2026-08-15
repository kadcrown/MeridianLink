import { env } from '../env';

export interface GeoLocationResult {
  countryCode: string;
  source: 'proxy_header' | 'dev_override' | 'default';
  headerUsed?: string;
}

const ISO_2_REGEX = /^[A-Z]{2}$/;

/**
 * Resolves the visitor's ISO 2-letter country code following strict priority.
 */
export function resolveVisitorCountry(
  headers: Headers | Record<string, string | string[] | undefined>,
  searchParams?: URLSearchParams | Record<string, string | undefined>,
  defaultCountry = 'US'
): GeoLocationResult {
  // 1. Development / Testing override (query param for testing)
  if (searchParams) {
    const testCountry =
      searchParams instanceof URLSearchParams
        ? searchParams.get('__country') || searchParams.get('__test_country')
        : searchParams.__country || searchParams.__test_country;

    if (testCountry && ISO_2_REGEX.test(testCountry.toUpperCase())) {
      return {
        countryCode: testCountry.toUpperCase(),
        source: 'dev_override',
      };
    }
  }

  // 2. Trusted reverse proxy headers
  const trustedHeaderKeys = (env.TRUSTED_PROXY_HEADERS || 'CF-IPCountry,X-Geo-Country,X-Vercel-IP-Country,Fly-Client-IP-Country')
    .split(',')
    .map((h) => h.trim().toLowerCase());

  // Helper to extract header safely
  const getHeader = (key: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(key);
    }
    const val = headers[key] || headers[key.toLowerCase()];
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  };

  for (const headerKey of trustedHeaderKeys) {
    const headerVal = getHeader(headerKey);
    if (headerVal) {
      const code = headerVal.trim().toUpperCase();
      const primaryCode = code.split(',')[0].trim();
      if (primaryCode && ISO_2_REGEX.test(primaryCode) && primaryCode !== 'XX' && primaryCode !== 'T1') {
        return {
          countryCode: primaryCode,
          source: 'proxy_header',
          headerUsed: headerKey,
        };
      }
    }
  }

  const standardFallbacks = ['x-country-code', 'cloudfront-viewer-country', 'fastly-client-ip-country'];
  for (const key of standardFallbacks) {
    const val = getHeader(key);
    if (val) {
      const code = val.trim().toUpperCase();
      if (ISO_2_REGEX.test(code) && code !== 'XX') {
        return {
          countryCode: code,
          source: 'proxy_header',
          headerUsed: key,
        };
      }
    }
  }

  // 3. Fallback to default country
  return {
    countryCode: defaultCountry.toUpperCase(),
    source: 'default',
  };
}
