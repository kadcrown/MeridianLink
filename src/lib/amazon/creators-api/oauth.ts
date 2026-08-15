import {
  CreatorsApiCredentialVersion,
  CreatorsOAuthToken,
  CreatorsApiConfig,
} from './types';
import { prisma } from '../../db';
import { decryptSecret } from '../../retailers/crypto';
import { logger } from '../../logger';

export const CREATORS_TOKEN_ENDPOINTS: Record<CreatorsApiCredentialVersion, string> = {
  '3.1': 'https://api.amazon.com/auth/o2/token',
  '3.2': 'https://api.amazon.co.uk/auth/o2/token',
  '3.3': 'https://api.amazon.co.jp/auth/o2/token',
};

// Global in-memory cache and single-flight lock
let cachedToken: CreatorsOAuthToken | null = null;
let activeRefreshPromise: Promise<CreatorsOAuthToken> | null = null;

/**
 * Returns the OAuth 2.0 token endpoint for a specific credential version.
 */
export function getTokenEndpoint(version: CreatorsApiCredentialVersion): string {
  const endpoint = CREATORS_TOKEN_ENDPOINTS[version];
  if (!endpoint) {
    throw new Error(`Unsupported Creators API Credential Version: ${version}. Supported versions are 3.1, 3.2, 3.3.`);
  }
  return endpoint;
}

/**
 * Redacts secrets and bearer tokens from logs and error messages.
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  return text
    .replace(/Bearer\s+([A-Za-z0-9\-_.~+/]+=*)/gi, 'Bearer [REDACTED]')
    .replace(/client_secret=([^&]+)/gi, 'client_secret=[REDACTED]')
    .replace(/"client_secret":\s*"[^"]+"/gi, '"client_secret":"[REDACTED]"')
    .replace(/"access_token":\s*"[^"]+"/gi, '"access_token":"[REDACTED]"');
}

/**
 * Formats a masked preview of a credential (e.g., ••••••••1234).
 */
export function maskCredentialId(id?: string): string {
  if (!id) return 'Unconfigured';
  if (id.length <= 4) return '••••' + id;
  return '••••••••' + id.slice(-4);
}

/**
 * Resolves configuration from arguments, env variables, or encrypted database AppSetting.
 */
export async function resolveCreatorsApiConfig(override?: CreatorsApiConfig): Promise<CreatorsApiConfig> {
  let credentialId = override?.credentialId || process.env.AMAZON_CREATORS_CREDENTIAL_ID;
  let credentialSecret = override?.credentialSecret || process.env.AMAZON_CREATORS_CREDENTIAL_SECRET;
  let credentialVersion = (override?.credentialVersion || process.env.AMAZON_CREATORS_CREDENTIAL_VERSION || '3.1') as CreatorsApiCredentialVersion;
  let defaultMarketplace = override?.defaultMarketplace || process.env.AMAZON_CREATORS_DEFAULT_MARKETPLACE || 'US';

  // Check database settings if not set in env or override
  if (!credentialId || !credentialSecret) {
    try {
      const settings = await prisma.appSetting.findMany({
        where: {
          key: {
            in: [
              'AMAZON_CREATORS_CREDENTIAL_ID',
              'AMAZON_CREATORS_CREDENTIAL_SECRET_ENC',
              'AMAZON_CREATORS_CREDENTIAL_VERSION',
              'AMAZON_CREATORS_DEFAULT_MARKETPLACE',
            ],
          },
        },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));

      if (!credentialId && map.has('AMAZON_CREATORS_CREDENTIAL_ID')) {
        credentialId = map.get('AMAZON_CREATORS_CREDENTIAL_ID');
      }

      if (!credentialSecret && map.has('AMAZON_CREATORS_CREDENTIAL_SECRET_ENC')) {
        const encData = JSON.parse(map.get('AMAZON_CREATORS_CREDENTIAL_SECRET_ENC')!);
        credentialSecret = decryptSecret(encData.encryptedVal, encData.iv, encData.authTag);
      }

      if (map.has('AMAZON_CREATORS_CREDENTIAL_VERSION')) {
        credentialVersion = map.get('AMAZON_CREATORS_CREDENTIAL_VERSION') as CreatorsApiCredentialVersion;
      }

      if (map.has('AMAZON_CREATORS_DEFAULT_MARKETPLACE')) {
        defaultMarketplace = map.get('AMAZON_CREATORS_DEFAULT_MARKETPLACE')!;
      }
    } catch {
      // ignore db errors on init
    }
  }

  return {
    credentialId,
    credentialSecret,
    credentialVersion,
    defaultMarketplace,
  };
}

/**
 * Fetches an OAuth 2.0 Access Token using client-credentials flow with single-flight deduplication.
 */
export async function getCreatorsAccessToken(
  config?: CreatorsApiConfig,
  forceRefresh = false
): Promise<string> {
  const resolved = await resolveCreatorsApiConfig(config);
  const { credentialId, credentialSecret, credentialVersion } = resolved;

  if (!credentialId || !credentialSecret) {
    throw new Error('Amazon Creators API credentials not configured (missing Credential ID or Secret in Settings).');
  }

  const endpoint = getTokenEndpoint(credentialVersion || '3.1');

  // Check valid cached token (with 60-second safety margin)
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  // If a refresh is already in flight, reuse the promise (single-flight locking)
  if (activeRefreshPromise) {
    const token = await activeRefreshPromise;
    return token.accessToken;
  }

  // Initiate refresh
  activeRefreshPromise = (async () => {
    try {
      const bodyParams = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentialId,
        client_secret: credentialSecret,
        scope: 'creatorsapi::default',
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        const safeError = redactSecrets(errText);
        logger.error('Creators API OAuth token request failed', { status: res.status, error: safeError });

        if (res.status === 400 || res.status === 401) {
          throw new Error(`Invalid Creators API credentials (${res.status}): ${safeError}`);
        } else if (res.status === 403) {
          throw new Error(`AssociateNotEligible: Account is not authorized for Creators API.`);
        } else {
          throw new Error(`Creators API token error (${res.status}): ${safeError}`);
        }
      }

      const json = await res.json();
      const expiresIn = json.expires_in || 3600;

      const tokenObj: CreatorsOAuthToken = {
        accessToken: json.access_token,
        tokenType: json.token_type || 'bearer',
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      cachedToken = tokenObj;
      logger.info('Creators API OAuth token acquired successfully', {
        version: credentialVersion,
        expiresIn,
      });

      return tokenObj;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  const result = await activeRefreshPromise;
  return result.accessToken;
}

/**
 * Resets the in-memory token cache (useful in tests).
 */
export function clearTokenCache() {
  cachedToken = null;
  activeRefreshPromise = null;
}
