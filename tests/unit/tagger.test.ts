import { describe, it, expect } from 'vitest';
import { validateAffiliateTag, buildAffiliateUrl } from '@/lib/amazon/tagger';

describe('Affiliate Tag Validator & Injector', () => {
  it('validates US/CA tags ending with -20', () => {
    expect(validateAffiliateTag('mybrand-20', 'US').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-20', 'CA').isValid).toBe(true);
    expect(validateAffiliateTag('invalid_tag', 'US').isValid).toBe(false);
  });

  it('validates UK/EU tags ending with -21', () => {
    expect(validateAffiliateTag('mybrand-21', 'GB').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-21', 'DE').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-21', 'FR').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-20', 'GB').isValid).toBe(false);
  });

  it('validates JP/AU/SG tags ending with -22', () => {
    expect(validateAffiliateTag('mybrand-22', 'JP').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-22', 'AU').isValid).toBe(true);
    expect(validateAffiliateTag('mybrand-22', 'SG').isValid).toBe(true);
  });

  it('injects affiliate tag and merges UTM parameters', () => {
    const url = 'https://amazon.co.uk/dp/B08N5WRWNW';
    const result = buildAffiliateUrl({
      url,
      tag: 'mybrand-21',
      marketplaceId: 'GB',
      utm: {
        source: 'newsletter',
        campaign: 'blackfriday',
      },
    });

    const parsed = new URL(result);
    expect(parsed.searchParams.get('tag')).toBe('mybrand-21');
    expect(parsed.searchParams.get('utm_source')).toBe('newsletter');
    expect(parsed.searchParams.get('utm_campaign')).toBe('blackfriday');
  });

  it('preserves existing path and replaces existing tag', () => {
    const url = 'https://amazon.com/dp/B08N5WRWNW?tag=old-20&other=keep';
    const result = buildAffiliateUrl({
      url,
      tag: 'new-20',
      marketplaceId: 'US',
    });

    const parsed = new URL(result);
    expect(parsed.searchParams.get('tag')).toBe('new-20');
    expect(parsed.searchParams.get('other')).toBe('keep');
  });
});
