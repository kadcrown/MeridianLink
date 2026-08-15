import { describe, it, expect } from 'vitest';
import { extractAsin, generateSlug, parseAmazonUrl } from '@/lib/amazon/parser';

describe('Amazon URL Parser & ASIN Extractor', () => {
  it('extracts standard ASIN from /dp/ format', () => {
    const asin = extractAsin('/dp/B08N5WRWNW');
    expect(asin).toBe('B08N5WRWNW');
  });

  it('extracts ASIN from /gp/product/ format', () => {
    const asin = extractAsin('/Sony-Headphones/gp/product/B09XS7JWHH?ref=sr_1_1');
    expect(asin).toBe('B09XS7JWHH');
  });

  it('extracts ASIN from mobile /gp/aw/d/ format', () => {
    const asin = extractAsin('/gp/aw/d/B07FZ8S74R/ref=mp_s_a_1_1');
    expect(asin).toBe('B07FZ8S74R');
  });

  it('extracts ASIN from direct /ASIN path', () => {
    const asin = extractAsin('/B08N5WRWNW?psc=1');
    expect(asin).toBe('B08N5WRWNW');
  });

  it('generates clean, URL-safe slugs', () => {
    expect(generateSlug('Sony WH-1000XM5 Wireless Headphones!')).toBe('sony-wh-1000xm5-wireless-headphones');
    expect(generateSlug('B08N5WRWNW')).toBe('b08n5wrwnw');
  });

  it('parses full Amazon URL with tracking and query parameters', async () => {
    const url = 'https://www.amazon.com/Apple-AirPods-Pro-2nd-Generation/dp/B0D1XD1ZV3?tag=oldtag-20&ref=sr_1_1&utm_source=twitter&utm_medium=social';
    const parsed = await parseAmazonUrl(url);

    expect(parsed.asin).toBe('B0D1XD1ZV3');
    expect(parsed.marketplaceId).toBe('US');
    expect(parsed.marketplaceDomain).toBe('amazon.com');
    expect(parsed.existingTag).toBe('oldtag-20');
    expect(parsed.normalizedUrl).toBe('https://amazon.com/dp/B0D1XD1ZV3');
    expect(parsed.preservedUtm.source).toBe('twitter');
    expect(parsed.preservedUtm.medium).toBe('social');
  });

  it('parses international Amazon URLs correctly (e.g. UK, Germany, Japan)', async () => {
    const ukUrl = 'https://www.amazon.co.uk/dp/B08N5WRWNW';
    const parsedUk = await parseAmazonUrl(ukUrl);
    expect(parsedUk.marketplaceId).toBe('GB');
    expect(parsedUk.marketplaceDomain).toBe('amazon.co.uk');

    const deUrl = 'https://www.amazon.de/dp/B08N5WRWNW';
    const parsedDe = await parseAmazonUrl(deUrl);
    expect(parsedDe.marketplaceId).toBe('DE');
    expect(parsedDe.marketplaceDomain).toBe('amazon.de');

    const jpUrl = 'https://www.amazon.co.jp/dp/B08N5WRWNW';
    const parsedJp = await parseAmazonUrl(jpUrl);
    expect(parsedJp.marketplaceId).toBe('JP');
    expect(parsedJp.marketplaceDomain).toBe('amazon.co.jp');
  });

  it('rejects non-Amazon and invalid URLs', async () => {
    await expect(parseAmazonUrl('https://evil-site.com/dp/B08N5WRWNW')).rejects.toThrow();
    await expect(parseAmazonUrl('not-a-url')).rejects.toThrow();
  });
});
