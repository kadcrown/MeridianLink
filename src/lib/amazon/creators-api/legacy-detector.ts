export interface LegacyPaapiAuditResult {
  hasLegacyPaapiConfig: boolean;
  detectedKeys: string[];
  migrationChecklist: Array<{ item: string; completed: boolean; recommendation: string }>;
}

const LEGACY_ENV_KEYS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'PAAPI5_ACCESS_KEY',
  'PAAPI5_SECRET_KEY',
  'PA_API_KEY',
  'PA_API_SECRET',
  'AMAZON_PAAPI_KEY',
  'AMAZON_PAAPI_SECRET',
];

/**
 * Audits configuration for deprecated PA-API 5.0 configurations.
 */
export function auditLegacyPaapiConfiguration(isConfiguredOverride?: boolean, versionOverride?: string): LegacyPaapiAuditResult {
  const detectedKeys: string[] = [];

  for (const key of LEGACY_ENV_KEYS) {
    if (process.env[key]) {
      detectedKeys.push(key);
    }
  }

  const hasCreatorsApiConfig = isConfiguredOverride !== undefined
    ? isConfiguredOverride
    : Boolean(process.env.AMAZON_CREATORS_CREDENTIAL_ID && process.env.AMAZON_CREATORS_CREDENTIAL_SECRET);

  const version = versionOverride || process.env.AMAZON_CREATORS_CREDENTIAL_VERSION || '3.1';

  const checklist = [
    {
      item: 'Remove Deprecated PA-API 5.0 Keys',
      completed: detectedKeys.length === 0,
      recommendation: detectedKeys.length > 0
        ? `Remove deprecated environment keys (${detectedKeys.join(', ')}) from your server configuration.`
        : 'No legacy PA-API keys detected.',
    },
    {
      item: 'Register Amazon Creators API Credentials',
      completed: hasCreatorsApiConfig,
      recommendation: hasCreatorsApiConfig
        ? 'Amazon Creators API Credential ID & Secret are active and stored.'
        : 'Generate OAuth 2.0 Client Credentials in Amazon Associates Central under Tools > Creators API.',
    },
    {
      item: 'Select Credential Version',
      completed: Boolean(version),
      recommendation: `Configured to v${version} (${version === '3.1' ? 'North America' : version === '3.2' ? 'Europe / Middle East' : 'Far East'}).`,
    },
    {
      item: 'Configure Regional Partner Tags',
      completed: true,
      recommendation: 'Ensure regional Associates partner tags (e.g. tag-20, tag-21) are configured in the Affiliate IDs matrix.',
    },
  ];

  return {
    hasLegacyPaapiConfig: detectedKeys.length > 0,
    detectedKeys,
    migrationChecklist: checklist,
  };
}
