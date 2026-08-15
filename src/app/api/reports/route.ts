import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { generateSafeCsv } from '@/lib/security/csv';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '30');
    const linkId = searchParams.get('linkId');
    const groupId = searchParams.get('groupId');
    const country = searchParams.get('country');
    const format = searchParams.get('format'); // 'json' or 'csv'

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().substring(0, 10);

    const rollupWhere: Record<string, unknown> = {
      date: { gte: cutoffDateStr },
    };

    if (linkId) {
      rollupWhere.smartLinkId = linkId;
    }
    if (groupId) {
      rollupWhere.smartLink = { groupId };
    }
    if (country) {
      rollupWhere.country = country.toUpperCase();
    }

    const rollups = await prisma.dailyAnalyticsRollup.findMany({
      where: rollupWhere,
      include: {
        smartLink: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            groupId: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const dateMap = new Map<string, { date: string; totalClicks: number; humanClicks: number; botClicks: number; uniqueVisitors: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().substring(0, 10);
      dateMap.set(ds, { date: ds, totalClicks: 0, humanClicks: 0, botClicks: 0, uniqueVisitors: 0 });
    }

    const linkMap = new Map<string, { id: string; slug: string; name: string; clicks: number; humans: number }>();
    const countryMap = new Map<string, number>();
    const marketplaceMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const osMap = new Map<string, number>();
    const browserMap = new Map<string, number>();

    let grandTotalClicks = 0;
    let grandHumanClicks = 0;
    let grandBotClicks = 0;
    let grandUniqueVisitors = 0;

    for (const r of rollups) {
      grandTotalClicks += r.totalClicks;
      grandHumanClicks += r.humanClicks;
      grandBotClicks += r.botClicks;
      grandUniqueVisitors += r.uniqueVisitorsEstimate;

      const existingDate = dateMap.get(r.date);
      if (existingDate) {
        existingDate.totalClicks += r.totalClicks;
        existingDate.humanClicks += r.humanClicks;
        existingDate.botClicks += r.botClicks;
        existingDate.uniqueVisitors += r.uniqueVisitorsEstimate;
      }

      const lId = r.smartLinkId;
      const existingLink = linkMap.get(lId);
      if (existingLink) {
        existingLink.clicks += r.totalClicks;
        existingLink.humans += r.humanClicks;
      } else {
        linkMap.set(lId, {
          id: lId,
          slug: r.smartLink.slug,
          name: r.smartLink.displayName,
          clicks: r.totalClicks,
          humans: r.humanClicks,
        });
      }

      countryMap.set(r.country, (countryMap.get(r.country) || 0) + r.humanClicks);
      marketplaceMap.set(r.marketplace, (marketplaceMap.get(r.marketplace) || 0) + r.humanClicks);
      deviceMap.set(r.deviceCategory, (deviceMap.get(r.deviceCategory) || 0) + r.totalClicks);
      osMap.set(r.osFamily, (osMap.get(r.osFamily) || 0) + r.humanClicks);
      browserMap.set(r.browserFamily, (browserMap.get(r.browserFamily) || 0) + r.humanClicks);
    }

    if (format === 'csv') {
      const csvRows = Array.from(linkMap.values()).map((l) => ({
        slug: l.slug,
        name: l.name,
        totalClicks: l.clicks,
        humanClicks: l.humans,
      }));

      const headers = [
        { key: 'slug' as const, label: 'Link Slug' },
        { key: 'name' as const, label: 'Display Name' },
        { key: 'totalClicks' as const, label: 'Total Clicks' },
        { key: 'humanClicks' as const, label: 'Human Visitors' },
      ];

      const csvContent = generateSafeCsv(headers, csvRows);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="meridian-analytics-${days}d.csv"`,
        },
      });
    }

    const topLinks = Array.from(linkMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const topCountries = Array.from(countryMap.entries())
      .map(([code, clicks]) => ({ code, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const topMarketplaces = Array.from(marketplaceMap.entries())
      .map(([marketplace, clicks]) => ({ marketplace, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, clicks]) => ({ device, clicks }));
    const osBreakdown = Array.from(osMap.entries()).map(([os, clicks]) => ({ os, clicks }));
    const browserBreakdown = Array.from(browserMap.entries()).map(([browser, clicks]) => ({ browser, clicks }));
    const timeSeries = Array.from(dateMap.values());

    return NextResponse.json({
      summary: {
        totalClicks: grandTotalClicks,
        humanClicks: grandHumanClicks,
        botClicks: grandBotClicks,
        uniqueVisitors: grandUniqueVisitors,
      },
      timeSeries,
      topLinks,
      topCountries,
      topMarketplaces,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
    });
  } catch (error) {
    logger.error('Failed to generate reports', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
}
