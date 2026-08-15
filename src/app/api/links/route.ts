import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { generateSlug } from '@/lib/amazon/parser';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const createLinkSchema = z.object({
  slug: z.string().min(1).max(60).optional(),
  displayName: z.string().min(1).max(200),
  originalUrl: z.string().url(),
  linkType: z.enum(['SMART', 'CHOICE', 'AB_TEST']).default('SMART'),
  asin: z.string().optional().nullable(),
  productTitle: z.string().optional().nullable(),
  productImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  defaultMarketplace: z.string().default('US'),
  groupId: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  destinations: z
    .array(
      z.object({
        countryCode: z.string().min(2).max(2),
        marketplace: z.string(),
        url: z.string().url(),
        label: z.string().optional().nullable(),
        priceString: z.string().optional().nullable(),
        isManual: z.boolean().default(true),
        isVerified: z.boolean().default(false),
        fallbackType: z.string().default('ASIN_TRANSFER'),
        weight: z.number().default(100),
      })
    )
    .optional(),
  abVariants: z
    .array(
      z.object({
        name: z.string().min(1),
        destinationUrl: z.string().url(),
        marketplace: z.string().default('US'),
        weight: z.number().min(1).max(100),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status') || 'active';
    const linkType = searchParams.get('type');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isArchived = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (linkType) {
      where.linkType = linkType;
    }

    if (query) {
      where.OR = [
        { displayName: { contains: query } },
        { slug: { contains: query } },
        { asin: { contains: query } },
        { originalUrl: { contains: query } },
        { productTitle: { contains: query } },
      ];
    }

    const [total, links] = await Promise.all([
      prisma.smartLink.count({ where }),
      prisma.smartLink.findMany({
        where,
        include: {
          group: true,
          destinations: true,
          abVariants: true,
          _count: {
            select: { clickEvents: true, healthChecks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      links,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch links', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createLinkSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;

    let finalSlug = generateSlug(data.slug || data.displayName || data.asin || undefined);
    const existing = await prisma.smartLink.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const newLink = await prisma.smartLink.create({
      data: {
        slug: finalSlug,
        displayName: data.displayName,
        originalUrl: data.originalUrl,
        linkType: data.linkType,
        asin: data.asin || null,
        productTitle: data.productTitle || null,
        productImageUrl: data.productImageUrl || null,
        notes: data.notes || null,
        defaultMarketplace: data.defaultMarketplace,
        groupId: data.groupId || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
        destinations: data.destinations
          ? {
              create: data.destinations.map((d) => ({
                countryCode: d.countryCode.toUpperCase(),
                marketplace: d.marketplace.toUpperCase(),
                url: d.url,
                label: d.label || null,
                priceString: d.priceString || null,
                isManual: d.isManual,
                isVerified: d.isVerified,
                fallbackType: d.fallbackType,
                weight: d.weight,
              })),
            }
          : undefined,
        abVariants: data.abVariants
          ? {
              create: data.abVariants.map((v) => ({
                name: v.name,
                destinationUrl: v.destinationUrl,
                marketplace: v.marketplace.toUpperCase(),
                weight: v.weight,
              })),
            }
          : undefined,
      },
      include: {
        destinations: true,
        abVariants: true,
        group: true,
      },
    });

    logger.info('Created new SmartLink', { slug: newLink.slug, id: newLink.id });

    return NextResponse.json({ success: true, link: newLink }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create SmartLink', error);
    return NextResponse.json({ error: 'Failed to create SmartLink' }, { status: 500 });
  }
}
