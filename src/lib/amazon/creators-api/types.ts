/**
 * Amazon Creators API Type Definitions
 * Following official Amazon Creators API lower-camel-case specifications.
 */

export type CreatorsApiCredentialVersion = '3.1' | '3.2' | '3.3';

export type CreatorsApiState =
  | 'NOT_CONFIGURED'
  | 'CONFIG_INVALID'
  | 'CREDENTIALS_REGISTERED'
  | 'ELIGIBILITY_PENDING'
  | 'ELIGIBLE'
  | 'AUTH_FAILED'
  | 'MARKETPLACE_NOT_APPROVED'
  | 'PARTNER_TAG_MISSING'
  | 'RATE_LIMITED'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'DEPRECATED_PAAPI_DETECTED';

export type ProductProvenance =
  | 'MANUAL'
  | 'EXACT_ASIN'
  | 'EXACT_VARIATION'
  | 'PARENT_PRODUCT'
  | 'SEARCH_CANDIDATE'
  | 'SEARCH_FALLBACK'
  | 'UNVERIFIED'
  | 'UNAVAILABLE';

export interface CreatorsApiConfig {
  credentialId?: string;
  credentialSecret?: string;
  credentialVersion?: CreatorsApiCredentialVersion;
  defaultMarketplace?: string;
}

export interface CreatorsOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number; // Unix timestamp in ms
}

export interface GetItemsRequest {
  marketplace: string;
  partnerTag: string;
  itemIds: string[];
  itemIdType?: 'ASIN';
  resources?: string[];
}

export interface SearchItemsRequest {
  marketplace: string;
  partnerTag: string;
  keywords: string;
  searchIndex?: string;
  itemCount?: number;
  resources?: string[];
}

export interface GetVariationsRequest {
  marketplace: string;
  partnerTag: string;
  asin: string;
  variationCount?: number;
  resources?: string[];
}

export interface GetBrowseNodesRequest {
  marketplace: string;
  partnerTag: string;
  browseNodeIds: string[];
  resources?: string[];
}

export interface CreatorsItem {
  asin: string;
  title?: string;
  detailPageUrl?: string;
  imageUrl?: string;
  brand?: string;
  parentAsin?: string;
  isAvailable?: boolean;
  offersV2?: {
    listingPrice?: {
      amount: number;
      currency: string;
      displayAmount: string;
    };
    isEligibleForPrime?: boolean;
  };
}

export interface CreatorsApiResponse<T = unknown> {
  itemsResult?: {
    items: CreatorsItem[];
  };
  searchResult?: {
    items: CreatorsItem[];
    totalResultCount?: number;
  };
  variationsResult?: {
    items: CreatorsItem[];
    variationSummary?: {
      variationCount: number;
    };
  };
  browseNodesResult?: {
    browseNodes: Array<{ id: string; displayName: string }>;
  };
  errors?: Array<{ code: string; message: string }>;
  raw?: T;
}

export interface ConnectionTestResult {
  isConfigured: boolean;
  credentialVersion?: CreatorsApiCredentialVersion;
  authSuccess: boolean;
  catalogSuccess: boolean;
  state: CreatorsApiState;
  maskedId?: string;
  message: string;
  lastTestedAt: string;
}
