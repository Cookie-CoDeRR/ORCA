import { NextResponse } from "next/server";
import { getOrUpdateNews } from "@/lib/services/newsEngine";

// Next.js ISR: Revalidate twice a day (every 43200 seconds = 12 hours)
export const revalidate = 43200;

export async function GET() {
  try {
    const data = await getOrUpdateNews(false);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load news dataset", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const data = await getOrUpdateNews(true);
    return NextResponse.json(
      { message: "News engine synchronized successfully", data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Manual sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
