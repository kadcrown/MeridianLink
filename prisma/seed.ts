import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AMAZON_MARKETPLACES } from '../src/lib/amazon/marketplaces';
import { SEED_NETWORKS, SEED_RETAILERS, SEED_PROGRAMS } from '../src/lib/retailers/catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MeridianLink Multi-Retailer Platform database...');

  // 1. Create or ensure Owner account
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@meridianlink.local';
  const initialPassword = process.env.OWNER_INITIAL_PASSWORD || 'ChangeMeInProd123!';
  const passwordHash = await bcrypt.hash(initialPassword, 12);

  const owner = await prisma.owner.upsert({
    where: { email: ownerEmail },
    update: { passwordHash },
    create: {
      email: ownerEmail,
      name: 'Primary Owner',
      passwordHash,
    },
  });
  console.log(`Owner account established: ${owner.email}`);

  // 2. Seed Link Groups
  const defaultGroup = await prisma.linkGroup.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Group',
      slug: 'default',
      description: 'Default bucket for general links',
      color: '#0d9488',
      isDefault: true,
    },
  });

  const techGroup = await prisma.linkGroup.upsert({
    where: { slug: 'tech-gear' },
    update: {},
    create: {
      name: 'Tech Reviews',
      slug: 'tech-gear',
      description: 'Consumer electronics and desk gear reviews',
      color: '#6366f1',
    },
  });

  const homeGroup = await prisma.linkGroup.upsert({
    where: { slug: 'home-kitchen' },
    update: {},
    create: {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Kitchen appliances, coffee makers, and decor',
      color: '#f59e0b',
    },
  });

  // 3. Seed Master Retailers & Domains
  console.log(`Seeding ${SEED_RETAILERS.length} Retailers...`);
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

  // 4. Seed Affiliate Networks
  console.log(`Seeding ${SEED_NETWORKS.length} Affiliate Networks...`);
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

  // 5. Seed Multi-Retailer Affiliate Programs & Fields
  console.log(`Seeding ${SEED_PROGRAMS.length} Affiliate Programs...`);
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
    }
  }

  // 6. Clean existing sample tags, links, and rollups for idempotent re-seeding
  await prisma.dailyAnalyticsRollup.deleteMany();
  await prisma.amazonAffiliateTag.deleteMany();
  await prisma.smartLink.deleteMany();

  // Seed Amazon 21-Marketplace Default Affiliate Tags
  console.log('Seeding 21 Amazon default Associates tags...');
  const sampleTags: Record<string, string> = {
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

  for (const [mkt, tag] of Object.entries(sampleTags)) {
    await prisma.amazonAffiliateTag.create({
      data: {
        marketplace: mkt,
        tag,
        isDefault: true,
      },
    });
  }

  // Group override example: UK tag on Tech Reviews group
  await prisma.amazonAffiliateTag.create({
    data: {
      marketplace: 'GB',
      tag: 'meridiantech-uk-21',
      groupId: techGroup.id,
      isDefault: false,
    },
  });

  // 7. Seed Smart Links (Smart, Choice, A/B)
  console.log('Seeding representative SmartLinks...');
  const amazonRetailerId = retailerMap.get('amazon')!;
  const bestBuyRetailerId = retailerMap.get('best-buy');
  const walmartRetailerId = retailerMap.get('walmart');

  // Link 1: Smart Link with regional destinations
  await prisma.smartLink.create({
    data: {
      slug: 'sony-xm5',
      displayName: 'Sony WH-1000XM5 Wireless Headphones',
      originalUrl: 'https://www.amazon.com/dp/B09XS7JWHH',
      asin: 'B09XS7JWHH',
      productTitle: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
      productImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      groupId: techGroup.id,
      retailerId: amazonRetailerId,
      linkType: 'SMART',
      utmSource: 'youtube',
      utmMedium: 'video_description',
      utmCampaign: 'desk_tour_2026',
      destinations: {
        create: [
          { countryCode: 'GLOBAL', marketplace: 'US', url: 'https://www.amazon.com/dp/B09XS7JWHH', isManual: true, isVerified: true, fallbackType: 'EXACT_ASIN' },
          { countryCode: 'CA', marketplace: 'CA', url: 'https://amazon.ca/dp/B09XS7JWHH', isManual: false, isVerified: true, fallbackType: 'EXACT_ASIN' },
          { countryCode: 'GB', marketplace: 'GB', url: 'https://www.amazon.co.uk/dp/B09XS7JWHH', isManual: false, isVerified: true, fallbackType: 'EXACT_ASIN' },
          { countryCode: 'DE', marketplace: 'DE', url: 'https://www.amazon.de/dp/B09XS7JWHH', isManual: true, isVerified: true, fallbackType: 'EXACT_ASIN' },
        ],
      },
    },
  });

  // Link 2: Multi-Retailer Choice Page
  await prisma.smartLink.create({
    data: {
      slug: 'desk-pro',
      displayName: 'Dual-Motor Electric Standing Desk',
      originalUrl: 'https://www.amazon.com/dp/B08G8PKL1Z',
      asin: 'B08G8PKL1Z',
      productTitle: 'Ergonomic Height Adjustable Standing Desk 60x30 inch',
      productImageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800',
      groupId: techGroup.id,
      linkType: 'CHOICE',
      choiceTheme: {
        create: {
          title: 'Dual-Motor Electric Standing Desk',
          description: 'Premium dual-motor electric standing desk with 4 memory presets and solid bamboo desktop.',
          ctaText: 'Select your preferred retailer',
          accentColor: '#0d9488',
          themeMode: 'SYSTEM',
        },
      },
      destinations: {
        create: [
          { countryCode: 'US', marketplace: 'US', url: 'https://www.amazon.com/dp/B08G8PKL1Z', label: 'Buy on Amazon US', priceString: '$499.99', retailerId: amazonRetailerId },
          { countryCode: 'US', marketplace: 'US', url: 'https://www.bestbuy.com/site/standing-desk/6450000.p', label: 'Buy on Best Buy', priceString: '$489.99', retailerId: bestBuyRetailerId },
          { countryCode: 'US', marketplace: 'US', url: 'https://www.walmart.com/ip/standing-desk/987654321', label: 'Buy on Walmart', priceString: '$479.00', retailerId: walmartRetailerId },
          { countryCode: 'CA', marketplace: 'CA', url: 'https://www.amazon.ca/dp/B08G8PKL1Z', label: 'Buy on Amazon Canada', priceString: 'CAD $649.99', retailerId: amazonRetailerId },
          { countryCode: 'GB', marketplace: 'GB', url: 'https://www.amazon.co.uk/dp/B08G8PKL1Z', label: 'Buy on Amazon UK', priceString: '£429.00', retailerId: amazonRetailerId },
        ],
      },
    },
  });

  // Link 3: A/B Split Link
  await prisma.smartLink.create({
    data: {
      slug: 'fellow-kettle',
      displayName: 'Fellow Stagg EKG Electric Kettle',
      originalUrl: 'https://www.amazon.com/dp/B077JBQZPX',
      asin: 'B077JBQZPX',
      productTitle: 'Fellow Stagg EKG Electric Pour-Over Tea and Coffee Kettle',
      productImageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
      groupId: homeGroup.id,
      linkType: 'AB_TEST',
      abVariants: {
        create: [
          { name: 'Matte Black Finish', destinationUrl: 'https://www.amazon.com/dp/B077JBQZPX', weight: 50 },
          { name: 'Polished Copper Finish', destinationUrl: 'https://www.amazon.com/dp/B07N8D3B2S', weight: 50 },
        ],
      },
    },
  });

  // Link 4: MacBook Air
  await prisma.smartLink.create({
    data: {
      slug: 'macbook-air',
      displayName: 'Apple MacBook Air 15-inch M3',
      originalUrl: 'https://www.amazon.com/dp/B0CX23G2H2',
      asin: 'B0CX23G2H2',
      productTitle: 'Apple 2024 MacBook Air 15-inch Laptop with M3 chip',
      groupId: techGroup.id,
      retailerId: amazonRetailerId,
      linkType: 'SMART',
    },
  });

  // 8. Seed 30 Days of Realistic Aggregated Analytics Rollups
  console.log('Generating 30 days of analytics rollups...');
  const allCreatedLinks = await prisma.smartLink.findMany();
  const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU'];
  const devices = ['DESKTOP', 'MOBILE', 'TABLET', 'BOT'];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);

    for (const link of allCreatedLinks) {
      for (const country of countries) {
        for (const device of devices) {
          const isBot = device === 'BOT';
          const humans = isBot ? 0 : Math.floor(Math.random() * 25) + 2;
          const bots = isBot ? Math.floor(Math.random() * 8) + 1 : 0;

          await prisma.dailyAnalyticsRollup.create({
            data: {
              date: dateStr,
              smartLinkId: link.id,
              country,
              marketplace: country,
              retailerSlug: 'amazon',
              deviceCategory: device,
              osFamily: device === 'MOBILE' ? 'iOS' : 'macOS',
              browserFamily: device === 'MOBILE' ? 'Mobile Safari' : 'Chrome',
              totalClicks: humans + bots,
              humanClicks: humans,
              botClicks: bots,
              uniqueVisitorsEstimate: Math.max(1, Math.floor(humans * 0.85)),
            },
          });
        }
      }
    }
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
