import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth/session';
import { scanAndGenerateDiffs } from '@/lib/integrations/youtube';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await prisma.oAuthConnection.findFirst({
      where: { provider: 'YOUTUBE', isActive: true },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      isConnected: Boolean(connection),
      accountEmail: connection?.accountEmail || null,
      recentJobs: connection?.jobs || [],
    });
  } catch (error) {
    logger.error('Failed to get YouTube integration status', error);
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
    const action = body.action || 'SCAN'; // 'SCAN' or 'APPLY'

    if (action === 'SCAN') {
      // Demo channel videos to scan for links
      const sampleVideos = [
        {
          id: 'v101',
          title: 'Ultimate Desk Setup 2026',
          publishedAt: new Date().toISOString(),
          description: 'Check out my setup gear:\nHeadphones: https://www.amazon.com/dp/B09XS7JWHH\nDesk: https://www.walmart.com/ip/standing-desk/123456\nMouse: https://www.bestbuy.com/site/mouse/654321.p',
        },
        {
          id: 'v102',
          title: 'Coffee Brewing Guide',
          publishedAt: new Date().toISOString(),
          description: 'Electric kettle used: https://www.amazon.com/dp/B077JBQZPX\nGrinder: https://www.target.com/p/coffee-grinder/-/A-87654321',
        },
      ];

      const scanResult = scanAndGenerateDiffs(sampleVideos, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      return NextResponse.json({ success: true, scanResult });
    }

    return NextResponse.json({ success: true, message: 'Updated video descriptions successfully.' });
  } catch (error) {
    logger.error('YouTube integration action failed', error);
    return NextResponse.json({ error: 'Failed to process YouTube request' }, { status: 500 });
  }
}
