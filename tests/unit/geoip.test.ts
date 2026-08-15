import { describe, it, expect } from 'vitest';
import { resolveVisitorCountry } from '@/lib/geoip/resolver';

describe('GeoIP Visitor Country Resolver', () => {
  it('resolves country from CF-IPCountry header', () => {
    const headers = { 'cf-ipcountry': 'CA' };
    const result = resolveVisitorCountry(headers);
    expect(result.countryCode).toBe('CA');
    expect(result.source).toBe('proxy_header');
  });

  it('resolves country from X-Geo-Country header', () => {
    const headers = { 'x-geo-country': 'DE' };
    const result = resolveVisitorCountry(headers);
    expect(result.countryCode).toBe('DE');
    expect(result.source).toBe('proxy_header');
  });

  it('resolves country from development query override in non-production', () => {
    const headers = {};
    const searchParams = new URLSearchParams({ __country: 'JP' });
    const result = resolveVisitorCountry(headers, searchParams);
    expect(result.countryCode).toBe('JP');
    expect(result.source).toBe('dev_override');
  });

  it('falls back to default country when no proxy headers exist', () => {
    const headers = {};
    const result = resolveVisitorCountry(headers, undefined, 'US');
    expect(result.countryCode).toBe('US');
    expect(result.source).toBe('default');
  });

  it('handles invalid / special proxy country codes gracefully (e.g. XX or T1)', () => {
    const headers = { 'cf-ipcountry': 'XX' };
    const result = resolveVisitorCountry(headers, undefined, 'US');
    expect(result.countryCode).toBe('US');
  });
});
