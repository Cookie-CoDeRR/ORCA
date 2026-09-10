import { getSemanticFallbackImage } from "./semanticFallbackBank";

export interface ExtractedArticleMedia {
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  isFallback: boolean;
}

/**
 * Extracts OpenGraph, Twitter Card, or JSON-LD lead image metadata from an article URL.
 * Routes the image through the ORCA image proxy to guarantee CORS / hotlink immunity.
 */
export async function extractArticleMedia(
  articleUrl: string,
  categoryHint: string = "DEFAULT"
): Promise<ExtractedArticleMedia> {
  const fallbackImage = getSemanticFallbackImage(categoryHint);

  if (!articleUrl || !articleUrl.startsWith("http")) {
    return {
      title: "Operational Intelligence Bulletin",
      description: "Official marine observation report.",
      imageUrl: fallbackImage,
      sourceUrl: articleUrl || "#",
      isFallback: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        title: "Maritime Intelligence Notice",
        description: "Telemetry from sovereign observation feed.",
        imageUrl: fallbackImage,
        sourceUrl: articleUrl,
        isFallback: true,
      };
    }

    const html = await res.text();

    // 1. OpenGraph Image
    const ogImg =
      (html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i))?.[1];

    // 2. Twitter Image
    const twitterImg =
      (html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i))?.[1];

    // 3. Schema.org JSON-LD Image
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    let jsonLdImg: string | undefined;
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        if (typeof parsed.image === "string") jsonLdImg = parsed.image;
        else if (Array.isArray(parsed.image) && typeof parsed.image[0] === "string") jsonLdImg = parsed.image[0];
        else if (parsed.image && typeof parsed.image.url === "string") jsonLdImg = parsed.image.url;
      } catch {
        // ignore parse error
      }
    }

    // 4. Title & Description
    const ogTitle = (html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i))?.[1];
    const ogDesc = (html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i))?.[1];

    const rawCandidate = ogImg || twitterImg || jsonLdImg;

    if (rawCandidate && rawCandidate.startsWith("http")) {
      // Build safe proxy URL with semantic fallback parameter
      const safeProxyUrl = `/api/proxy-image?url=${encodeURIComponent(rawCandidate)}&category=${encodeURIComponent(categoryHint)}`;

      return {
        title: ogTitle || "Observational Marine Bulletin",
        description: ogDesc || "Cross-referenced telemetry report.",
        imageUrl: safeProxyUrl,
        sourceUrl: articleUrl,
        isFallback: false,
      };
    }

    return {
      title: ogTitle || "Observational Marine Bulletin",
      description: ogDesc || "Cross-referenced telemetry report.",
      imageUrl: fallbackImage,
      sourceUrl: articleUrl,
      isFallback: true,
    };
  } catch {
    return {
      title: "Maritime Intelligence Notice",
      description: "Official marine observation report.",
      imageUrl: fallbackImage,
      sourceUrl: articleUrl,
      isFallback: true,
    };
  }
}
