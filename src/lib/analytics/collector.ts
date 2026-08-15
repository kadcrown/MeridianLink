import crypto from 'crypto';
import { prisma } from '../db';
import { env } from '../env';
import { logger } from '../logger';

/**
 * Computes a rotating privacy-preserving salted visitor hash.
 * Changes daily based on current UTC date and secret master salt.
 */
export function computeVisitorHash(ip: string, userAgent: string): string {
  const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const salt = `${env.APP_SECRET}:${today}`;
  return crypto
    .createHmac('sha256', salt)
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 16);
}

export interface RecordClickInput {
  smartLinkId: string;
  destinationId?: string;
  abVariantId?: string;
  country: string;
  region?: string;
  city?: string;
  deviceCategory: string;
  osFamily: string;
  browserFamily: string;
  language: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  isBot: boolean;
  botClassification?: string;
  visitorHash?: string;
  redirectedUrl: string;
  marketplace: string;
}

/**
 * Records click event in background and updates daily rollups without delaying redirects.
 */
export async function recordClickEvent(input: RecordClickInput): Promise<void> {
  try {
    const today = new Date().toISOString().substring(0, 10);

    // 1. Create the click event
    await prisma.clickEvent.create({
      data: {
        smartLinkId: input.smartLinkId,
        destinationId: input.destinationId,
        abVariantId: input.abVariantId,
        country: input.country.toUpperCase(),
        region: input.region,
        city: input.city,
        deviceCategory: input.deviceCategory,
        osFamily: input.osFamily,
        browserFamily: input.browserFamily,
        language: input.language,
        referrerHost: input.referrerHost,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmTerm: input.utmTerm,
        utmContent: input.utmContent,
        isBot: input.isBot,
        botClassification: input.botClassification,
        visitorHash: input.visitorHash,
        redirectedUrl: input.redirectedUrl,
      },
    });

    // 2. Upsert daily rollup
    const isHuman = !input.isBot;
    await prisma.dailyAnalyticsRollup.upsert({
      where: {
        rollup_unique_compound_metric: {
          date: today,
          smartLinkId: input.smartLinkId,
          country: input.country.toUpperCase(),
          marketplace: input.marketplace.toUpperCase(),
          retailerSlug: 'amazon',
          deviceCategory: input.deviceCategory,
          osFamily: input.osFamily,
          browserFamily: input.browserFamily,
        },
      },
      create: {
        date: today,
        smartLinkId: input.smartLinkId,
        country: input.country.toUpperCase(),
        marketplace: input.marketplace.toUpperCase(),
        retailerSlug: 'amazon',
        deviceCategory: input.deviceCategory,
        osFamily: input.osFamily,
        browserFamily: input.browserFamily,
        totalClicks: 1,
        humanClicks: isHuman ? 1 : 0,
        botClicks: input.isBot ? 1 : 0,
        uniqueVisitorsEstimate: isHuman ? 1 : 0,
      },
      update: {
        totalClicks: { increment: 1 },
        humanClicks: isHuman ? { increment: 1 } : undefined,
        botClicks: input.isBot ? { increment: 1 } : undefined,
        uniqueVisitorsEstimate: isHuman ? { increment: 1 } : undefined,
      },
    });
  } catch (error) {
    logger.error('Failed to record click analytics event', error, { smartLinkId: input.smartLinkId });
  }
}

/**
 * Cleans expired click events older than retention period.
 */
export async function purgeExpiredAnalytics(): Promise<number> {
  const retentionDays = env.DATA_RETENTION_DAYS || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.clickEvent.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
