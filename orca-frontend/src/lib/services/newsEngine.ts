import fallbackData from "@/data/landing-news.json";

export interface BulletinRecord {
  id: string;
  bulletin: string;
  tag: string;
  readTime: string;
  date: string;
  title: string;
  excerpt: string;
  img: string;
  agency: string;
  coordinates: string;
  geodeticCell?: string;
  depth?: string;
  sst?: string;
  chlorophyll?: string;
  windSpeed?: string;
  centralPressure?: string;
  status?: string;
  href: string;
  websiteUrl?: string;
  websiteName?: string;
}

export interface SecondaryUpdateRecord {
  id: string;
  readTime: string;
  date: string;
  title: string;
  category: string;
  bulletinNo: string;
  thumb: string;
  agency: string;
  coordinates: string;
  href: string;
  websiteUrl?: string;
  websiteName?: string;
}

export interface NewsDataset {
  lastSynced: string;
  heroStories: BulletinRecord[];
  heroFeature: BulletinRecord;
  centerFeature: BulletinRecord;
  stackedFeatures: BulletinRecord[];
  secondaryUpdates: SecondaryUpdateRecord[];
  isFallback?: boolean;
}

/**
 * Validates whether an image URL exists and is loadable
 */
async function isValidImage(url: string): Promise<boolean> {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/images/")) return true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 ORCA-News-Engine/1.0" },
    });
    clearTimeout(timeout);
    const contentType = res.headers.get("content-type") || "";
    return res.ok && contentType.startsWith("image/");
  } catch {
    // If HEAD fails due to CORS/server policy, allow standard secure image URLs
    return url.startsWith("https://") && (url.includes(".jpg") || url.includes(".png") || url.includes(".webp"));
  }
}

/**
 * News Engine: Fetches real-time oceanic bulletins and updates images/links.
 * Gracefully falls back to persistent verified records if any image or feed fails.
 */
export async function getOrUpdateNews(forceRefresh = false): Promise<NewsDataset> {
  const currentBaseline = {
    ...fallbackData,
    heroStories: (fallbackData as any).heroStories || [fallbackData.heroFeature],
  } as NewsDataset;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // Fetch official NASA Earth Observatory RSS feed
    const nasaRes = await fetch(
      "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss",
      {
        signal: controller.signal,
        headers: { "User-Agent": "ORCA-Sovereign-Platform/1.0" },
        next: { revalidate: 43200 }, // 12 hours = twice per day revalidation
      }
    ).catch(() => null);
    clearTimeout(timeout);

    if (!nasaRes || !nasaRes.ok) {
      return { ...currentBaseline, isFallback: true };
    }

    const xmlText = await nasaRes.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    if (items.length === 0) {
      return currentBaseline;
    }

    const liveStories: BulletinRecord[] = [];

    for (let i = 0; i < Math.min(items.length, 3); i++) {
      const item = items[i];
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const imgMatch = item.match(/<img[^>]*src="([^"]+)"/);

      const title = titleMatch ? titleMatch[1].trim() : "";
      const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, "").trim();
      const link = linkMatch ? linkMatch[1].trim() : "";
      const remoteImg = imgMatch ? imgMatch[1].trim().replace(/&amp;/g, "&") : "";

      if (title && remoteImg) {
        const valid = await isValidImage(remoteImg);
        if (valid) {
          const proxiedImg = `/api/proxy-image?url=${encodeURIComponent(remoteImg)}&category=EARTH_OBSERVATION`;
          liveStories.push({
            id: `nasa-live-${i}`,
            bulletin: `NASA / EO OBS-${i + 1}`,
            tag: "Earth Observation",
            readTime: "3 MIN READ",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            title: title,
            excerpt: cleanDesc.slice(0, 180) + "...",
            img: proxiedImg,
            agency: "NASA Earth Observatory",
            coordinates: "Indian Ocean Basin",
            status: "LIVE_OBSERVATION",
            href: link || "/research",
            websiteUrl: link || "https://earthobservatory.nasa.gov",
            websiteName: "nasa.gov",
          });
        }
      }
    }

    // If live stories with valid images were gathered, merge them into the cycle
    if (liveStories.length > 0) {
      const mergedStories = [...liveStories, ...currentBaseline.heroStories].slice(0, 6);
      return {
        ...currentBaseline,
        lastSynced: new Date().toISOString(),
        heroStories: mergedStories,
        heroFeature: mergedStories[0],
        isFallback: false,
      };
    }

    return { ...currentBaseline, isFallback: true };
  } catch {
    // Zero-crash guarantee: fallback immediately to local store
    return { ...currentBaseline, isFallback: true };
  }
}
