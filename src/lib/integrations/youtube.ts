export interface ScannedVideoItem {
  videoId: string;
  videoTitle: string;
  publishedAt: string;
  originalDescription: string;
  proposedDescription: string;
  linksFound: Array<{
    originalUrl: string;
    suggestedSlug: string;
    suggestedShortUrl: string;
    retailer: string;
  }>;
}

export interface YouTubeScanJobResult {
  totalVideosScanned: number;
  videosWithLinks: number;
  items: ScannedVideoItem[];
}

/**
 * Scans video descriptions for retailer product URLs and generates proposed replacements with diffs.
 */
export function scanAndGenerateDiffs(
  videos: Array<{ id: string; title: string; publishedAt: string; description: string }>,
  appBaseUrl = 'http://localhost:3000'
): YouTubeScanJobResult {
  const amazonUrlRegex = /(https?:\/\/(?:www\.)?(?:amazon\.[a-z.]{2,7}|amzn\.to|a\.co)\/[^\s\n\r]+)/gi;
  const bestBuyRegex = /(https?:\/\/(?:www\.)?bestbuy\.[a-z.]{2,4}\/[^\s\n\r]+)/gi;
  const walmartRegex = /(https?:\/\/(?:www\.)?walmart\.com\/[^\s\n\r]+)/gi;

  const items: ScannedVideoItem[] = [];
  let videosWithLinks = 0;

  for (const v of videos) {
    const linksFound: ScannedVideoItem['linksFound'] = [];
    let proposedDescription = v.description;

    const findAndReplace = (regex: RegExp, retailer: string) => {
      let match;
      while ((match = regex.exec(v.description)) !== null) {
        const rawUrl = match[0];
        const randomSlug = `yt-${Math.random().toString(36).substring(2, 7)}`;
        const shortUrl = `${appBaseUrl}/r/${randomSlug}`;

        linksFound.push({
          originalUrl: rawUrl,
          suggestedSlug: randomSlug,
          suggestedShortUrl: shortUrl,
          retailer,
        });

        proposedDescription = proposedDescription.replace(rawUrl, shortUrl);
      }
    };

    findAndReplace(amazonUrlRegex, 'Amazon');
    findAndReplace(bestBuyRegex, 'Best Buy');
    findAndReplace(walmartRegex, 'Walmart');

    if (linksFound.length > 0) {
      videosWithLinks++;
      items.push({
        videoId: v.id,
        videoTitle: v.title,
        publishedAt: v.publishedAt,
        originalDescription: v.description,
        proposedDescription,
        linksFound,
      });
    }
  }

  return {
    totalVideosScanned: videos.length,
    videosWithLinks,
    items,
  };
}
