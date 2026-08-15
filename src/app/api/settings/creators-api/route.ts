import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOwnerSession } from '@/lib/auth/session';
import { AmazonCreatorsApiAdapter } from '@/lib/amazon/creators-api/adapter';
import { auditLegacyPaapiConfiguration } from '@/lib/amazon/creators-api/legacy-detector';
import { maskCredentialId, resolveCreatorsApiConfig, clearTokenCache } from '@/lib/amazon/creators-api/oauth';
import { encryptSecret } from '@/lib/retailers/crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const saveCredentialsSchema = z.object({
  credentialId: z.string().min(1),
  credentialSecret: z.string().optional(),
  credentialVersion: z.enum(['3.1', '3.2', '3.3']).default('3.1'),
  defaultMarketplace: z.string().default('US'),
});

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await resolveCreatorsApiConfig();
    const isConfigured = Boolean(resolved.credentialId && resolved.credentialSecret);

    const configuredTagsCount = await prisma.amazonAffiliateTag.count({
      where: { isDefault: true },
    });

    const legacyAudit = auditLegacyPaapiConfiguration(isConfigured, resolved.credentialVersion);

    return NextResponse.json({
      isConfigured,
      credentialId: resolved.credentialId || '',
      credentialVersion: resolved.credentialVersion || '3.1',
      defaultMarketplace: resolved.defaultMarketplace || 'US',
      maskedId: maskCredentialId(resolved.credentialId),
      hasSecret: Boolean(resolved.credentialSecret),
      configuredTagsCount,
      legacyAudit,
    });
  } catch (error) {
    logger.error('Failed to get Creators API status', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'TEST';

    if (action === 'SAVE') {
      const parseResult = saveCredentialsSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
      }

      const { credentialId, credentialSecret, credentialVersion, defaultMarketplace } = parseResult.data;

      // Upsert Credential ID
      await prisma.appSetting.upsert({
        where: { key: 'AMAZON_CREATORS_CREDENTIAL_ID' },
        update: { value: credentialId },
        create: { key: 'AMAZON_CREATORS_CREDENTIAL_ID', value: credentialId },
      });

      // Upsert Encrypted Credential Secret (if provided)
      if (credentialSecret && credentialSecret.trim()) {
        const encrypted = encryptSecret(credentialSecret.trim());
        await prisma.appSetting.upsert({
          where: { key: 'AMAZON_CREATORS_CREDENTIAL_SECRET_ENC' },
          update: { value: JSON.stringify(encrypted) },
          create: { key: 'AMAZON_CREATORS_CREDENTIAL_SECRET_ENC', value: JSON.stringify(encrypted) },
        });
      }

      // Upsert Version
      await prisma.appSetting.upsert({
        where: { key: 'AMAZON_CREATORS_CREDENTIAL_VERSION' },
        update: { value: credentialVersion },
        create: { key: 'AMAZON_CREATORS_CREDENTIAL_VERSION', value: credentialVersion },
      });

      // Upsert Marketplace
      await prisma.appSetting.upsert({
        where: { key: 'AMAZON_CREATORS_DEFAULT_MARKETPLACE' },
        update: { value: defaultMarketplace },
        create: { key: 'AMAZON_CREATORS_DEFAULT_MARKETPLACE', value: defaultMarketplace },
      });

      clearTokenCache();
      logger.info('Updated Amazon Creators API credentials in AppSetting');

      return NextResponse.json({ success: true, message: 'Creators API credentials saved securely.' });
    }

    // Default Action: TEST
    clearTokenCache();
    const adapter = new AmazonCreatorsApiAdapter();
    const testResult = await adapter.testConnection('meridian-20');

    return NextResponse.json({ testResult });
  } catch (error) {
    logger.error('Creators API setting operation failed', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
