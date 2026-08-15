import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '@/lib/useragent/detector';

describe('User Agent & Bot Detector', () => {
  it('detects Googlebot crawler correctly', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const parsed = parseUserAgent(ua);
    expect(parsed.isBot).toBe(true);
    expect(parsed.deviceCategory).toBe('BOT');
    expect(parsed.botClassification).toBe('Googlebot');
  });

  it('detects Twitter / Facebook / Slack social preview bots', () => {
    expect(parseUserAgent('Twitterbot/1.0').isBot).toBe(true);
    expect(parseUserAgent('facebookexternalhit/1.1').isBot).toBe(true);
    expect(parseUserAgent('Slackbot-LinkExpanding 1.0').isBot).toBe(true);
  });

  it('detects iOS iPhone mobile browser', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const parsed = parseUserAgent(ua, 'en-US,en;q=0.9');
    expect(parsed.isBot).toBe(false);
    expect(parsed.deviceCategory).toBe('MOBILE');
    expect(parsed.osFamily).toBe('iOS');
    expect(parsed.browserFamily).toBe('Safari');
    expect(parsed.language).toBe('en-US');
  });

  it('detects Android mobile browser', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const parsed = parseUserAgent(ua, 'de-DE,de;q=0.9');
    expect(parsed.isBot).toBe(false);
    expect(parsed.deviceCategory).toBe('MOBILE');
    expect(parsed.osFamily).toBe('Android');
    expect(parsed.browserFamily).toBe('Chrome');
    expect(parsed.language).toBe('de-DE');
  });

  it('detects Desktop Windows and macOS browsers', () => {
    const winUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const winParsed = parseUserAgent(winUa);
    expect(winParsed.deviceCategory).toBe('DESKTOP');
    expect(winParsed.osFamily).toBe('Windows');
    expect(winParsed.browserFamily).toBe('Chrome');

    const macUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const macParsed = parseUserAgent(macUa);
    expect(macParsed.deviceCategory).toBe('DESKTOP');
    expect(macParsed.osFamily).toBe('macOS');
  });
});
