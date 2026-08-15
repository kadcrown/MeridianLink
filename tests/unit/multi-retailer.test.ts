import { describe, it, expect } from 'vitest';
import {
  ImpactAdapter,
  HowlAdapter,
  CjAdapter,
  EpnAdapter,
  PartnerizeAdapter,
  resolveAdapter,
} from '../../src/lib/retailers/adapters';
import { encryptSecret, decryptSecret } from '../../src/lib/retailers/crypto';
import { scanAndGenerateDiffs } from '../../src/lib/integrations/youtube';

describe('Multi-Retailer Providers & Encryption', () => {
  it('encrypts and decrypts secrets at rest with AES-256-GCM', () => {
    const secret = 'my_super_secret_partner_key_12345';
    const encrypted = encryptSecret(secret);

    expect(encrypted.encryptedVal).not.toBe(secret);
    expect(encrypted.maskedSuffix).toBe('••••••••2345');

    const decrypted = decryptSecret(encrypted.encryptedVal, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe(secret);
  });

  it('Impact adapter generates correct deep link for Walmart', () => {
    const url = 'https://www.walmart.com/ip/standing-desk/12345';
    const transformed = ImpactAdapter.createAffiliateUrl(url, { mediaPartnerId: '9999' }, { subId: 'sub-test' });
    expect(transformed).toContain('goto.walmart.com/c/9999/sub-test');
    expect(transformed).toContain(encodeURIComponent(url));
  });

  it('Howl adapter transforms Target URL with creator ID', () => {
    const url = 'https://www.target.com/p/coffee-grinder/-/A-12345';
    const transformed = HowlAdapter.createAffiliateUrl(url, { howlUserId: 'creator123' });
    expect(transformed).toBe(`https://howl.me/c/creator123?url=${encodeURIComponent(url)}`);
  });

  it('CJ adapter transforms Barnes & Noble URL with publisher ID', () => {
    const url = 'https://www.barnesandnoble.com/w/book/12345';
    const transformed = CjAdapter.createAffiliateUrl(url, { publisherId: 'cj_pub_123' });
    expect(transformed).toContain('https://www.anrdoezrs.net/links/cj_pub_123/type/dlg/');
  });

  it('EPN adapter creates eBay Partner Network tracking URL', () => {
    const url = 'https://www.ebay.com/itm/1234567890';
    const transformed = EpnAdapter.createAffiliateUrl(url, { campaignId: 'epn_camp_555' });
    expect(transformed).toContain('rover.ebay.com/rover/1/711-53200-19255-0/1');
    expect(transformed).toContain('campid=epn_camp_555');
  });

  it('Partnerize adapter appends tracking token to Apple Music', () => {
    const url = 'https://music.apple.com/album/12345';
    const transformed = PartnerizeAdapter.createAffiliateUrl(url, { partnerizeToken: '1000l3' }, { subId: 'my-sub' });
    expect(transformed).toContain('at=1000l3');
    expect(transformed).toContain('ct=my-sub');
  });

  it('resolves correct adapter based on domain', () => {
    expect(resolveAdapter(undefined, 'https://www.walmart.com/ip/123').adapterKey).toBe('IMPACT');
    expect(resolveAdapter(undefined, 'https://www.ebay.com/itm/123').adapterKey).toBe('EPN');
  });

  it('scans YouTube video descriptions and generates valid replacement diffs', () => {
    const sampleVideos = [
      {
        id: 'v1',
        title: 'Desk Tour',
        publishedAt: '2026-08-01',
        description: 'Gear: https://www.amazon.com/dp/B09XS7JWHH and https://www.walmart.com/ip/desk/123',
      },
    ];

    const result = scanAndGenerateDiffs(sampleVideos, 'https://links.mybrand.com');
    expect(result.totalVideosScanned).toBe(1);
    expect(result.videosWithLinks).toBe(1);
    expect(result.items[0].linksFound.length).toBe(2);
    expect(result.items[0].proposedDescription).toContain('https://links.mybrand.com/r/yt-');
  });
});
