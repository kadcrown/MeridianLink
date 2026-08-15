import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { checkDestinationHealth, runBatchHealthChecks } from '@/lib/health/checker';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [recentChecks, failedDestinations, degradedCount] = await Promise.all([
      prisma.healthCheck.findMany({
        include: {
          smartLink: {
            select: { id: true, slug: true, displayName: true },
          },
          destination: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.destination.findMany({
        where: {
          OR: [
            { lastHealthStatus: { gte: 400 } },
            { lastHealthStatus: 0 },
          ],
        },
        include: {
          smartLink: {
            select: { id: true, slug: true, displayName: true },
          },
        },
        take: 20,
      }),
      prisma.healthCheck.count({
        where: { isSuccess: false },
      }),
    ]);

    return NextResponse.json({
      recentChecks,
      failedDestinations,
      degradedCount,
    });
  } catch (error) {
    logger.error('Failed to get health overview', error);
    return NextResponse.json({ error: 'Failed to retrieve health status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { linkId } = body;

    if (linkId) {
      const link = await prisma.smartLink.findUnique({
        where: { id: linkId },
        include: { destinations: true },
      });

      if (!link) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }

      const result = await checkDestinationHealth(link.id, link.originalUrl, undefined, 'ON_DEMAND');
      return NextResponse.json({ success: true, result });
    }

    const batchResult = await runBatchHealthChecks(25);
    return NextResponse.json({ success: true, ...batchResult });
  } catch (error) {
    logger.error('Failed to trigger health check', error);
    return NextResponse.json({ error: 'Failed to perform health check' }, { status: 500 });
  }
}
