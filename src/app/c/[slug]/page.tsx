import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ChoiceViewer from '@/components/choice/ChoiceViewer';
import { buildAffiliateUrl } from '@/lib/amazon/tagger';

interface ChoicePageProps {
  params: {
    slug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: ChoicePageProps): Promise<Metadata> {
  const link = await prisma.smartLink.findUnique({
    where: { slug: params.slug },
  });

  if (!link) {
    return { title: 'Product Not Found - MeridianLink' };
  }

  return {
    title: `${link.productTitle || link.displayName} | Meridian Choice`,
    description: link.notes || `Choose your preferred localized store for ${link.displayName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ChoicePage({ params, searchParams }: ChoicePageProps) {
  const link = await prisma.smartLink.findUnique({
    where: { slug: params.slug },
    include: {
      destinations: { where: { isActive: true }, orderBy: { weight: 'desc' } },
      group: { include: { tagOverrides: true } },
      tagOverrides: true,
    },
  });

  if (!link || !link.isActive || link.isArchived) {
    notFound();
  }

  // Load account default tags
  const defaultTags = await prisma.amazonAffiliateTag.findMany({
    where: { isDefault: true },
  });
  const tagMap: Record<string, string> = {};
  for (const item of defaultTags) {
    tagMap[item.marketplace] = item.tag;
  }
  if (link.group?.tagOverrides) {
    for (const item of link.group.tagOverrides) {
      tagMap[item.marketplace] = item.tag;
    }
  }
  if (link.tagOverrides) {
    for (const item of link.tagOverrides) {
      tagMap[item.marketplace] = item.tag;
    }
  }

  // Load app disclosure
  const disclosureSetting = await prisma.appSetting.findUnique({
    where: { key: 'affiliateDisclosure' },
  });

  // Build target URLs with tags
  const destinations = link.destinations.map((d) => {
    const appliedTag = tagMap[d.marketplace] || tagMap['US'];
    const taggedUrl = buildAffiliateUrl({
      url: d.url,
      tag: appliedTag,
      marketplaceId: d.marketplace,
      utm: {
        source: typeof searchParams.utm_source === 'string' ? searchParams.utm_source : link.utmSource || undefined,
        medium: typeof searchParams.utm_medium === 'string' ? searchParams.utm_medium : link.utmMedium || undefined,
        campaign: typeof searchParams.utm_campaign === 'string' ? searchParams.utm_campaign : link.utmCampaign || undefined,
      },
    });

    return {
      id: d.id,
      countryCode: d.countryCode,
      marketplace: d.marketplace,
      url: taggedUrl,
      label: d.label,
      priceString: d.priceString,
    };
  });

  return (
    <ChoiceViewer
      slug={link.slug}
      title={link.productTitle || link.displayName}
      imageUrl={link.productImageUrl}
      notes={link.notes}
      destinations={destinations}
      affiliateDisclosure={disclosureSetting?.value}
    />
  );
}
