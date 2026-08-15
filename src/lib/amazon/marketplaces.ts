export interface AmazonMarketplace {
  id: string; // ISO 2-letter country code
  name: string;
  domain: string;
  currency: string;
  flag: string;
  tagSuffix: string;
  tagRegex: RegExp;
  alternateDomains: string[];
}

export const AMAZON_MARKETPLACES: Record<string, AmazonMarketplace> = {
  US: {
    id: 'US',
    name: 'United States',
    domain: 'amazon.com',
    currency: 'USD',
    flag: '🇺🇸',
    tagSuffix: '-20',
    tagRegex: /^[a-zA-Z0-9_-]+-20$/,
    alternateDomains: ['www.amazon.com', 'amzn.com', 'smile.amazon.com'],
  },
  CA: {
    id: 'CA',
    name: 'Canada',
    domain: 'amazon.ca',
    currency: 'CAD',
    flag: '🇨🇦',
    tagSuffix: '-20',
    tagRegex: /^[a-zA-Z0-9_-]+-20$/,
    alternateDomains: ['www.amazon.ca'],
  },
  GB: {
    id: 'GB',
    name: 'United Kingdom',
    domain: 'amazon.co.uk',
    currency: 'GBP',
    flag: '🇬🇧',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.co.uk', 'amazon.uk'],
  },
  DE: {
    id: 'DE',
    name: 'Germany',
    domain: 'amazon.de',
    currency: 'EUR',
    flag: '🇩🇪',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.de'],
  },
  FR: {
    id: 'FR',
    name: 'France',
    domain: 'amazon.fr',
    currency: 'EUR',
    flag: '🇫🇷',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.fr'],
  },
  IT: {
    id: 'IT',
    name: 'Italy',
    domain: 'amazon.it',
    currency: 'EUR',
    flag: '🇮🇹',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.it'],
  },
  ES: {
    id: 'ES',
    name: 'Spain',
    domain: 'amazon.es',
    currency: 'EUR',
    flag: '🇪🇸',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.es'],
  },
  NL: {
    id: 'NL',
    name: 'Netherlands',
    domain: 'amazon.nl',
    currency: 'EUR',
    flag: '🇳🇱',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.nl'],
  },
  SE: {
    id: 'SE',
    name: 'Sweden',
    domain: 'amazon.se',
    currency: 'SEK',
    flag: '🇸🇪',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.se'],
  },
  PL: {
    id: 'PL',
    name: 'Poland',
    domain: 'amazon.pl',
    currency: 'PLN',
    flag: '🇵🇱',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.pl'],
  },
  BE: {
    id: 'BE',
    name: 'Belgium',
    domain: 'amazon.com.be',
    currency: 'EUR',
    flag: '🇧🇪',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.com.be', 'amazon.com.be'],
  },
  JP: {
    id: 'JP',
    name: 'Japan',
    domain: 'amazon.co.jp',
    currency: 'JPY',
    flag: '🇯🇵',
    tagSuffix: '-22',
    tagRegex: /^[a-zA-Z0-9_-]+-22$/,
    alternateDomains: ['www.amazon.co.jp', 'amazon.jp'],
  },
  IN: {
    id: 'IN',
    name: 'India',
    domain: 'amazon.in',
    currency: 'INR',
    flag: '🇮🇳',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.in'],
  },
  AU: {
    id: 'AU',
    name: 'Australia',
    domain: 'amazon.com.au',
    currency: 'AUD',
    flag: '🇦🇺',
    tagSuffix: '-22',
    tagRegex: /^[a-zA-Z0-9_-]+-22$/,
    alternateDomains: ['www.amazon.com.au'],
  },
  BR: {
    id: 'BR',
    name: 'Brazil',
    domain: 'amazon.com.br',
    currency: 'BRL',
    flag: '🇧🇷',
    tagSuffix: '-20',
    tagRegex: /^[a-zA-Z0-9_-]+-20$/,
    alternateDomains: ['www.amazon.com.br'],
  },
  MX: {
    id: 'MX',
    name: 'Mexico',
    domain: 'amazon.com.mx',
    currency: 'MXN',
    flag: '🇲🇽',
    tagSuffix: '-20',
    tagRegex: /^[a-zA-Z0-9_-]+-20$/,
    alternateDomains: ['www.amazon.com.mx'],
  },
  SG: {
    id: 'SG',
    name: 'Singapore',
    domain: 'amazon.sg',
    currency: 'SGD',
    flag: '🇸🇬',
    tagSuffix: '-22',
    tagRegex: /^[a-zA-Z0-9_-]+-22$/,
    alternateDomains: ['www.amazon.sg'],
  },
  SA: {
    id: 'SA',
    name: 'Saudi Arabia',
    domain: 'amazon.sa',
    currency: 'SAR',
    flag: '🇸🇦',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.sa'],
  },
  AE: {
    id: 'AE',
    name: 'United Arab Emirates',
    domain: 'amazon.ae',
    currency: 'AED',
    flag: '🇦🇪',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.ae'],
  },
  TR: {
    id: 'TR',
    name: 'Turkey',
    domain: 'amazon.com.tr',
    currency: 'TRY',
    flag: '🇹🇷',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.com.tr'],
  },
  EG: {
    id: 'EG',
    name: 'Egypt',
    domain: 'amazon.eg',
    currency: 'EGP',
    flag: '🇪🇬',
    tagSuffix: '-21',
    tagRegex: /^[a-zA-Z0-9_-]+-21$/,
    alternateDomains: ['www.amazon.eg'],
  },
};

/**
 * Regional proximity routing fallback for visitors in countries without a dedicated Amazon store.
 */
export const COUNTRY_TO_MARKETPLACE_MAP: Record<string, string> = {
  // Direct matches
  US: 'US', CA: 'CA', GB: 'GB', UK: 'GB', DE: 'DE', FR: 'FR', IT: 'IT', ES: 'ES',
  NL: 'NL', SE: 'SE', PL: 'PL', BE: 'BE', JP: 'JP', IN: 'IN', AU: 'AU', BR: 'BR',
  MX: 'MX', SG: 'SG', SA: 'SA', AE: 'AE', TR: 'TR', EG: 'EG',

  // Proximity routing for Europe
  IE: 'GB', // Ireland -> UK
  AT: 'DE', // Austria -> Germany
  CH: 'DE', // Switzerland -> Germany
  LU: 'DE', // Luxembourg -> Germany
  DK: 'SE', // Denmark -> Sweden
  NO: 'SE', // Norway -> Sweden
  FI: 'SE', // Finland -> Sweden
  PT: 'ES', // Portugal -> Spain
  CZ: 'DE', // Czech Republic -> Germany
  SK: 'DE', // Slovakia -> Germany
  HU: 'DE', // Hungary -> Germany
  GR: 'DE', // Greece -> Germany
  RO: 'DE', // Romania -> Germany
  BG: 'DE', // Bulgaria -> Germany
  HR: 'DE', // Croatia -> Germany
  SI: 'IT', // Slovenia -> Italy
  EE: 'SE', // Estonia -> Sweden
  LV: 'SE', // Latvia -> Sweden
  LT: 'PL', // Lithuania -> Poland
  IS: 'GB', // Iceland -> UK

  // Asia / Pacific
  NZ: 'AU', // New Zealand -> Australia
  MY: 'SG', // Malaysia -> Singapore
  ID: 'SG', // Indonesia -> Singapore
  PH: 'SG', // Philippines -> Singapore
  TH: 'SG', // Thailand -> Singapore
  VN: 'SG', // Vietnam -> Singapore
  HK: 'JP', // Hong Kong -> Japan / US
  TW: 'JP', // Taiwan -> Japan / US
  KR: 'JP', // South Korea -> Japan

  // Americas
  CL: 'US', // Chile -> US
  CO: 'US', // Colombia -> US
  AR: 'US', // Argentina -> US
  PE: 'US', // Peru -> US

  // Middle East
  KW: 'AE', // Kuwait -> UAE
  QA: 'AE', // Qatar -> UAE
  BH: 'AE', // Bahrain -> UAE
  OM: 'AE', // Oman -> UAE
  JO: 'SA', // Jordan -> Saudi Arabia
};

/**
 * Returns marketplace configuration given a 2-letter country code or domain name.
 */
export function getMarketplace(countryOrDomain: string): AmazonMarketplace | undefined {
  const upper = countryOrDomain.toUpperCase();
  if (AMAZON_MARKETPLACES[upper]) {
    return AMAZON_MARKETPLACES[upper];
  }

  // Check mapped countries
  const mappedCode = COUNTRY_TO_MARKETPLACE_MAP[upper];
  if (mappedCode && AMAZON_MARKETPLACES[mappedCode]) {
    return AMAZON_MARKETPLACES[mappedCode];
  }

  // Check by domain name
  const lower = countryOrDomain.toLowerCase().replace(/^www\./, '');
  return Object.values(AMAZON_MARKETPLACES).find(
    (m) => m.domain === lower || m.alternateDomains.some((d) => d.replace(/^www\./, '') === lower)
  );
}
