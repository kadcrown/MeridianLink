import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { createApiToken, ALL_API_SCOPES, ApiTokenScope } from '@/lib/auth/tokens';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const tokenCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().optional(),
  ipAllowlist: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { ownerId: session.id, isRevoked: false },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tokens, availableScopes: ALL_API_SCOPES });
  } catch (error) {
    logger.error('Failed to fetch API tokens', error);
    return NextResponse.json({ error: 'Failed to retrieve tokens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = tokenCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const data = parseResult.data;
    const scopes = data.scopes as ApiTokenScope[];

    const result = await createApiToken(
      session.id,
      data.name,
      scopes,
      data.expiresInDays,
      data.ipAllowlist
    );

    return NextResponse.json({ success: true, token: result }, { status: 201 });
  } catch (error) {
    logger.error('Failed to generate API token', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
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
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    await prisma.apiToken.update({
      where: { id },
      data: { isRevoked: true },
    });

    logger.info('Revoked API token', { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to revoke API token', error);
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}
