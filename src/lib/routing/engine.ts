import crypto from 'crypto';
import { getMarketplace, COUNTRY_TO_MARKETPLACE_MAP } from '../amazon/marketplaces';
import { buildAffiliateUrl } from '../amazon/tagger';
import { ICatalogMatcher, defaultCatalogMatcher } from './paapi';

export interface RouteResolutionInput {
  smartLink: {
    id: string;
    slug: string;
    linkType: 'SMART' | 'CHOICE' | 'AB_TEST';
    originalUrl: string;
    asin?: string | null;
    productTitle?: string | null;
    defaultMarketplace: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
  };
  destinations?: Array<{
    id: string;
    countryCode: string;
    marketplace: string;
    url: string;
    isManual: boolean;
    isVerified: boolean;
    fallbackType: string;
    isActive: boolean;
  }>;
  abVariants?: Array<{
    id: string;
    name: string;
    destinationUrl: string;
    marketplace: string;
    weight: number;
    isActive: boolean;
  }>;
  affiliateTags: Record<string, string>; // marketplaceId -> tag (resolved from Account + Group + Link hierarchy)
  visitorCountry: string;
  visitorHash?: string;
  incomingUtm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  catalogMatcher?: ICatalogMatcher;
}

export interface RouteResolutionOutput {
  targetUrl: string;
  targetMarketplace: string;
  appliedTag?: string;
  resolutionType: 'MANUAL_OVERRIDE' | 'CATALOG_MATCH' | 'ASIN_TRANSFER' | 'SEARCH_FALLBACK' | 'DEFAULT_DESTINATION' | 'AB_VARIANT' | 'CHOICE_PAGE';
  destinationId?: string;
  variantId?: string;
  isVerified: boolean;
  shouldShowChoicePage: boolean;
}

/**
 * Deterministically selects an A/B test variant based on salted visitor hash and weighted distribution.
 */
export function selectAbVariant(
  variants: Array<{ id: string; name: string; destinationUrl: string; marketplace: string; weight: number; isActive: boolean }>,
  seed: string
): { variant: typeof variants[0]; bucket: number } | undefined {
  const activeVariants = variants.filter((v) => v.isActive && v.weight > 0);
  if (activeVariants.length === 0) return undefined;

  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) return undefined;

  // Hash the seed to a deterministic integer in range [0, 9999]
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const bucket = parseInt(hash.substring(0, 8), 16) % 10000;
  const normalizedBucket = (bucket / 10000) * totalWeight;

  let accumulator = 0;
  for (const variant of activeVariants) {
    accumulator += variant.weight;
    if (normalizedBucket < accumulator) {
      return { variant, bucket: Math.floor((bucket / 10000) * 100) };
    }
  }

  return { variant: activeVariants[activeVariants.length - 1], bucket: 99 };
}

/**
 * Main Deterministic Routing Resolver for MeridianLink.
 */
export async function resolveDestination(input: RouteResolutionInput): Promise<RouteResolutionOutput> {
  const {
    smartLink,
    destinations = [],
    abVariants = [],
    affiliateTags,
    visitorCountry,
    visitorHash = 'anonymous',
    incomingUtm,
    catalogMatcher = defaultCatalogMatcher,
  } = input;

  // 1. Check if this is a Choice Page
  if (smartLink.linkType === 'CHOICE') {
    return {
      targetUrl: `/c/${smartLink.slug}`,
      targetMarketplace: smartLink.defaultMarketplace,
      resolutionType: 'CHOICE_PAGE',
      isVerified: true,
      shouldShowChoicePage: true,
    };
  }

  // Combine default smart link UTMs with any incoming UTM parameters (incoming takes precedence)
  const effectiveUtm = {
    source: incomingUtm?.source || smartLink.utmSource || undefined,
    medium: incomingUtm?.medium || smartLink.utmMedium || undefined,
    campaign: incomingUtm?.campaign || smartLink.utmCampaign || undefined,
    term: incomingUtm?.term || smartLink.utmTerm || undefined,
    content: incomingUtm?.content || smartLink.utmContent || undefined,
  };

  // 2. Check if this is an A/B Test Link
  if (smartLink.linkType === 'AB_TEST' && abVariants.length > 0) {
    const selected = selectAbVariant(abVariants, `${smartLink.id}:${visitorHash}`);
    if (selected) {
      const variant = selected.variant;
      const appliedTag = affiliateTags[variant.marketplace] || affiliateTags[smartLink.defaultMarketplace];
      const targetUrl = buildAffiliateUrl({
        url: variant.destinationUrl,
        tag: appliedTag,
        marketplaceId: variant.marketplace,
        utm: effectiveUtm,
      });

      return {
        targetUrl,
        targetMarketplace: variant.marketplace,
        appliedTag,
        resolutionType: 'AB_VARIANT',
        variantId: variant.id,
        isVerified: true,
        shouldShowChoicePage: false,
      };
    }
  }

  // 3. Resolve target Amazon Marketplace for visitor country
  const targetMarketplaceCode = COUNTRY_TO_MARKETPLACE_MAP[visitorCountry.toUpperCase()] || smartLink.defaultMarketplace || 'US';
  const targetMarketplace = getMarketplace(targetMarketplaceCode) || getMarketplace('US')!;

  // Priority 1: Manual destination configured specifically for this country or marketplace
  const manualDestination = destinations.find(
    (d) => d.isActive && (d.countryCode.toUpperCase() === visitorCountry.toUpperCase() || d.marketplace.toUpperCase() === targetMarketplaceCode.toUpperCase())
  );

  if (manualDestination && manualDestination.url) {
    const appliedTag = affiliateTags[manualDestination.marketplace] || affiliateTags[targetMarketplaceCode];
    const targetUrl = buildAffiliateUrl({
      url: manualDestination.url,
      tag: appliedTag,
      marketplaceId: manualDestination.marketplace,
      utm: effectiveUtm,
    });

    return {
      targetUrl,
      targetMarketplace: manualDestination.marketplace,
      appliedTag,
      resolutionType: 'MANUAL_OVERRIDE',
      destinationId: manualDestination.id,
      isVerified: manualDestination.isVerified,
      shouldShowChoicePage: false,
    };
  }

  // Priority 2 & 3: Catalog Matcher (Live PA-API match or ASIN domain transfer)
  if (smartLink.asin) {
    const match = await catalogMatcher.resolveRegionalProduct({
      asin: smartLink.asin,
      targetMarketplaceId: targetMarketplace.id,
      productTitle: smartLink.productTitle || undefined,
    });

    if (match.destinationUrl) {
      const appliedTag = affiliateTags[targetMarketplace.id];
      const targetUrl = buildAffiliateUrl({
        url: match.destinationUrl,
        tag: appliedTag,
        marketplaceId: targetMarketplace.id,
        utm: effectiveUtm,
      });

      return {
        targetUrl,
        targetMarketplace: targetMarketplace.id,
        appliedTag,
        resolutionType: match.source === 'paapi_verified' ? 'CATALOG_MATCH' : 'ASIN_TRANSFER',
        isVerified: match.isVerified,
        shouldShowChoicePage: false,
      };
    }
  }

  // Priority 4: Search query fallback if product title is known
  if (smartLink.productTitle) {
    const searchMatch = await catalogMatcher.resolveRegionalProduct({
      targetMarketplaceId: targetMarketplace.id,
      productTitle: smartLink.productTitle,
    });

    if (searchMatch.destinationUrl) {
      const appliedTag = affiliateTags[targetMarketplace.id];
      const targetUrl = buildAffiliateUrl({
        url: searchMatch.destinationUrl,
        tag: appliedTag,
        marketplaceId: targetMarketplace.id,
        utm: effectiveUtm,
      });

      return {
        targetUrl,
        targetMarketplace: targetMarketplace.id,
        appliedTag,
        resolutionType: 'SEARCH_FALLBACK',
        isVerified: false,
        shouldShowChoicePage: false,
      };
    }
  }

  // Priority 5: Original / Default destination
  const defaultTag = affiliateTags[smartLink.defaultMarketplace] || affiliateTags['US'];
  const targetUrl = buildAffiliateUrl({
    url: smartLink.originalUrl,
    tag: defaultTag,
    marketplaceId: smartLink.defaultMarketplace,
    utm: effectiveUtm,
  });

  return {
    targetUrl,
    targetMarketplace: smartLink.defaultMarketplace,
    appliedTag: defaultTag,
    resolutionType: 'DEFAULT_DESTINATION',
    isVerified: true,
    shouldShowChoicePage: false,
  };
}
