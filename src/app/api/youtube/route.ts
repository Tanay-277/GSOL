import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const limiter = rateLimit({
      interval: 60 * 1000, // 60 seconds
      uniqueTokenPerInterval: 500, // Max 500 users per interval
    });

    const ip = request.headers.get("x-forwarded-for") || "anonymous";

    try {
      await limiter.check(3, ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "YouTube API key missing" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const maxResults = searchParams.get("maxResults") || "5";

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query,
      )}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch YouTube data" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Format the response to include only necessary information
    const videos = data.items.map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: { medium: { url: string } };
          channelTitle: string;
          publishedAt: string;
        };
      }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }),
    );

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
