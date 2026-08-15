import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  publicBaseUrl: z.string().url().optional(),
  customDomain: z.string().optional().nullable(),
  defaultMarketplace: z.string().optional(),
  trustedProxyHeaders: z.string().optional(),
  dataRetentionDays: z.string().optional(),
  botFilteringEnabled: z.string().optional(),
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

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    logger.error('Failed to get settings', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = settingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(parseResult.data)) {
      if (value !== undefined && value !== null) {
        await prisma.appSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }

    logger.info('Updated application settings');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to update settings', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
