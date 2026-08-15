export type DeviceCategory = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BOT';

export interface UserAgentDetails {
  deviceCategory: DeviceCategory;
  osFamily: string;
  browserFamily: string;
  isBot: boolean;
  botClassification?: string;
  language: string;
}

const BOT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Googlebot', pattern: /googlebot|adsbot-google|apis-google|feedfetcher-google/i },
  { name: 'Bingbot', pattern: /bingbot|msnbot|bingpreview/i },
  { name: 'Yahoo', pattern: /slurp/i },
  { name: 'DuckDuckBot', pattern: /duckduckbot/i },
  { name: 'Baiduspider', pattern: /baiduspider/i },
  { name: 'YandexBot', pattern: /yandexbot|yandeximages|yandexmedia/i },
  { name: 'Sogou', pattern: /sogou/i },
  { name: 'Twitterbot', pattern: /twitterbot/i },
  { name: 'FacebookBot', pattern: /facebookexternalhit|facebookcatalog/i },
  { name: 'LinkedInBot', pattern: /linkedinbot/i },
  { name: 'Slackbot', pattern: /slackbot|slack-imgproxy/i },
  { name: 'Discordbot', pattern: /discordbot/i },
  { name: 'TelegramBot', pattern: /telegrambot/i },
  { name: 'Applebot', pattern: /applebot/i },
  { name: 'Pinterest', pattern: /pinterest/i },
  { name: 'WhatsApp', pattern: /whatsapp/i },
  { name: 'UptimeRobot', pattern: /uptimerobot/i },
  { name: 'Pingdom', pattern: /pingdom/i },
  { name: 'AmazonBot', pattern: /amazonbot/i },
  { name: 'AhrefsBot', pattern: /ahrefsbot/i },
  { name: 'SemrushBot', pattern: /semrushbot/i },
  { name: 'Curl', pattern: /^curl\//i },
  { name: 'Wget', pattern: /^wget\//i },
  { name: 'Python', pattern: /python-requests|aiohttp|urllib/i },
  { name: 'Go-http-client', pattern: /go-http-client/i },
  { name: 'HeadlessChrome', pattern: /headlesschrome/i },
  { name: 'GenericBot', pattern: /bot|crawler|spider|scraper|preview|monitoring|archiver|transcoder/i },
];

/**
 * Classifies User-Agent and extracts hardware/software dimensions.
 */
export function parseUserAgent(userAgentString: string = '', acceptLanguageHeader: string = ''): UserAgentDetails {
  const ua = userAgentString.trim();

  // 1. Bot check
  for (const bot of BOT_PATTERNS) {
    if (bot.pattern.test(ua)) {
      return {
        deviceCategory: 'BOT',
        osFamily: 'Bot',
        browserFamily: bot.name,
        isBot: true,
        botClassification: bot.name,
        language: extractLanguage(acceptLanguageHeader),
      };
    }
  }

  // 2. Device Category
  let deviceCategory: DeviceCategory = 'DESKTOP';
  const isTablet = /(?:ipad|playbook|tablet|(?:android(?!.*mobile)))/i.test(ua);
  const isMobile = /(?:mobile|iphone|ipod|android.*mobile|blackberry|iemobile|kindle|opera mini)/i.test(ua);

  if (isTablet) {
    deviceCategory = 'TABLET';
  } else if (isMobile) {
    deviceCategory = 'MOBILE';
  }

  // 3. Operating System
  let osFamily = 'Unknown';
  if (/iphone|ipad|ipod/i.test(ua)) {
    osFamily = 'iOS';
  } else if (/android/i.test(ua)) {
    osFamily = 'Android';
  } else if (/windows nt/i.test(ua)) {
    osFamily = 'Windows';
  } else if (/mac os x|macintosh/i.test(ua)) {
    osFamily = 'macOS';
  } else if (/cros/i.test(ua)) {
    osFamily = 'ChromeOS';
  } else if (/linux/i.test(ua)) {
    osFamily = 'Linux';
  }

  // 4. Browser Family
  let browserFamily = 'Unknown';
  if (/edg\//i.test(ua)) {
    browserFamily = 'Edge';
  } else if (/opr\/|opera/i.test(ua)) {
    browserFamily = 'Opera';
  } else if (/samsungbrowser/i.test(ua)) {
    browserFamily = 'Samsung Internet';
  } else if (/chrome|crios/i.test(ua)) {
    browserFamily = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browserFamily = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browserFamily = 'Safari';
  }

  return {
    deviceCategory,
    osFamily,
    browserFamily,
    isBot: false,
    language: extractLanguage(acceptLanguageHeader),
  };
}

/**
 * Extracts primary ISO language code from Accept-Language header (e.g. "en-US,en;q=0.9" -> "en-US").
 */
export function extractLanguage(acceptLanguageHeader: string = ''): string {
  if (!acceptLanguageHeader) return 'en';
  const primary = acceptLanguageHeader.split(',')[0].trim().split(';')[0].trim();
  return primary || 'en';
}
