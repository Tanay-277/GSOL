import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Cache YouTube results to avoid duplicate API calls
interface YouTubeVideo {
  id?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
  courseId?: string | null;
}

const youtubeCache = new Map<string, { videos: YouTubeVideo[]; timestamp: number }>();

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
      console.error("YouTube API key missing");
      return NextResponse.json({ error: "YouTube API key missing" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const maxResults = searchParams.get("maxResults") || "5";
    const courseId = searchParams.get("courseId"); // Added courseId parameter

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    console.log(
      `YouTube API request: query=${query}, maxResults=${maxResults}, courseId=${courseId || "none"}`,
    );

    // Create cache key
    const cacheKey = `${query}-${maxResults}-${courseId || ""}`;

    // Check cache first (cache valid for 1 hour)
    const cachedResult = youtubeCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < 60 * 60 * 1000) {
      console.log("Returning cached YouTube results for:", cacheKey);
      return NextResponse.json({ videos: cachedResult.videos, fromCache: true });
    }

    // Set up AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(
        "Fetching from YouTube API:",
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video`,
      );

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query,
        )}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("YouTube API error:", errorData);
        return NextResponse.json(
          { error: "Failed to fetch YouTube data" },
          { status: response.status },
        );
      }

      const data = await response.json();
      console.log(`YouTube API returned ${data.items?.length || 0} videos`);

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
          courseId: courseId, // Include courseId in response if provided
        }),
      );

      // Store results in cache
      youtubeCache.set(cacheKey, {
        videos,
        timestamp: Date.now(),
      });

      // Cleanup old cache entries
      const now = Date.now();
      for (const [key, value] of youtubeCache.entries()) {
        if (now - value.timestamp > 6 * 60 * 60 * 1000) {
          // 6 hours expiration
          youtubeCache.delete(key);
        }
      }

      return NextResponse.json(
        {
          videos,
          courseId: courseId || null,
        },
        {
          headers: {
            "Cache-Control": "max-age=3600, s-maxage=3600",
          },
        },
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);

      // If this is an AbortError (timeout), provide a clear message
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json({ error: "YouTube API request timed out" }, { status: 408 });
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
