import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { encryptSecret } from '@/lib/retailers/crypto';
import { ensureCatalogSeeded } from '@/lib/db/seed-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const connectProgramSchema = z.object({
  programId: z.string(),
  name: z.string().default('Primary Connection'),
  isAccountDefault: z.boolean().default(true),
  isManualMode: z.boolean().default(false),
  publicValues: z.record(z.string()).default({}),
  secretValues: z.record(z.string()).default({}),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure catalog is populated if fresh database
    await ensureCatalogSeeded();

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const networkSlug = searchParams.get('network');
    const retailerSlug = searchParams.get('retailer');
    const countryCode = searchParams.get('country');
    const capability = searchParams.get('capability');

    const where: Record<string, unknown> = { isActive: true };

    if (networkSlug) {
      where.network = { slug: networkSlug };
    }
    if (retailerSlug) {
      where.retailer = { slug: retailerSlug };
    }
    if (countryCode) {
      where.countryCode = countryCode.toUpperCase();
    }
    if (capability) {
      where.capabilityLevel = capability;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { slug: { contains: query } },
        { retailer: { name: { contains: query } } },
        { network: { name: { contains: query } } },
      ];
    }

    const [programs, networks, retailers] = await Promise.all([
      prisma.affiliateProgram.findMany({
        where,
        include: {
          retailer: true,
          network: true,
          fieldDefinitions: { orderBy: { order: 'asc' } },
          connections: {
            include: {
              secrets: {
                select: { id: true, key: true, maskedSuffix: true },
              },
            },
          },
          _count: {
            select: { destinations: true },
          },
        },
        orderBy: [{ retailer: { name: 'asc' } }, { name: 'asc' }],
      }),
      prisma.affiliateNetwork.findMany({ where: { isActive: true } }),
      prisma.retailer.findMany({ where: { isActive: true } }),
    ]);

    return NextResponse.json({ programs, networks, retailers });
  } catch (error) {
    logger.error('Failed to fetch affiliate programs', error);
    return NextResponse.json({ error: 'Failed to retrieve programs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = connectProgramSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const { programId, name, isAccountDefault, isManualMode, publicValues, secretValues } = parseResult.data;

    // Create or update connection
    const connection = await prisma.affiliateConnection.create({
      data: {
        programId,
        name,
        isAccountDefault,
        isManualMode,
        connectionStatus: 'CONFIGURED',
        configValuesJson: JSON.stringify(publicValues),
        secrets: {
          create: Object.entries(secretValues).map(([key, val]) => {
            const encrypted = encryptSecret(val);
            return {
              key,
              encryptedVal: encrypted.encryptedVal,
              iv: encrypted.iv,
              authTag: encrypted.authTag,
              maskedSuffix: encrypted.maskedSuffix,
            };
          }),
        },
      },
      include: {
        secrets: {
          select: { id: true, key: true, maskedSuffix: true },
        },
      },
    });

    logger.info('Saved affiliate program connection', { connectionId: connection.id, programId });

    return NextResponse.json({ success: true, connection }, { status: 201 });
  } catch (error) {
    logger.error('Failed to save program connection', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}
