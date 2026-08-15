import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredAnalytics } from '@/lib/analytics/collector';
import { runBatchHealthChecks } from '@/lib/health/checker';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.APP_SECRET;

    if (secret && authHeader && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Running scheduled maintenance tasks...');

    const purgedCount = await purgeExpiredAnalytics();
    const healthResult = await runBatchHealthChecks(20);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      purgedEvents: purgedCount,
      healthCheckResult: healthResult,
    });
  } catch (error) {
    logger.error('Cron maintenance run failed', error);
    return NextResponse.json({ error: 'Cron task failed' }, { status: 500 });
  }
}
