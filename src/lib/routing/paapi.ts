import { getMarketplace } from '../amazon/marketplaces';

export interface CatalogMatchResult {
  isVerified: boolean;
  asin?: string;
  destinationUrl?: string;
  source: 'paapi_verified' | 'asin_transferred' | 'search_fallback' | 'manual';
}

export interface ICatalogMatcher {
  resolveRegionalProduct(options: {
    asin?: string;
    targetMarketplaceId: string;
    productTitle?: string;
    searchKeywords?: string;
  }): Promise<CatalogMatchResult>;
}

/**
 * Transparent catalog matcher that operates without PA-API credentials by default,
 * using deterministic ASIN transfer and keyword search fallback.
 */
export class StandardCatalogMatcher implements ICatalogMatcher {
  async resolveRegionalProduct(options: {
    asin?: string;
    targetMarketplaceId: string;
    productTitle?: string;
    searchKeywords?: string;
  }): Promise<CatalogMatchResult> {
    const { asin, targetMarketplaceId, productTitle, searchKeywords } = options;
    const mp = getMarketplace(targetMarketplaceId);

    if (!mp) {
      return {
        isVerified: false,
        source: 'asin_transferred',
      };
    }

    // 1. Direct ASIN transfer to regional domain
    if (asin) {
      return {
        isVerified: false, // Transparent / unverified without live PA-API verification
        asin,
        destinationUrl: `https://${mp.domain}/dp/${asin}`,
        source: 'asin_transferred',
      };
    }

    // 2. Keyword search fallback
    const query = searchKeywords || productTitle;
    if (query) {
      const encodedQuery = encodeURIComponent(query);
      return {
        isVerified: false,
        destinationUrl: `https://${mp.domain}/s?k=${encodedQuery}`,
        source: 'search_fallback',
      };
    }

    // 3. Fallback to homepage
    return {
      isVerified: false,
      destinationUrl: `https://${mp.domain}`,
      source: 'search_fallback',
    };
  }
}

export const defaultCatalogMatcher = new StandardCatalogMatcher();
