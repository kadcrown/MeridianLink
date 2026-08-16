import { prisma } from '@/lib/db';
import { SEED_NETWORKS, SEED_RETAILERS, SEED_PROGRAMS } from '@/lib/retailers/catalog';
import { logger } from '@/lib/logger';

export const SAMPLE_AMAZON_TAGS: Record<string, string> = {
  US: 'meridian-20',
  CA: 'kgold0c-20',
  GB: 'meridian-uk-21',
  DE: 'meridian-de-21',
  FR: 'meridian-fr-21',
  IT: 'meridian-it-21',
  ES: 'meridian-es-21',
  NL: 'meridian-nl-21',
  SE: 'meridian-se-21',
  PL: 'meridian-pl-21',
  BE: 'meridian-be-21',
  JP: 'meridian-jp-22',
  IN: 'meridian-in-21',
  AU: 'meridian-au-22',
  BR: 'meridian-br-20',
  MX: 'meridian-mx-20',
  SG: 'meridian-sg-22',
  SA: 'meridian-sa-21',
  AE: 'meridian-ae-21',
  TR: 'meridian-tr-21',
  EG: 'meridian-eg-21',
};

/**
 * Ensures the multi-retailer catalog (retailers, networks, programs) is seeded in the database.
 */
export async function ensureCatalogSeeded(): Promise<{ seeded: boolean; retailerCount: number; programCount: number }> {
  try {
    const existingCount = await prisma.affiliateProgram.count();
    if (existingCount > 0) {
      return { seeded: false, retailerCount: await prisma.retailer.count(), programCount: existingCount };
    }

    logger.info('Auto-seeding multi-retailer affiliate catalog...');

    // 1. Seed Retailers
    const retailerMap = new Map<string, string>();
    for (const r of SEED_RETAILERS) {
      const created = await prisma.retailer.upsert({
        where: { slug: r.slug },
        update: { name: r.name, websiteUrl: r.websiteUrl, isAmazon: !!r.isAmazon },
        create: {
          slug: r.slug,
          name: r.name,
          websiteUrl: r.websiteUrl,
          isAmazon: !!r.isAmazon,
          domains: {
            create: r.domains.map((d, i) => ({
              domain: d,
              isPrimary: i === 0,
            })),
          },
        },
      });
      retailerMap.set(r.slug, created.id);
    }

    // 2. Seed Networks
    const networkMap = new Map<string, string>();
    for (const n of SEED_NETWORKS) {
      const created = await prisma.affiliateNetwork.upsert({
        where: { slug: n.slug },
        update: { name: n.name, websiteUrl: n.websiteUrl, adapterKey: n.adapterKey },
        create: {
          slug: n.slug,
          name: n.name,
          websiteUrl: n.websiteUrl,
          adapterKey: n.adapterKey,
        },
      });
      networkMap.set(n.slug, created.id);
    }

    // 3. Seed Programs
    let programCount = 0;
    for (const p of SEED_PROGRAMS) {
      const retailerId = retailerMap.get(p.retailerSlug);
      const networkId = networkMap.get(p.networkSlug);

      if (retailerId && networkId) {
        await prisma.affiliateProgram.upsert({
          where: { slug: p.slug },
          update: {
            name: p.name,
            capabilityLevel: p.capabilityLevel,
            connectionType: p.connectionType,
            urlTemplate: p.urlTemplate,
            isDiscontinued: !!p.isDiscontinued,
            statusNote: p.statusNote || null,
          },
          create: {
            slug: p.slug,
            name: p.name,
            retailerId,
            networkId,
            countryCode: p.countryCode,
            marketplace: p.marketplace || null,
            capabilityLevel: p.capabilityLevel,
            connectionType: p.connectionType,
            urlTemplate: p.urlTemplate,
            isDiscontinued: !!p.isDiscontinued,
            statusNote: p.statusNote || null,
            fieldDefinitions: {
              create: p.fields.map((f, idx) => ({
                key: f.key,
                label: f.label,
                placeholder: f.placeholder,
                fieldType: f.fieldType,
                isRequired: f.isRequired,
                isSecret: f.isSecret,
                order: idx,
              })),
            },
          },
        });
        programCount++;
      }
    }

    logger.info(`Successfully seeded ${retailerMap.size} retailers and ${programCount} affiliate programs.`);
    return { seeded: true, retailerCount: retailerMap.size, programCount };
  } catch (error) {
    logger.error('Error during auto-seeding catalog:', error);
    return { seeded: false, retailerCount: 0, programCount: 0 };
  }
}

/**
 * Seeds default Amazon international marketplace affiliate tags.
 */
export async function seedDefaultAmazonTags(prefix = 'meridian'): Promise<number> {
  let count = 0;
  for (const [marketplace, suffix] of Object.entries(SAMPLE_AMAZON_TAGS)) {
    const tag = prefix === 'meridian' ? suffix : `${prefix}-${marketplace.toLowerCase()}`;
    const existing = await prisma.amazonAffiliateTag.findFirst({
      where: { marketplace, isDefault: true, groupId: null, smartLinkId: null },
    });

    if (!existing) {
      await prisma.amazonAffiliateTag.create({
        data: {
          marketplace,
          tag,
          isDefault: true,
        },
      });
      count++;
    }
  }
  return count;
}
