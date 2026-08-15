export interface AdapterContext {
  linkId?: string;
  groupId?: string;
  subId?: string;
  utmSource?: string;
  utmCampaign?: string;
}

export interface ProviderAdapter {
  adapterKey: string;
  supportsDomain(hostname: string): boolean;
  createAffiliateUrl(
    originalUrl: string,
    config: Record<string, string>,
    context?: AdapterContext
  ): string;
  extractExistingAttribution(url: string): Record<string, string> | null;
  removeAttribution(url: string): string;
}

/**
 * Normalizes hostnames by stripping www. and lowercasing.
 */
export function normalizeHostname(urlOrHost: string): string {
  try {
    let hostname = urlOrHost;
    if (urlOrHost.includes('://')) {
      hostname = new URL(urlOrHost).hostname;
    }
    return hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return urlOrHost.toLowerCase();
  }
}

/**
 * Impact Network Adapter
 */
export const ImpactAdapter: ProviderAdapter = {
  adapterKey: 'IMPACT',
  supportsDomain(hostname: string) {
    const h = normalizeHostname(hostname);
    return ['bestbuy.com', 'bestbuy.ca', 'walmart.com', 'target.com', 'homedepot.com', 'backcountry.com', 'basspro.com', 'chewy.com', 'dickssportinggoods.com', 'kohls.com', 'lenovo.com', 'shopmoment.com', 'adorama.com'].includes(h);
  },
  createAffiliateUrl(originalUrl, config, context) {
    const mediaPartnerId = config.mediaPartnerId || config.partnerId || config.affiliateId;
    if (!mediaPartnerId) return originalUrl;

    const encoded = encodeURIComponent(originalUrl);
    const subId = context?.subId || context?.linkId || 'meridian';

    // Check custom template in config or default generic Impact redirect
    if (config.urlTemplate) {
      return config.urlTemplate
        .replace('{mediaPartnerId}', mediaPartnerId)
        .replace('{subId}', subId)
        .replace('{encodedUrl}', encoded)
        .replace('{url}', originalUrl);
    }

    const host = normalizeHostname(originalUrl);
    if (host.includes('walmart.com')) {
      return `https://goto.walmart.com/c/${mediaPartnerId}/${subId}/565706/9383?veh=aff&sourceid=imp_000011112222333344&u=${encoded}`;
    }
    if (host.includes('bestbuy.ca')) {
      return `https://bestbuycanada.7tiv.net/c/${mediaPartnerId}/${subId}/6157?u=${encoded}`;
    }
    if (host.includes('bestbuy.com')) {
      return `https://bestbuy.7tiv.net/c/${mediaPartnerId}/${subId}/6156?u=${encoded}`;
    }

    return `https://impact.7tiv.net/c/${mediaPartnerId}/${subId}/?u=${encoded}`;
  },
  extractExistingAttribution(url) {
    try {
      const u = new URL(url);
      if (u.pathname.includes('/c/')) {
        const parts = u.pathname.split('/c/')[1]?.split('/');
        return { mediaPartnerId: parts?.[0] || '' };
      }
    } catch {}
    return null;
  },
  removeAttribution(url) {
    try {
      const u = new URL(url);
      const target = u.searchParams.get('u');
      if (target) return decodeURIComponent(target);
    } catch {}
    return url;
  },
};

/**
 * Howl Network Adapter (Planet Howl)
 */
export const HowlAdapter: ProviderAdapter = {
  adapterKey: 'HOWL',
  supportsDomain(hostname: string) {
    const h = normalizeHostname(hostname);
    return ['target.com', 'macys.com', 'samsung.com', 'drbrandtskincare.com', 'dermaflash.com', 'cocoandeve.com', 'bookshop.org', 'crutchfield.com', 'motorola.com', 'soundcore.com', 'eufy.com', 'getsnooz.com', 'stockx.com'].includes(h);
  },
  createAffiliateUrl(originalUrl, config) {
    const userId = config.howlUserId || config.creatorId || config.affiliateId;
    if (!userId) return originalUrl;

    const encoded = encodeURIComponent(originalUrl);
    return `https://howl.me/c/${userId}?url=${encoded}`;
  },
  extractExistingAttribution(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('howl.me')) {
        const parts = u.pathname.split('/c/')[1]?.split('/');
        return { howlUserId: parts?.[0] || '' };
      }
    } catch {}
    return null;
  },
  removeAttribution(url) {
    try {
      const u = new URL(url);
      const target = u.searchParams.get('url');
      if (target) return decodeURIComponent(target);
    } catch {}
    return url;
  },
};

/**
 * CJ Affiliate Adapter (Commission Junction)
 */
export const CjAdapter: ProviderAdapter = {
  adapterKey: 'CJ',
  supportsDomain(hostname: string) {
    const h = normalizeHostname(hostname);
    return ['barnesandnoble.com', 'booksamillion.com', 'hp.com', 'lowes.com', 'officedepot.com', 'overstock.com', 'tigerdirect.com', 'walgreens.com', 'wayfair.com'].includes(h);
  },
  createAffiliateUrl(originalUrl, config, context) {
    const publisherId = config.publisherId || config.affiliateId;
    if (!publisherId) return originalUrl;

    const encoded = encodeURIComponent(originalUrl);
    const subId = context?.subId || context?.linkId;
    const subParam = subId ? `?sid=${encodeURIComponent(subId)}` : '';

    return `https://www.anrdoezrs.net/links/${publisherId}/type/dlg/${encoded}${subParam}`;
  },
  extractExistingAttribution(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('anrdoezrs.net') || u.hostname.includes('dpbolvw.net')) {
        const parts = u.pathname.split('/links/')[1]?.split('/');
        return { publisherId: parts?.[0] || '' };
      }
    } catch {}
    return null;
  },
  removeAttribution(url) {
    try {
      const u = new URL(url);
      if (u.pathname.includes('/dlg/')) {
        const target = u.pathname.split('/dlg/')[1];
        if (target) return decodeURIComponent(target);
      }
    } catch {}
    return url;
  },
};

/**
 * eBay Partner Network (EPN) Adapter
 */
export const EpnAdapter: ProviderAdapter = {
  adapterKey: 'EPN',
  supportsDomain(hostname: string) {
    const h = normalizeHostname(hostname);
    return h.startsWith('ebay.');
  },
  createAffiliateUrl(originalUrl, config, context) {
    const campaignId = config.campaignId || config.campid;
    if (!campaignId) return originalUrl;

    const encoded = encodeURIComponent(originalUrl);
    const subId = context?.subId || context?.linkId ? `&customid=${encodeURIComponent(context.subId || context.linkId || '')}` : '';

    return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?mpre=${encoded}&campid=${campaignId}&toolid=10001${subId}`;
  },
  extractExistingAttribution(url) {
    try {
      const u = new URL(url);
      const campid = u.searchParams.get('campid');
      if (campid) return { campaignId: campid };
    } catch {}
    return null;
  },
  removeAttribution(url) {
    try {
      const u = new URL(url);
      const mpre = u.searchParams.get('mpre');
      if (mpre) return decodeURIComponent(mpre);
    } catch {}
    return url;
  },
};

/**
 * Partnerize / Apple Music Adapter
 */
export const PartnerizeAdapter: ProviderAdapter = {
  adapterKey: 'PARTNERIZE',
  supportsDomain(hostname: string) {
    const h = normalizeHostname(hostname);
    return ['music.apple.com', 'itunes.apple.com', 'apple.com', 'iherb.com', 'adorama.com'].includes(h);
  },
  createAffiliateUrl(originalUrl, config, context) {
    const token = config.partnerizeToken || config.at || config.publisherId;
    if (!token) return originalUrl;

    try {
      const u = new URL(originalUrl);
      u.searchParams.set('at', token);
      if (context?.subId || context?.linkId) {
        u.searchParams.set('ct', context.subId || context.linkId || '');
      }
      return u.toString();
    } catch {
      return originalUrl;
    }
  },
  extractExistingAttribution(url) {
    try {
      const u = new URL(url);
      const at = u.searchParams.get('at');
      if (at) return { partnerizeToken: at };
    } catch {}
    return null;
  },
  removeAttribution(url) {
    try {
      const u = new URL(url);
      u.searchParams.delete('at');
      u.searchParams.delete('ct');
      return u.toString();
    } catch {
      return url;
    }
  },
};

/**
 * Guaranteed Manual Fallback Adapter
 */
export const ManualFallbackAdapter: ProviderAdapter = {
  adapterKey: 'MANUAL',
  supportsDomain() {
    return true;
  },
  createAffiliateUrl(originalUrl) {
    return originalUrl;
  },
  extractExistingAttribution() {
    return null;
  },
  removeAttribution(url) {
    return url;
  },
};

export const ADAPTER_REGISTRY: Record<string, ProviderAdapter> = {
  IMPACT: ImpactAdapter,
  HOWL: HowlAdapter,
  CJ: CjAdapter,
  EPN: EpnAdapter,
  PARTNERIZE: PartnerizeAdapter,
  MANUAL: ManualFallbackAdapter,
};

/**
 * Resolves the appropriate provider adapter for a destination URL.
 */
export function resolveAdapter(adapterKey?: string, url?: string): ProviderAdapter {
  if (adapterKey && ADAPTER_REGISTRY[adapterKey]) {
    return ADAPTER_REGISTRY[adapterKey];
  }

  if (url) {
    const host = normalizeHostname(url);
    for (const adapter of Object.values(ADAPTER_REGISTRY)) {
      if (adapter.supportsDomain(host)) {
        return adapter;
      }
    }
  }

  return ManualFallbackAdapter;
}
