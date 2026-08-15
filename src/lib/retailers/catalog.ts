export interface SeedNetwork {
  slug: string;
  name: string;
  websiteUrl: string;
  adapterKey: string;
}

export interface SeedRetailer {
  slug: string;
  name: string;
  websiteUrl: string;
  isAmazon?: boolean;
  domains: string[];
}

export interface SeedProgramField {
  key: string;
  label: string;
  placeholder?: string;
  fieldType: 'TEXT' | 'SECRET' | 'SELECT' | 'URL';
  isRequired: boolean;
  isSecret: boolean;
  helpText?: string;
}

export interface SeedProgram {
  retailerSlug: string;
  networkSlug: string;
  name: string;
  slug: string;
  countryCode: string;
  marketplace?: string;
  capabilityLevel: 'IDENTIFIER_ONLY' | 'TRACKING_URL_TEMPLATE' | 'DEEPLINK_API' | 'PRODUCT_CATALOG_API' | 'FULL_COMMERCE_API' | 'MANUAL_ONLY';
  connectionType: string;
  urlTemplate?: string;
  documentationUrl?: string;
  isDiscontinued?: boolean;
  statusNote?: string;
  fields: SeedProgramField[];
}

export const SEED_NETWORKS: SeedNetwork[] = [
  { slug: 'amazon-associates', name: 'Amazon Associates', websiteUrl: 'https://affiliate-program.amazon.com', adapterKey: 'AMAZON' },
  { slug: 'amazon-seller-networks', name: 'Amazon Seller Networks', websiteUrl: 'https://levanta.io', adapterKey: 'SELLER_NETWORK' },
  { slug: 'impact', name: 'Impact', websiteUrl: 'https://impact.com', adapterKey: 'IMPACT' },
  { slug: 'partnerize', name: 'Partnerize', websiteUrl: 'https://partnerize.com', adapterKey: 'PARTNERIZE' },
  { slug: 'howl', name: 'Howl', websiteUrl: 'https://planethowl.com', adapterKey: 'HOWL' },
  { slug: 'cj-affiliate', name: 'CJ Affiliate', websiteUrl: 'https://www.cj.com', adapterKey: 'CJ' },
  { slug: 'rakuten', name: 'Rakuten Advertising', websiteUrl: 'https://rakutenadvertising.com', adapterKey: 'RAKUTEN' },
  { slug: 'ebay-partner-network', name: 'eBay Partner Network', websiteUrl: 'https://partnernetwork.ebay.com', adapterKey: 'EPN' },
  { slug: 'awin', name: 'Awin', websiteUrl: 'https://www.awin.com', adapterKey: 'AWIN' },
  { slug: 'skimlinks', name: 'Skimlinks', websiteUrl: 'https://skimlinks.com', adapterKey: 'SKIMLINKS' },
  { slug: 'sovrn', name: 'Sovrn //Commerce', websiteUrl: 'https://www.sovrn.com/commerce', adapterKey: 'SOVRN' },
  { slug: 'direct', name: 'Direct Retailer Program', websiteUrl: '', adapterKey: 'DIRECT' },
];

export const SEED_RETAILERS: SeedRetailer[] = [
  { slug: 'amazon', name: 'Amazon', websiteUrl: 'https://www.amazon.com', isAmazon: true, domains: ['amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.com.be', 'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.com.br', 'amazon.com.mx', 'amazon.sg', 'amazon.sa', 'amazon.ae', 'amazon.com.tr', 'amazon.eg', 'amazon.cn', 'amazon.ie'] },
  { slug: 'best-buy', name: 'Best Buy', websiteUrl: 'https://www.bestbuy.com', domains: ['bestbuy.com', 'bestbuy.ca'] },
  { slug: 'walmart', name: 'Walmart', websiteUrl: 'https://www.walmart.com', domains: ['walmart.com'] },
  { slug: 'target', name: 'Target', websiteUrl: 'https://www.target.com', domains: ['target.com'] },
  { slug: 'ebay', name: 'eBay', websiteUrl: 'https://www.ebay.com', domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.ca', 'ebay.com.au', 'ebay.fr', 'ebay.it', 'ebay.es', 'ebay.nl', 'ebay.pl', 'ebay.at', 'ebay.ch', 'ebay.ie'] },
  { slug: 'bh-photo', name: 'B&H Photo Video', websiteUrl: 'https://www.bhphotovideo.com', domains: ['bhphotovideo.com'] },
  { slug: 'adorama', name: 'Adorama', websiteUrl: 'https://www.adorama.com', domains: ['adorama.com'] },
  { slug: 'apple-music', name: 'Apple Music & iTunes', websiteUrl: 'https://www.apple.com/apple-music/', domains: ['music.apple.com', 'itunes.apple.com', 'apple.com'] },
  { slug: 'anker', name: 'Anker', websiteUrl: 'https://www.anker.com', domains: ['anker.com'] },
  { slug: 'backcountry', name: 'Backcountry', websiteUrl: 'https://www.backcountry.com', domains: ['backcountry.com'] },
  { slug: 'barnes-noble', name: 'Barnes & Noble', websiteUrl: 'https://www.barnesandnoble.com', domains: ['barnesandnoble.com'] },
  { slug: 'bass-pro-shops', name: 'Bass Pro Shops', websiteUrl: 'https://www.basspro.com', domains: ['basspro.com'] },
  { slug: 'bloomingdales', name: 'Bloomingdale\'s', websiteUrl: 'https://www.bloomingdales.com', domains: ['bloomingdales.com'] },
  { slug: 'books-a-million', name: 'Books-A-Million', websiteUrl: 'https://www.booksamillion.com', domains: ['booksamillion.com'] },
  { slug: 'bookshop', name: 'Bookshop.org', websiteUrl: 'https://bookshop.org', domains: ['bookshop.org'] },
  { slug: 'chewy', name: 'Chewy', websiteUrl: 'https://www.chewy.com', domains: ['chewy.com'] },
  { slug: 'coco-eve', name: 'Coco & Eve', websiteUrl: 'https://www.cocoandeve.com', domains: ['cocoandeve.com'] },
  { slug: 'crutchfield', name: 'Crutchfield', websiteUrl: 'https://www.crutchfield.com', domains: ['crutchfield.com'] },
  { slug: 'dermaflash', name: 'Dermaflash', websiteUrl: 'https://dermaflash.com', domains: ['dermaflash.com'] },
  { slug: 'dicks-sporting-goods', name: 'DICK\'S Sporting Goods', websiteUrl: 'https://www.dickssportinggoods.com', domains: ['dickssportinggoods.com'] },
  { slug: 'dr-brandt', name: 'Dr. Brandt Skincare', websiteUrl: 'https://www.drbrandtskincare.com', domains: ['drbrandtskincare.com'] },
  { slug: 'etsy', name: 'Etsy', websiteUrl: 'https://www.etsy.com', domains: ['etsy.com'] },
  { slug: 'eufy', name: 'Eufy', websiteUrl: 'https://www.eufy.com', domains: ['eufy.com'] },
  { slug: 'gamestop', name: 'GameStop', websiteUrl: 'https://www.gamestop.com', domains: ['gamestop.com'] },
  { slug: 'hp', name: 'HP', websiteUrl: 'https://www.hp.com', domains: ['hp.com'] },
  { slug: 'iherb', name: 'iHerb', websiteUrl: 'https://www.iherb.com', domains: ['iherb.com'] },
  { slug: 'kobo', name: 'Kobo', websiteUrl: 'https://www.kobo.com', domains: ['kobo.com'] },
  { slug: 'kohls', name: 'Kohl\'s', websiteUrl: 'https://www.kohls.com', domains: ['kohls.com'] },
  { slug: 'lenovo', name: 'Lenovo', websiteUrl: 'https://www.lenovo.com', domains: ['lenovo.com'] },
  { slug: 'lowes', name: 'Lowe\'s', websiteUrl: 'https://www.lowes.com', domains: ['lowes.com'] },
  { slug: 'macys', name: 'Macy\'s', websiteUrl: 'https://www.macys.com', domains: ['macys.com'] },
  { slug: 'microsoft', name: 'Microsoft Store', websiteUrl: 'https://www.microsoft.com', domains: ['microsoft.com'] },
  { slug: 'moment', name: 'Moment', websiteUrl: 'https://www.shopmoment.com', domains: ['shopmoment.com'] },
  { slug: 'motorola', name: 'Motorola', websiteUrl: 'https://www.motorola.com', domains: ['motorola.com'] },
  { slug: 'newegg', name: 'Newegg', websiteUrl: 'https://www.newegg.com', domains: ['newegg.com'] },
  { slug: 'office-depot', name: 'Office Depot', websiteUrl: 'https://www.officedepot.com', domains: ['officedepot.com'] },
  { slug: 'overstock', name: 'Overstock', websiteUrl: 'https://www.overstock.com', domains: ['overstock.com'] },
  { slug: 'samsung', name: 'Samsung', websiteUrl: 'https://www.samsung.com', domains: ['samsung.com'] },
  { slug: 'skimlinks-aggregator', name: 'Skimlinks Commerce', websiteUrl: 'https://skimlinks.com', domains: ['*'] },
  { slug: 'snooz', name: 'Snooz', websiteUrl: 'https://getsnooz.com', domains: ['getsnooz.com'] },
  { slug: 'soundcore', name: 'Soundcore', websiteUrl: 'https://www.soundcore.com', domains: ['soundcore.com'] },
  { slug: 'sovrn-aggregator', name: 'Sovrn //Commerce', websiteUrl: 'https://www.sovrn.com', domains: ['*'] },
  { slug: 'stockx', name: 'StockX', websiteUrl: 'https://stockx.com', domains: ['stockx.com'] },
  { slug: 'the-book-depository', name: 'The Book Depository', websiteUrl: 'https://www.bookdepository.com', domains: ['bookdepository.com'] },
  { slug: 'the-home-depot', name: 'The Home Depot', websiteUrl: 'https://www.homedepot.com', domains: ['homedepot.com'] },
  { slug: 'tigerdirect', name: 'TigerDirect', websiteUrl: 'https://www.tigerdirect.com', domains: ['tigerdirect.com'] },
  { slug: 'walgreens', name: 'Walgreens', websiteUrl: 'https://www.walgreens.com', domains: ['walgreens.com'] },
  { slug: 'wayfair', name: 'Wayfair', websiteUrl: 'https://www.wayfair.com', domains: ['wayfair.com'] },
  { slug: 'archer', name: 'Archer (Amazon Seller Network)', websiteUrl: 'https://archeraffiliates.com', isAmazon: true, domains: ['amazon.com'] },
  { slug: 'levanta', name: 'Levanta (Amazon Seller Network)', websiteUrl: 'https://levanta.io', isAmazon: true, domains: ['amazon.com'] },
  { slug: 'maverickx', name: 'MaverickX (Amazon Seller Network)', websiteUrl: 'https://maverickx.com', isAmazon: true, domains: ['amazon.com'] },
  { slug: 'partnerboost', name: 'PartnerBoost (Amazon Seller Network)', websiteUrl: 'https://partnerboost.com', isAmazon: true, domains: ['amazon.com'] },
  { slug: 'wayward', name: 'Wayward (Amazon Seller Network)', websiteUrl: 'https://wayward.io', isAmazon: true, domains: ['amazon.com'] },
];

export const SEED_PROGRAMS: SeedProgram[] = [
  // 1. Amazon Marketplaces (23 stores)
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon US Associates',
    slug: 'amazon-us',
    countryCode: 'US',
    marketplace: 'US',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.com/dp/{asin}?tag={partnerTag}',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-20', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon Canada Associates',
    slug: 'amazon-ca',
    countryCode: 'CA',
    marketplace: 'CA',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.ca/dp/{asin}?tag={partnerTag}',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-ca-20', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon UK Associates',
    slug: 'amazon-gb',
    countryCode: 'GB',
    marketplace: 'GB',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.co.uk/dp/{asin}?tag={partnerTag}',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-uk-21', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon Germany Associates',
    slug: 'amazon-de',
    countryCode: 'DE',
    marketplace: 'DE',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.de/dp/{asin}?tag={partnerTag}',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-de-21', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon France Associates',
    slug: 'amazon-fr',
    countryCode: 'FR',
    marketplace: 'FR',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.fr/dp/{asin}?tag={partnerTag}',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-fr-21', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'amazon',
    networkSlug: 'amazon-associates',
    name: 'Amazon Turkey Associates',
    slug: 'amazon-tr',
    countryCode: 'TR',
    marketplace: 'TR',
    capabilityLevel: 'PRODUCT_CATALOG_API',
    connectionType: 'OAUTH_AND_TAG',
    urlTemplate: 'https://www.amazon.com.tr/dp/{asin}?tag={partnerTag}',
    statusNote: 'Creators API supported; verify affiliate-program availability.',
    fields: [{ key: 'partnerTag', label: 'Associates Store Tag', placeholder: 'e.g. mystore-tr-21', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 2. Amazon Seller Networks
  {
    retailerSlug: 'archer',
    networkSlug: 'amazon-seller-networks',
    name: 'Archer — Amazon Seller Network',
    slug: 'archer-amazon',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'SUB_ID_TEMPLATE',
    urlTemplate: 'https://www.amazon.com/dp/{asin}?maas=maas_adg_api_{archerId}&ref_={archerRef}',
    fields: [{ key: 'archerId', label: 'Archer Publisher ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'levanta',
    networkSlug: 'amazon-seller-networks',
    name: 'Levanta — Amazon Seller Network',
    slug: 'levanta-amazon',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'SUB_ID_TEMPLATE',
    urlTemplate: 'https://www.amazon.com/dp/{asin}?linkCode=ll1&tag={levantaTag}',
    fields: [{ key: 'levantaTag', label: 'Levanta Partner Tag', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 3. Best Buy
  {
    retailerSlug: 'best-buy',
    networkSlug: 'impact',
    name: 'Best Buy US — Impact',
    slug: 'best-buy-us-impact',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://bestbuy.7tiv.net/c/{mediaPartnerId}/{subId}/6156?u={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Media Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'best-buy',
    networkSlug: 'impact',
    name: 'Best Buy Canada — Impact',
    slug: 'best-buy-ca-impact',
    countryCode: 'CA',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://bestbuycanada.7tiv.net/c/{mediaPartnerId}/{subId}/6157?u={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Media Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 4. Walmart
  {
    retailerSlug: 'walmart',
    networkSlug: 'impact',
    name: 'Walmart US — Impact',
    slug: 'walmart-us-impact',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://goto.walmart.com/c/{mediaPartnerId}/{subId}/565706/9383?veh=aff&sourceid=imp_000011112222333344&u={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Media Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 5. Target
  {
    retailerSlug: 'target',
    networkSlug: 'impact',
    name: 'Target — Impact',
    slug: 'target-us-impact',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://target.georiot.com/Proxy.ashx?tsid={mediaPartnerId}&dest={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'target',
    networkSlug: 'howl',
    name: 'Target US — Howl',
    slug: 'target-us-howl',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://howl.me/c/{howlUserId}?url={encodedUrl}',
    fields: [{ key: 'howlUserId', label: 'Howl Creator ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 6. eBay Partner Network
  {
    retailerSlug: 'ebay',
    networkSlug: 'ebay-partner-network',
    name: 'eBay US — EPN',
    slug: 'ebay-us-epn',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://rover.ebay.com/rover/1/711-53200-19255-0/1?mpre={encodedUrl}&campid={campaignId}&toolid=10001',
    fields: [{ key: 'campaignId', label: 'EPN Campaign ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'ebay',
    networkSlug: 'ebay-partner-network',
    name: 'eBay UK — EPN',
    slug: 'ebay-gb-epn',
    countryCode: 'GB',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://rover.ebay.com/rover/1/710-53481-19255-0/1?mpre={encodedUrl}&campid={campaignId}&toolid=10001',
    fields: [{ key: 'campaignId', label: 'EPN Campaign ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 7. B&H Photo & Adorama
  {
    retailerSlug: 'bh-photo',
    networkSlug: 'direct',
    name: 'B&H Photo International',
    slug: 'bh-photo-direct',
    countryCode: 'GLOBAL',
    capabilityLevel: 'IDENTIFIER_ONLY',
    connectionType: 'QUERY_PARAM',
    urlTemplate: '{url}?BI={bhPartnerId}&kbid={bhPartnerId}',
    fields: [{ key: 'bhPartnerId', label: 'B&H Partner BI Number', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'adorama',
    networkSlug: 'impact',
    name: 'Adorama — Impact',
    slug: 'adorama-impact',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://adorama.evyy.net/c/{mediaPartnerId}/51996/1036?u={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 8. Apple Music / iTunes
  {
    retailerSlug: 'apple-music',
    networkSlug: 'partnerize',
    name: 'iTunes / Apple Music International — Partnerize',
    slug: 'apple-music-partnerize',
    countryCode: 'GLOBAL',
    capabilityLevel: 'IDENTIFIER_ONLY',
    connectionType: 'QUERY_PARAM',
    urlTemplate: '{url}?at={partnerizeToken}&ct={subId}',
    fields: [{ key: 'partnerizeToken', label: 'Partnerize Affiliate Token (at)', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 9. Backcountry, Barnes & Noble, Bass Pro Shops
  {
    retailerSlug: 'backcountry',
    networkSlug: 'impact',
    name: 'Backcountry US — Impact',
    slug: 'backcountry-us-impact',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://backcountry.pxf.io/c/{mediaPartnerId}/54946/5311?u={encodedUrl}',
    fields: [{ key: 'mediaPartnerId', label: 'Impact Partner ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'barnes-noble',
    networkSlug: 'cj-affiliate',
    name: 'Barnes & Noble — CJ Affiliate',
    slug: 'barnes-noble-cj',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://www.anrdoezrs.net/links/{publisherId}/type/dlg/{encodedUrl}',
    fields: [{ key: 'publisherId', label: 'CJ Publisher ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 10. The Book Depository (Marked as discontinued/needs verification)
  {
    retailerSlug: 'the-book-depository',
    networkSlug: 'awin',
    name: 'The Book Depository US — Awin',
    slug: 'book-depository-awin',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    isDiscontinued: true,
    statusNote: 'Program potentially discontinued. Verify destination operation.',
    urlTemplate: 'https://www.awin1.com/cread.php?awinmid=5478&awinaffid={awinAffId}&ued={encodedUrl}',
    fields: [{ key: 'awinAffId', label: 'Awin Affiliate ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 11. TigerDirect (Marked as needs verification)
  {
    retailerSlug: 'tigerdirect',
    networkSlug: 'cj-affiliate',
    name: 'TigerDirect US — CJ Affiliate',
    slug: 'tigerdirect-cj',
    countryCode: 'US',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    statusNote: 'Requires current availability verification.',
    urlTemplate: 'https://www.dpbolvw.net/links/{publisherId}/type/dlg/{encodedUrl}',
    fields: [{ key: 'publisherId', label: 'CJ Publisher ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },

  // 12. Skimlinks & Sovrn Commerce
  {
    retailerSlug: 'skimlinks-aggregator',
    networkSlug: 'skimlinks',
    name: 'Skimlinks Universal Aggregator',
    slug: 'skimlinks-universal',
    countryCode: 'GLOBAL',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://go.skimresources.com?id={publisherId}&xs=1&url={encodedUrl}',
    fields: [{ key: 'publisherId', label: 'Skimlinks Publisher ID', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
  {
    retailerSlug: 'sovrn-aggregator',
    networkSlug: 'sovrn',
    name: 'Sovrn //Commerce Universal Aggregator',
    slug: 'sovrn-universal',
    countryCode: 'GLOBAL',
    capabilityLevel: 'TRACKING_URL_TEMPLATE',
    connectionType: 'URL_TEMPLATE',
    urlTemplate: 'https://redirect.viglink.com?key={apiKey}&u={encodedUrl}',
    fields: [{ key: 'apiKey', label: 'Sovrn API Key', fieldType: 'TEXT', isRequired: true, isSecret: false }],
  },
];
