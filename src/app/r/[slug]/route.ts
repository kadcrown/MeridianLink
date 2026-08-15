import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveVisitorCountry } from '@/lib/geoip/resolver';
import { parseUserAgent } from '@/lib/useragent/detector';
import { computeVisitorHash, recordClickEvent } from '@/lib/analytics/collector';
import { resolveDestination } from '@/lib/routing/engine';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const startTime = Date.now();
  const slug = params.slug;

  try {
    // 1. Fetch smart link with related destinations, group, and variants
    const smartLink = await prisma.smartLink.findUnique({
      where: { slug },
      include: {
        destinations: { where: { isActive: true } },
        abVariants: { where: { isActive: true } },
        group: {
          include: {
            tagOverrides: true,
          },
        },
        tagOverrides: true,
      },
    });

    if (!smartLink || !smartLink.isActive || smartLink.isArchived) {
      return NextResponse.json(
        { error: 'Link not found, disabled, or archived' },
        { status: 404 }
      );
    }

    // 2. Extract Client & Device details
    const userAgentHeader = request.headers.get('user-agent') || '';
    const acceptLanguageHeader = request.headers.get('accept-language') || '';
    const referrerHeader = request.headers.get('referer') || request.headers.get('referrer') || '';
    let referrerHost: string | undefined;
    if (referrerHeader) {
      try {
        referrerHost = new URL(referrerHeader).hostname;
      } catch {
        // Ignore malformed referrer
      }
    }

    const uaDetails = parseUserAgent(userAgentHeader, acceptLanguageHeader);

    // 3. Resolve Visitor Country
    const searchParams = request.nextUrl.searchParams;
    const geoResult = resolveVisitorCountry(request.headers, searchParams, smartLink.defaultMarketplace);

    // 4. Compute privacy-preserving salted visitor hash (no raw IP stored)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const visitorHash = uaDetails.isBot ? undefined : computeVisitorHash(clientIp, userAgentHeader);

    // 5. Build Affiliate Tag Resolution Map (Hierarchy: Account Default -> Group Override -> Link Override)
    // First, load account defaults
    const defaultTags = await prisma.amazonAffiliateTag.findMany({
      where: { isDefault: true },
    });
    const tagMap: Record<string, string> = {};
    for (const item of defaultTags) {
      tagMap[item.marketplace] = item.tag;
    }

    // Apply Group-level overrides
    if (smartLink.group?.tagOverrides) {
      for (const override of smartLink.group.tagOverrides) {
        tagMap[override.marketplace] = override.tag;
      }
    }

    // Apply Link-level overrides
    if (smartLink.tagOverrides) {
      for (const override of smartLink.tagOverrides) {
        tagMap[override.marketplace] = override.tag;
      }
    }

    // 6. Extract incoming query UTM parameters
    const incomingUtm = {
      source: searchParams.get('utm_source') || undefined,
      medium: searchParams.get('utm_medium') || undefined,
      campaign: searchParams.get('utm_campaign') || undefined,
      term: searchParams.get('utm_term') || undefined,
      content: searchParams.get('utm_content') || undefined,
    };

    // 7. Resolve Destination
    const resolution = await resolveDestination({
      smartLink: {
        id: smartLink.id,
        slug: smartLink.slug,
        linkType: smartLink.linkType as 'SMART' | 'CHOICE' | 'AB_TEST',
        originalUrl: smartLink.originalUrl,
        asin: smartLink.asin,
        productTitle: smartLink.productTitle,
        defaultMarketplace: smartLink.defaultMarketplace,
        utmSource: smartLink.utmSource,
        utmMedium: smartLink.utmMedium,
        utmCampaign: smartLink.utmCampaign,
        utmTerm: smartLink.utmTerm,
        utmContent: smartLink.utmContent,
      },
      destinations: smartLink.destinations,
      abVariants: smartLink.abVariants,
      affiliateTags: tagMap,
      visitorCountry: geoResult.countryCode,
      visitorHash,
      incomingUtm,
    });

    // 8. Record click analytics in background (non-blocking)
    const effectiveUtmSource = incomingUtm.source || smartLink.utmSource || undefined;
    const effectiveUtmMedium = incomingUtm.medium || smartLink.utmMedium || undefined;
    const effectiveUtmCampaign = incomingUtm.campaign || smartLink.utmCampaign || undefined;

    // Asynchronously record event
    recordClickEvent({
      smartLinkId: smartLink.id,
      destinationId: resolution.destinationId,
      abVariantId: resolution.variantId,
      country: geoResult.countryCode,
      deviceCategory: uaDetails.deviceCategory,
      osFamily: uaDetails.osFamily,
      browserFamily: uaDetails.browserFamily,
      language: uaDetails.language,
      referrerHost,
      utmSource: effectiveUtmSource,
      utmMedium: effectiveUtmMedium,
      utmCampaign: effectiveUtmCampaign,
      utmTerm: incomingUtm.term || smartLink.utmTerm || undefined,
      utmContent: incomingUtm.content || smartLink.utmContent || undefined,
      isBot: uaDetails.isBot,
      botClassification: uaDetails.botClassification,
      visitorHash,
      redirectedUrl: resolution.targetUrl,
      marketplace: resolution.targetMarketplace,
    }).catch((err) => {
      logger.error('Async click recording failed', err);
    });

    // If Choice Page, redirect internally to /c/[slug]
    if (resolution.shouldShowChoicePage) {
      const choiceUrl = new URL(`/c/${smartLink.slug}`, request.nextUrl.origin);
      return NextResponse.redirect(choiceUrl.toString(), 302);
    }

    // 9. Respond with HTTP 302 / 307 Redirect
    const response = NextResponse.redirect(resolution.targetUrl, 302);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Redirect-Latency-Ms', String(Date.now() - startTime));

    return response;
  } catch (error: unknown) {
    logger.error('Error handling redirect route', error, { slug });
    return NextResponse.redirect(new URL('/', request.nextUrl.origin).toString(), 302);
  }
}
