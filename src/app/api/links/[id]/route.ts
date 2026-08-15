import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { generateSlug } from '@/lib/amazon/parser';
import { logger } from '@/lib/logger';

const updateLinkSchema = z.object({
  slug: z.string().min(1).max(60).optional(),
  displayName: z.string().min(1).max(200).optional(),
  originalUrl: z.string().url().optional(),
  linkType: z.enum(['SMART', 'CHOICE', 'AB_TEST']).optional(),
  asin: z.string().optional().nullable(),
  productTitle: z.string().optional().nullable(),
  productImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  defaultMarketplace: z.string().optional(),
  groupId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  destinations: z
    .array(
      z.object({
        id: z.string().optional(),
        countryCode: z.string().min(2).max(2),
        marketplace: z.string(),
        url: z.string().url(),
        label: z.string().optional().nullable(),
        priceString: z.string().optional().nullable(),
        isManual: z.boolean().default(true),
        isVerified: z.boolean().default(false),
        fallbackType: z.string().default('ASIN_TRANSFER'),
        weight: z.number().default(100),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
  abVariants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        destinationUrl: z.string().url(),
        marketplace: z.string().default('US'),
        weight: z.number().min(1).max(100),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const link = await prisma.smartLink.findUnique({
      where: { id: params.id },
      include: {
        group: true,
        destinations: true,
        abVariants: true,
        tagOverrides: true,
        healthChecks: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    logger.error('Failed to get link details', error, { linkId: params.id });
    return NextResponse.json({ error: 'Failed to retrieve link' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateLinkSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;

    // Verify link exists
    const existing = await prisma.smartLink.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Slug update uniqueness check
    let updatedSlug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      updatedSlug = generateSlug(data.slug);
      const slugConflict = await prisma.smartLink.findFirst({
        where: { slug: updatedSlug, id: { not: params.id } },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'Slug is already in use by another link' }, { status: 409 });
      }
    }

    // Update Destinations if supplied
    if (data.destinations) {
      await prisma.destination.deleteMany({ where: { smartLinkId: params.id } });
      await prisma.destination.createMany({
        data: data.destinations.map((d) => ({
          smartLinkId: params.id,
          countryCode: d.countryCode.toUpperCase(),
          marketplace: d.marketplace.toUpperCase(),
          url: d.url,
          label: d.label || null,
          priceString: d.priceString || null,
          isManual: d.isManual,
          isVerified: d.isVerified,
          fallbackType: d.fallbackType,
          weight: d.weight,
          isActive: d.isActive,
        })),
      });
    }

    // Update A/B Variants if supplied
    if (data.abVariants) {
      await prisma.aBVariant.deleteMany({ where: { smartLinkId: params.id } });
      await prisma.aBVariant.createMany({
        data: data.abVariants.map((v) => ({
          smartLinkId: params.id,
          name: v.name,
          destinationUrl: v.destinationUrl,
          marketplace: v.marketplace.toUpperCase(),
          weight: v.weight,
          isActive: v.isActive,
        })),
      });
    }

    // Update main link
    const updated = await prisma.smartLink.update({
      where: { id: params.id },
      data: {
        slug: updatedSlug,
        displayName: data.displayName ?? existing.displayName,
        originalUrl: data.originalUrl ?? existing.originalUrl,
        linkType: data.linkType ?? existing.linkType,
        asin: data.asin !== undefined ? data.asin : existing.asin,
        productTitle: data.productTitle !== undefined ? data.productTitle : existing.productTitle,
        productImageUrl: data.productImageUrl !== undefined ? data.productImageUrl : existing.productImageUrl,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        defaultMarketplace: data.defaultMarketplace ?? existing.defaultMarketplace,
        groupId: data.groupId !== undefined ? data.groupId : existing.groupId,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        isArchived: data.isArchived !== undefined ? data.isArchived : existing.isArchived,
        utmSource: data.utmSource !== undefined ? data.utmSource : existing.utmSource,
        utmMedium: data.utmMedium !== undefined ? data.utmMedium : existing.utmMedium,
        utmCampaign: data.utmCampaign !== undefined ? data.utmCampaign : existing.utmCampaign,
        utmTerm: data.utmTerm !== undefined ? data.utmTerm : existing.utmTerm,
        utmContent: data.utmContent !== undefined ? data.utmContent : existing.utmContent,
      },
      include: {
        destinations: true,
        abVariants: true,
        group: true,
      },
    });

    logger.info('Updated SmartLink', { id: updated.id, slug: updated.slug });

    return NextResponse.json({ success: true, link: updated });
  } catch (error) {
    logger.error('Failed to update SmartLink', error, { linkId: params.id });
    return NextResponse.json({ error: 'Failed to update SmartLink' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.smartLink.delete({
      where: { id: params.id },
    });

    logger.info('Deleted SmartLink', { id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete SmartLink', error, { linkId: params.id });
    return NextResponse.json({ error: 'Failed to delete SmartLink' }, { status: 500 });
  }
}
