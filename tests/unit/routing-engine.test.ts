import { describe, it, expect } from 'vitest';
import { resolveDestination, selectAbVariant } from '@/lib/routing/engine';

describe('Deterministic Routing Engine & Fallback Resolver', () => {
  const baseSmartLink = {
    id: 'link-1',
    slug: 'sony-headphones',
    linkType: 'SMART' as const,
    originalUrl: 'https://amazon.com/dp/B09XS7JWHH',
    asin: 'B09XS7JWHH',
    productTitle: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    defaultMarketplace: 'US',
    utmSource: 'youtube',
    utmMedium: 'video',
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
  };

  const affiliateTags = {
    US: 'mychannel-20',
    CA: 'mychannel-ca-20',
    GB: 'mychannel-uk-21',
    DE: 'mychannel-de-21',
    JP: 'mychannel-jp-22',
    AU: 'mychannel-au-22',
  };

  it('routes UK visitors to amazon.co.uk with UK tag and ASIN transfer', async () => {
    const result = await resolveDestination({
      smartLink: baseSmartLink,
      affiliateTags,
      visitorCountry: 'GB',
    });

    expect(result.targetMarketplace).toBe('GB');
    expect(result.appliedTag).toBe('mychannel-uk-21');
    expect(result.resolutionType).toBe('ASIN_TRANSFER');
    expect(result.targetUrl).toContain('https://amazon.co.uk/dp/B09XS7JWHH');
    expect(result.targetUrl).toContain('tag=mychannel-uk-21');
    expect(result.targetUrl).toContain('utm_source=youtube');
  });

  it('routes Canadian visitors to amazon.ca with Canadian tag', async () => {
    const result = await resolveDestination({
      smartLink: baseSmartLink,
      affiliateTags,
      visitorCountry: 'CA',
    });

    expect(result.targetMarketplace).toBe('CA');
    expect(result.appliedTag).toBe('mychannel-ca-20');
    expect(result.targetUrl).toContain('https://amazon.ca/dp/B09XS7JWHH');
    expect(result.targetUrl).toContain('tag=mychannel-ca-20');
  });

  it('routes proximity European countries (e.g. Ireland -> UK, Austria -> Germany)', async () => {
    // Ireland -> GB
    const ieResult = await resolveDestination({
      smartLink: baseSmartLink,
      affiliateTags,
      visitorCountry: 'IE',
    });
    expect(ieResult.targetMarketplace).toBe('GB');
    expect(ieResult.appliedTag).toBe('mychannel-uk-21');

    // Austria -> DE
    const atResult = await resolveDestination({
      smartLink: baseSmartLink,
      affiliateTags,
      visitorCountry: 'AT',
    });
    expect(atResult.targetMarketplace).toBe('DE');
    expect(atResult.appliedTag).toBe('mychannel-de-21');
  });

  it('honors manual destination override with highest priority', async () => {
    const manualDestinations = [
      {
        id: 'dest-de-custom',
        countryCode: 'DE',
        marketplace: 'DE',
        url: 'https://amazon.de/dp/B09XS7JWHH?custom=deal',
        isManual: true,
        isVerified: true,
        fallbackType: 'EXACT_MATCH',
        isActive: true,
      },
    ];

    const result = await resolveDestination({
      smartLink: baseSmartLink,
      destinations: manualDestinations,
      affiliateTags,
      visitorCountry: 'DE',
    });

    expect(result.resolutionType).toBe('MANUAL_OVERRIDE');
    expect(result.destinationId).toBe('dest-de-custom');
    expect(result.targetUrl).toContain('custom=deal');
    expect(result.targetUrl).toContain('tag=mychannel-de-21');
  });

  it('handles A/B test links with deterministic visitor assignment', () => {
    const variants = [
      { id: 'v1', name: 'Variant A (Amazon US)', destinationUrl: 'https://amazon.com/dp/B01', marketplace: 'US', weight: 50, isActive: true },
      { id: 'v2', name: 'Variant B (Amazon CA)', destinationUrl: 'https://amazon.ca/dp/B02', marketplace: 'CA', weight: 50, isActive: true },
    ];

    // Same seed should always produce the exact same variant
    const sel1 = selectAbVariant(variants, 'user-fingerprint-abc');
    const sel2 = selectAbVariant(variants, 'user-fingerprint-abc');
    expect(sel1?.variant.id).toBe(sel2?.variant.id);

    // Different seed should distribute
    const counts: Record<string, number> = { v1: 0, v2: 0 };
    for (let i = 0; i < 200; i++) {
      const s = selectAbVariant(variants, `visitor-${i}`);
      if (s) counts[s.variant.id]++;
    }
    // Both variants should receive substantial traffic (~50/50)
    expect(counts.v1).toBeGreaterThan(60);
    expect(counts.v2).toBeGreaterThan(60);
  });
});
