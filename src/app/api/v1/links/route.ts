import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth/tokens';
import { generateSlug } from '@/lib/amazon/parser';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const apiCreateSchema = z.object({
  originalUrl: z.string().url(),
  displayName: z.string().min(1).max(200),
  slug: z.string().optional(),
  linkType: z.enum(['SMART', 'CHOICE', 'AB_TEST']).default('SMART'),
  groupId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Bearer token required.' }, { status: 401 });
    }

    const tokenString = authHeader.replace('Bearer ', '').trim();
    const tokenPayload = await verifyApiToken(tokenString, 'links:write');
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Forbidden. Token invalid or missing "links:write" scope.' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = apiCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;
    let slug = generateSlug(data.slug || data.displayName);

    const existing = await prisma.smartLink.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const link = await prisma.smartLink.create({
      data: {
        slug,
        displayName: data.displayName,
        originalUrl: data.originalUrl,
        linkType: data.linkType,
        groupId: data.groupId || null,
        notes: data.notes || null,
      },
    });

    logger.info('Created link via Owner API', { id: link.id, slug: link.slug });

    return NextResponse.json({ success: true, link }, { status: 201 });
  } catch (error) {
    logger.error('Owner API link creation failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
