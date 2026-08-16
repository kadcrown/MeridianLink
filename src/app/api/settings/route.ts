import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  baseUrl: z.string().url().optional(),
  publicBaseUrl: z.string().url().optional(),
  retentionDays: z.union([z.number(), z.string()]).optional(),
  dataRetentionDays: z.union([z.number(), z.string()]).optional(),
  customDomain: z.string().optional().nullable(),
  defaultMarketplace: z.string().optional(),
  trustedProxyHeaders: z.string().optional(),
  botFilteringEnabled: z.union([z.boolean(), z.string()]).optional(),
  affiliateDisclosure: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.appSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const publicBaseUrl =
      settingsMap['PUBLIC_BASE_URL'] ||
      settingsMap['publicBaseUrl'] ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const retentionDays =
      Number(settingsMap['DATA_RETENTION_DAYS'] || settingsMap['dataRetentionDays'] || settingsMap['retentionDays']) || 90;

    return NextResponse.json({
      settings: settingsMap,
      baseUrl: publicBaseUrl,
      publicBaseUrl,
      retentionDays,
      defaultMarketplace: settingsMap['DEFAULT_MARKETPLACE'] || 'US',
      trustedProxyHeaders: settingsMap['TRUSTED_PROXY_HEADERS'] || 'CF-IPCountry,X-Geo-Country,X-Vercel-IP-Country',
      botFilteringEnabled: settingsMap['BOT_FILTERING_ENABLED'] !== 'false',
    });
  } catch (error) {
    logger.error('Failed to get settings', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

async function handleSaveSettings(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = settingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid settings payload', details: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;

    // Handle Public Base URL
    const targetBaseUrl = data.baseUrl || data.publicBaseUrl;
    if (targetBaseUrl) {
      await prisma.appSetting.upsert({
        where: { key: 'PUBLIC_BASE_URL' },
        create: { key: 'PUBLIC_BASE_URL', value: targetBaseUrl.replace(/\/+$/, '') },
        update: { value: targetBaseUrl.replace(/\/+$/, '') },
      });
    }

    // Handle Retention Days
    const targetRetention = data.retentionDays !== undefined ? data.retentionDays : data.dataRetentionDays;
    if (targetRetention !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'DATA_RETENTION_DAYS' },
        create: { key: 'DATA_RETENTION_DAYS', value: String(targetRetention) },
        update: { value: String(targetRetention) },
      });
    }

    // Handle other settings
    if (data.defaultMarketplace) {
      await prisma.appSetting.upsert({
        where: { key: 'DEFAULT_MARKETPLACE' },
        create: { key: 'DEFAULT_MARKETPLACE', value: data.defaultMarketplace },
        update: { value: data.defaultMarketplace },
      });
    }

    if (data.trustedProxyHeaders) {
      await prisma.appSetting.upsert({
        where: { key: 'TRUSTED_PROXY_HEADERS' },
        create: { key: 'TRUSTED_PROXY_HEADERS', value: data.trustedProxyHeaders },
        update: { value: data.trustedProxyHeaders },
      });
    }

    if (data.botFilteringEnabled !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'BOT_FILTERING_ENABLED' },
        create: { key: 'BOT_FILTERING_ENABLED', value: String(data.botFilteringEnabled) },
        update: { value: String(data.botFilteringEnabled) },
      });
    }

    logger.info('Updated application settings');

    return NextResponse.json({
      success: true,
      baseUrl: targetBaseUrl ? targetBaseUrl.replace(/\/+$/, '') : undefined,
    });
  } catch (error) {
    logger.error('Failed to update settings', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleSaveSettings(request);
}

export async function PUT(request: NextRequest) {
  return handleSaveSettings(request);
}
