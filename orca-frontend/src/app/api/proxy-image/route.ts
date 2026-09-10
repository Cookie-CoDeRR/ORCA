import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSemanticFallbackImage } from "@/lib/services/semanticFallbackBank";

export const revalidate = 604800; // 7 days edge cache

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const category = searchParams.get("category") || "DEFAULT";

  const fallbackPath = getSemanticFallbackImage(category);

  // Helper to serve local fallback image directly from disk with 200 OK
  const serveFallback = () => {
    try {
      const fullPath = path.join(process.cwd(), "public", fallbackPath.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "X-Image-Source": "ORCA-Semantic-Fallback",
          },
        });
      }
    } catch {
      // ignore
    }
    // As a secondary fallback, redirect
    return NextResponse.redirect(new URL(fallbackPath, req.url), 302);
  };

  // If no URL supplied, return fallback
  if (!targetUrl) {
    return serveFallback();
  }

  // If targetUrl is already a local asset, redirect to it
  if (targetUrl.startsWith("/images/")) {
    return serveFallback();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    // Fetch remote image with standard browser headers to bypass hotlinking/referrer blocks
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";

    // Validate that the response is actually an image and succeeded
    if (!response.ok || !contentType.startsWith("image/")) {
      return serveFallback();
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        "X-Image-Source": "ORCA-Proxy-Ingested",
      },
    });
  } catch {
    // If connection timed out, DNS failed, or remote server blocked, serve verified semantic fallback
    return serveFallback();
  }
}
