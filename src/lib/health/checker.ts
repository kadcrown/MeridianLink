import { URL } from 'url';
import { prisma } from '../db';
import { isSafePublicUrl, isRecognizedAmazonHost } from '../security/ssrf';
import { logger } from '../logger';

export interface HealthCheckResult {
  smartLinkId: string;
  destinationId?: string;
  url: string;
  statusCode?: number;
  latencyMs: number;
  redirectChain: string[];
  finalUrl?: string;
  isSuccess: boolean;
  failureReason?: string;
}

/**
 * Safely inspects a single destination URL for availability and redirect health.
 */
export async function checkDestinationHealth(
  smartLinkId: string,
  url: string,
  destinationId?: string,
  checkType: 'SCHEDULED' | 'ON_DEMAND' = 'SCHEDULED'
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const redirectChain: string[] = [url];
  let currentUrl = url;
  let hops = 0;
  const maxHops = 5;

  try {
    while (hops < maxHops) {
      const safety = isSafePublicUrl(currentUrl);
      if (!safety.isSafe || !safety.parsedUrl) {
        const failureReason = `SSRF Check Failed: ${safety.reason}`;
        const latencyMs = Date.now() - startTime;

        await recordHealthCheckDb({
          smartLinkId,
          destinationId,
          latencyMs,
          redirectChain,
          isSuccess: false,
          failureReason,
          checkType,
        });

        return {
          smartLinkId,
          destinationId,
          url,
          latencyMs,
          redirectChain,
          isSuccess: false,
          failureReason,
        };
      }

      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeridianLink-HealthBot/1.0; +https://meridianlink.local)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      const statusCode = response.status;
      const location = response.headers.get('location');

      if (statusCode >= 300 && statusCode < 400 && location) {
        const nextUrl = new URL(location, currentUrl).toString();
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        hops++;

        // Detect immediate redirect loops
        if (redirectChain.slice(0, -1).includes(nextUrl)) {
          const latencyMs = Date.now() - startTime;
          const failureReason = 'Redirect loop detected';

          await recordHealthCheckDb({
            smartLinkId,
            destinationId,
            statusCode,
            latencyMs,
            redirectChain,
            finalUrl: nextUrl,
            isSuccess: false,
            failureReason,
            checkType,
          });

          return {
            smartLinkId,
            destinationId,
            url,
            statusCode,
            latencyMs,
            redirectChain,
            finalUrl: nextUrl,
            isSuccess: false,
            failureReason,
          };
        }
      } else {
        // Final response reached
        const latencyMs = Date.now() - startTime;
        const isSuccess = statusCode >= 200 && statusCode < 400;
        let failureReason: string | undefined;

        if (statusCode === 404) {
          failureReason = 'Product or page not found (HTTP 404)';
        } else if (statusCode >= 500) {
          failureReason = `Remote server error (HTTP ${statusCode})`;
        } else if (!isSuccess) {
          failureReason = `Unexpected status code: HTTP ${statusCode}`;
        }

        await recordHealthCheckDb({
          smartLinkId,
          destinationId,
          statusCode,
          latencyMs,
          redirectChain,
          finalUrl: currentUrl,
          isSuccess,
          failureReason,
          checkType,
        });

        // Update Destination status if destinationId is provided
        if (destinationId) {
          await prisma.destination.update({
            where: { id: destinationId },
            data: {
              lastHealthStatus: statusCode,
              lastCheckedAt: new Date(),
            },
          });
        }

        return {
          smartLinkId,
          destinationId,
          url,
          statusCode,
          latencyMs,
          redirectChain,
          finalUrl: currentUrl,
          isSuccess,
          failureReason,
        };
      }
    }

    // Exceeded max hops
    const latencyMs = Date.now() - startTime;
    const failureReason = `Too many redirects (exceeded ${maxHops} hops)`;

    await recordHealthCheckDb({
      smartLinkId,
      destinationId,
      latencyMs,
      redirectChain,
      isSuccess: false,
      failureReason,
      checkType,
    });

    return {
      smartLinkId,
      destinationId,
      url,
      latencyMs,
      redirectChain,
      isSuccess: false,
      failureReason,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const failureReason = errorMessage.includes('timeout') ? 'Request timed out' : errorMessage;

    await recordHealthCheckDb({
      smartLinkId,
      destinationId,
      latencyMs,
      redirectChain,
      isSuccess: false,
      failureReason,
      checkType,
    });

    return {
      smartLinkId,
      destinationId,
      url,
      latencyMs,
      redirectChain,
      isSuccess: false,
      failureReason,
    };
  }
}

async function recordHealthCheckDb(data: {
  smartLinkId: string;
  destinationId?: string;
  statusCode?: number;
  latencyMs: number;
  redirectChain: string[];
  finalUrl?: string;
  isSuccess: boolean;
  failureReason?: string;
  checkType: string;
}) {
  try {
    await prisma.healthCheck.create({
      data: {
        smartLinkId: data.smartLinkId,
        destinationId: data.destinationId,
        statusCode: data.statusCode,
        latencyMs: data.latencyMs,
        redirectChain: JSON.stringify(data.redirectChain),
        finalUrl: data.finalUrl,
        isSuccess: data.isSuccess,
        failureReason: data.failureReason,
        checkType: data.checkType,
      },
    });
  } catch (err) {
    logger.error('Failed to persist health check entry', err);
  }
}

/**
 * Runs health checks for all active links in batches to prevent overwhelming network resources.
 */
export async function runBatchHealthChecks(limit = 20): Promise<{ checked: number; failed: number }> {
  const links = await prisma.smartLink.findMany({
    where: { isActive: true, isArchived: false },
    include: { destinations: true },
    take: limit,
    orderBy: { updatedAt: 'asc' },
  });

  let checked = 0;
  let failed = 0;

  for (const link of links) {
    // Check primary/original URL
    const originalCheck = await checkDestinationHealth(link.id, link.originalUrl);
    checked++;
    if (!originalCheck.isSuccess) failed++;

    // Check individual destinations if any
    for (const dest of link.destinations) {
      if (dest.isActive) {
        const destCheck = await checkDestinationHealth(link.id, dest.url, dest.id);
        checked++;
        if (!destCheck.isSuccess) failed++;
      }
    }
  }

  return { checked, failed };
}
