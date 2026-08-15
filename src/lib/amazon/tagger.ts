import { URL } from 'url';
import { getMarketplace } from './marketplaces';

export interface TagInjectionOptions {
  url: string;
  tag?: string;
  marketplaceId: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

/**
 * Validates an Amazon Affiliate Tracking ID format for a given marketplace.
 */
export function validateAffiliateTag(tag: string, marketplaceId: string): { isValid: boolean; error?: string } {
  const cleanTag = tag.trim();
  if (!cleanTag) {
    return { isValid: false, error: 'Tracking ID cannot be empty' };
  }

  const mp = getMarketplace(marketplaceId);
  if (!mp) {
    return { isValid: true }; // Custom/unknown marketplace fallback
  }

  if (!mp.tagRegex.test(cleanTag)) {
    return {
      isValid: false,
      error: `Invalid tag format for ${mp.name}. Typically ends with '${mp.tagSuffix}' (e.g., 'myaffiliate${mp.tagSuffix}')`,
    };
  }

  return { isValid: true };
}

/**
 * Injects the regional affiliate tag and allowed UTM parameters into an Amazon destination URL.
 */
export function buildAffiliateUrl(options: TagInjectionOptions): string {
  const { url, tag, utm } = options;

  try {
    const parsed = new URL(url);

    // Set or replace affiliate tag
    if (tag && tag.trim()) {
      parsed.searchParams.set('tag', tag.trim());
    }

    // Add UTM parameters if provided and not already present
    if (utm) {
      if (utm.source && !parsed.searchParams.has('utm_source')) {
        parsed.searchParams.set('utm_source', utm.source);
      }
      if (utm.medium && !parsed.searchParams.has('utm_medium')) {
        parsed.searchParams.set('utm_medium', utm.medium);
      }
      if (utm.campaign && !parsed.searchParams.has('utm_campaign')) {
        parsed.searchParams.set('utm_campaign', utm.campaign);
      }
      if (utm.term && !parsed.searchParams.has('utm_term')) {
        parsed.searchParams.set('utm_term', utm.term);
      }
      if (utm.content && !parsed.searchParams.has('utm_content')) {
        parsed.searchParams.set('utm_content', utm.content);
      }
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}
