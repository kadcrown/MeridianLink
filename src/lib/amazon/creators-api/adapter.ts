import {
  CreatorsApiConfig,
  GetItemsRequest,
  SearchItemsRequest,
  GetVariationsRequest,
  GetBrowseNodesRequest,
  CreatorsApiResponse,
  ConnectionTestResult,
  CreatorsApiState,
} from './types';
import { getCreatorsAccessToken, maskCredentialId, redactSecrets, resolveCreatorsApiConfig } from './oauth';
import { creatorsApiCircuitBreaker } from './circuit-breaker';
import { AMAZON_MARKETPLACES } from '../marketplaces';
import { logger } from '../../logger';

export class AmazonCreatorsApiAdapter {
  private config?: CreatorsApiConfig;
  private readonly baseUrl: string;

  constructor(config?: CreatorsApiConfig, baseUrl = 'https://creatorsapi.amazon') {
    this.config = config;
    this.baseUrl = baseUrl;
  }

  /**
   * Resolves the Amazon marketplace domain (e.g., www.amazon.com).
   */
  private getMarketplaceDomain(marketplaceId: string): string {
    const upper = marketplaceId.toUpperCase();
    const mp = AMAZON_MARKETPLACES[upper];
    if (!mp) {
      throw new Error(`Unsupported marketplace identifier: ${marketplaceId}`);
    }
    return mp.domain;
  }

  /**
   * Low-level authenticated request handler with circuit breaker and 401 retry.
   */
  private async request<T = unknown>(
    operationPath: string,
    marketplaceId: string,
    body: Record<string, unknown>,
    retryCount = 0
  ): Promise<CreatorsApiResponse<T>> {
    if (creatorsApiCircuitBreaker.isOpen()) {
      const status = creatorsApiCircuitBreaker.getStatus();
      throw new Error(`Creators API Circuit Breaker is OPEN. Upstream paused for ${Math.ceil(status.cooldownRemainingMs / 1000)}s.`);
    }

    const domain = this.getMarketplaceDomain(marketplaceId);
    const token = await getCreatorsAccessToken(this.config);

    const url = `${this.baseUrl}${operationPath.startsWith('/') ? '' : '/'}${operationPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-marketplace': domain,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 401 && retryCount === 0) {
        logger.warn('Received 401 from Creators API. Refreshing token and retrying once...');
        await getCreatorsAccessToken(this.config, true); // force refresh
        return this.request<T>(operationPath, marketplaceId, body, 1);
      }

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
        creatorsApiCircuitBreaker.recordFailure(retryAfter);
        throw new Error(`Creators API Rate Limited (HTTP 429). Retry-After: ${retryAfter}s.`);
      }

      if (!res.ok) {
        const errText = await res.text();
        const safeError = redactSecrets(errText);
        creatorsApiCircuitBreaker.recordFailure();

        if (res.status === 403) {
          throw new Error(`Creators API 403 Forbidden: AssociateNotEligible or Marketplace not authorized.`);
        }
        throw new Error(`Creators API Error (${res.status}): ${safeError}`);
      }

      creatorsApiCircuitBreaker.recordSuccess();
      const data = await res.json();
      return data as CreatorsApiResponse<T>;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Creators API request execution error', { error: redactSecrets(msg), operationPath });
      throw error;
    }
  }

  /**
   * GetItems: Retrieve product details by ASIN.
   */
  public async getItems(req: GetItemsRequest): Promise<CreatorsApiResponse> {
    const domain = this.getMarketplaceDomain(req.marketplace);
    const body = {
      marketplace: domain,
      partnerTag: req.partnerTag,
      itemIds: req.itemIds,
      itemIdType: req.itemIdType || 'ASIN',
      resources: req.resources || [
        'ItemInfo.Title',
        'ItemInfo.ProductInfo',
        'ItemInfo.Features',
        'Images.Primary.Large',
        'OffersV2.Listings.Price',
        'OffersV2.Listings.Availability',
      ],
    };

    return this.request('/catalog/v1/getItems', req.marketplace, body);
  }

  /**
   * SearchItems: Search for products using keywords.
   */
  public async searchItems(req: SearchItemsRequest): Promise<CreatorsApiResponse> {
    const domain = this.getMarketplaceDomain(req.marketplace);
    const body = {
      marketplace: domain,
      partnerTag: req.partnerTag,
      keywords: req.keywords,
      searchIndex: req.searchIndex || 'All',
      itemCount: req.itemCount || 5,
      resources: req.resources || [
        'ItemInfo.Title',
        'Images.Primary.Medium',
        'OffersV2.Listings.Price',
      ],
    };

    return this.request('/catalog/v1/searchItems', req.marketplace, body);
  }

  /**
   * GetVariations: Retrieve product variations and child ASINs.
   */
  public async getVariations(req: GetVariationsRequest): Promise<CreatorsApiResponse> {
    const domain = this.getMarketplaceDomain(req.marketplace);
    const body = {
      marketplace: domain,
      partnerTag: req.partnerTag,
      asin: req.asin,
      variationCount: req.variationCount || 10,
      resources: req.resources || [
        'ItemInfo.Title',
        'VariationSummary.VariationDimension',
      ],
    };

    return this.request('/catalog/v1/getVariations', req.marketplace, body);
  }

  /**
   * GetBrowseNodes: Retrieve browse nodes hierarchy.
   */
  public async getBrowseNodes(req: GetBrowseNodesRequest): Promise<CreatorsApiResponse> {
    const domain = this.getMarketplaceDomain(req.marketplace);
    const body = {
      marketplace: domain,
      partnerTag: req.partnerTag,
      browseNodeIds: req.browseNodeIds,
      resources: req.resources || ['BrowseNodes.Ancestor', 'BrowseNodes.Children'],
    };

    return this.request('/catalog/v1/getBrowseNodes', req.marketplace, body);
  }

  /**
   * Test Connection: Non-destructively verifies OAuth credentials and minimal catalog accessibility.
   */
  public async testConnection(partnerTag = 'meridian-20'): Promise<ConnectionTestResult> {
    const resolved = await resolveCreatorsApiConfig(this.config);
    const { credentialId, credentialSecret, credentialVersion } = resolved;
    const version = credentialVersion || '3.1';

    if (!credentialId || !credentialSecret) {
      return {
        isConfigured: false,
        authSuccess: false,
        catalogSuccess: false,
        state: 'NOT_CONFIGURED',
        maskedId: maskCredentialId(credentialId),
        message: 'No Amazon Creators API credentials configured. Enter credentials in Settings.',
        lastTestedAt: new Date().toISOString(),
      };
    }

    let authSuccess = false;
    let catalogSuccess = false;
    let state: CreatorsApiState = 'CREDENTIALS_REGISTERED';
    let message = 'Credentials detected.';

    try {
      // Step 1: OAuth Token exchange
      await getCreatorsAccessToken(this.config, true);
      authSuccess = true;
      state = 'ELIGIBILITY_PENDING';
      message = 'OAuth 2.0 authentication successful.';

      // Step 2: Minimal test GetItems call
      try {
        await this.getItems({
          marketplace: 'US',
          partnerTag,
          itemIds: ['B09XS7JWHH'],
          resources: ['ItemInfo.Title'],
        });
        catalogSuccess = true;
        state = 'ELIGIBLE';
        message = 'Connection verified! OAuth authentication and catalog access confirmed.';
      } catch (catErr: any) {
        const catMsg = catErr?.message || '';
        if (catMsg.includes('AssociateNotEligible')) {
          state = 'ELIGIBILITY_PENDING';
          message = 'OAuth authenticated, but account eligibility review is pending with Amazon Associates.';
        } else {
          message = `OAuth authenticated, but catalog test returned: ${catMsg}`;
        }
      }
    } catch (authErr: any) {
      authSuccess = false;
      state = 'AUTH_FAILED';
      message = `OAuth authentication failed: ${authErr?.message || 'Invalid credentials'}`;
    }

    return {
      isConfigured: true,
      credentialVersion: version,
      authSuccess,
      catalogSuccess,
      state,
      maskedId: maskCredentialId(credentialId),
      message,
      lastTestedAt: new Date().toISOString(),
    };
  }
}
