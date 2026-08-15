import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { generateSlug } from '@/lib/amazon/parser';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  color: z.string().default('#0d9488'),
  isArchived: z.boolean().default(false),
  tagOverrides: z
    .array(
      z.object({
        marketplace: z.string(),
        tag: z.string(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.linkGroup.findMany({
      include: {
        tagOverrides: true,
        _count: {
          select: { links: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    logger.error('Failed to fetch groups', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = groupSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;
    const slug = generateSlug(data.slug || data.name);

    const group = await prisma.linkGroup.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        color: data.color,
        tagOverrides: data.tagOverrides
          ? {
              create: data.tagOverrides.map((t) => ({
                marketplace: t.marketplace.toUpperCase(),
                tag: t.tag.trim(),
                isDefault: false,
              })),
            }
          : undefined,
      },
      include: {
        tagOverrides: true,
      },
    });

    logger.info('Created link group', { id: group.id, name: group.name });

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create group', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = groupSchema.safeParse(body);

    if (!parseResult.success || !parseResult.data.id) {
      return NextResponse.json({ error: 'Valid Group ID and payload required' }, { status: 400 });
    }

    const { id, name, description, color, isArchived, tagOverrides } = parseResult.data;

    if (tagOverrides) {
      await prisma.amazonAffiliateTag.deleteMany({ where: { groupId: id } });
      if (tagOverrides.length > 0) {
        await prisma.amazonAffiliateTag.createMany({
          data: tagOverrides.map((t) => ({
            groupId: id,
            marketplace: t.marketplace.toUpperCase(),
            tag: t.tag.trim(),
            isDefault: false,
          })),
        });
      }
    }

    const updated = await prisma.linkGroup.update({
      where: { id },
      data: {
        name,
        description: description ?? null,
        color,
        isArchived,
      },
      include: {
        tagOverrides: true,
      },
    });

    logger.info('Updated link group', { id: updated.id, name: updated.name });

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    logger.error('Failed to update group', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    await prisma.linkGroup.delete({ where: { id } });

    logger.info('Deleted link group', { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete group', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
