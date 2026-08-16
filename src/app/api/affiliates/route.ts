import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getOwnerSession } from '@/lib/auth/session';
import { AMAZON_MARKETPLACES } from '@/lib/amazon/marketplaces';
import { validateAffiliateTag } from '@/lib/amazon/tagger';
import { logger } from '@/lib/logger';

import { seedDefaultAmazonTags } from '@/lib/db/seed-service';

export const dynamic = 'force-dynamic';

const updateTagsSchema = z.object({
  tags: z.record(z.string()),
});

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let defaultTags = await prisma.amazonAffiliateTag.findMany({
      where: { isDefault: true, groupId: null, smartLinkId: null },
    });

    if (defaultTags.length === 0) {
      await seedDefaultAmazonTags();
      defaultTags = await prisma.amazonAffiliateTag.findMany({
        where: { isDefault: true, groupId: null, smartLinkId: null },
      });
    }

    const tagMap = new Map(defaultTags.map((t) => [t.marketplace, t.tag]));

    const marketplaces = Object.values(AMAZON_MARKETPLACES).map((mp) => {
      const currentTag = tagMap.get(mp.id) || '';
      const validation = currentTag ? validateAffiliateTag(currentTag, mp.id) : { isValid: false, error: 'Not configured' };

      return {
        id: mp.id,
        name: mp.name,
        domain: mp.domain,
        currency: mp.currency,
        flag: mp.flag,
        tagSuffix: mp.tagSuffix,
        tag: currentTag,
        isValid: validation.isValid,
        validationError: validation.error,
      };
    });

    return NextResponse.json({ marketplaces });
  } catch (error) {
    logger.error('Failed to fetch affiliate tags', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate tags' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateTagsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { tags } = parseResult.data;

    for (const [marketplace, rawTag] of Object.entries(tags)) {
      const cleanTag = rawTag.trim();
      const upperMarket = marketplace.toUpperCase();

      if (!AMAZON_MARKETPLACES[upperMarket]) {
        continue;
      }

      if (cleanTag) {
        const existing = await prisma.amazonAffiliateTag.findFirst({
          where: { marketplace: upperMarket, isDefault: true, groupId: null, smartLinkId: null },
        });

        if (existing) {
          await prisma.amazonAffiliateTag.update({
            where: { id: existing.id },
            data: { tag: cleanTag },
          });
        } else {
          await prisma.amazonAffiliateTag.create({
            data: {
              marketplace: upperMarket,
              tag: cleanTag,
              isDefault: true,
            },
          });
        }
      } else {
        await prisma.amazonAffiliateTag.deleteMany({
          where: { marketplace: upperMarket, isDefault: true, groupId: null, smartLinkId: null },
        });
      }
    }

    logger.info('Updated marketplace affiliate tracking IDs');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to update affiliate tags', error);
    return NextResponse.json({ error: 'Failed to update affiliate tags' }, { status: 500 });
  }
}
