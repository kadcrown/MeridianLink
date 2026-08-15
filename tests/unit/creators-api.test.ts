import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmazonCreatorsApiAdapter } from '../../src/lib/amazon/creators-api/adapter';
import { auditLegacyPaapiConfiguration } from '../../src/lib/amazon/creators-api/legacy-detector';
import { clearTokenCache, maskCredentialId, redactSecrets } from '../../src/lib/amazon/creators-api/oauth';
import { CircuitBreaker } from '../../src/lib/amazon/creators-api/circuit-breaker';

describe('Amazon Creators API Adapter', () => {
  beforeEach(() => {
    clearTokenCache();
    vi.restoreAllMocks();
  });

  it('redacts secrets and bearer tokens from logs', () => {
    const raw = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&client_secret=secret12345';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(redacted).not.toContain('secret12345');
    expect(redacted).toContain('[REDACTED]');
  });

  it('masks credential IDs correctly', () => {
    expect(maskCredentialId('amzn1.oa2-cs.v1.abcdef123456')).toBe('••••••••3456');
    expect(maskCredentialId(undefined)).toBe('Unconfigured');
  });

  it('circuit breaker opens after consecutive failures and resets on success', () => {
    const cb = new CircuitBreaker(3, 10_000);
    expect(cb.isOpen()).toBe(false);

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(false);

    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);

    cb.recordSuccess();
    expect(cb.isOpen()).toBe(false);
  });

  it('audits legacy PA-API keys correctly', () => {
    const result = auditLegacyPaapiConfiguration();
    expect(result).toHaveProperty('migrationChecklist');
    expect(Array.isArray(result.migrationChecklist)).toBe(true);
  });

  it('non-destructively reports unconfigured state when credentials missing', async () => {
    const adapter = new AmazonCreatorsApiAdapter({
      credentialId: '',
      credentialSecret: '',
    });

    const status = await adapter.testConnection();
    expect(status.isConfigured).toBe(false);
    expect(status.state).toBe('NOT_CONFIGURED');
  });
});
