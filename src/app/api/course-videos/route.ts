import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Define an interface for video metadata since we don't have a dedicated model
interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  courseId: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limiter = rateLimit({
      interval: 60 * 1000, // 60 seconds
      uniqueTokenPerInterval: 500, // Max 500 users per interval
    });

    const ip = request.headers.get("x-forwarded-for") || "anonymous";

    try {
      await limiter.check(5, ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Verify the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if there's a topic to search for videos
    if (!course.topic) {
      return NextResponse.json({ error: "Course has no topic defined" }, { status: 400 });
    }

    // Get videos for this course topic from YouTube API
    try {
      const searchQuery = encodeURIComponent(`${course.name} ${course.topic} educational`);
      const videoResponse = await fetch(
        `${request.nextUrl.origin}/api/youtube?q=${searchQuery}&maxResults=5&courseId=${courseId}`,
        { 
          headers: {
            // Forward the user's IP for rate limiting
            "x-forwarded-for": ip,
          }
        }
      );

      if (!videoResponse.ok) {
        console.error("Error fetching videos:", videoResponse.status);
        return NextResponse.json(
          { error: "Failed to fetch related videos" },
          { status: videoResponse.status }
        );
      }

      const videoData = await videoResponse.json();

      // Check if we got videos back
      if (!videoData.videos || videoData.videos.length === 0) {
        return NextResponse.json(
          { message: "No videos found for this course topic", videos: [] },
          { status: 200 }
        );
      }

      // Since there's no courseVideo model, we'll create chapters instead
      // Each video will be a chapter in the course
      const existingChapters = await db.chapter.findMany({
        where: {
          courseId: course.id,
          category: "video", // Use category to identify video chapters
        }
      });

      // Map of existing video IDs to avoid duplicates
      const existingVideoIds = new Set(
        existingChapters
          .filter(chapter => chapter.topic.startsWith("youtube:"))
          .map(chapter => chapter.topic.replace("youtube:", ""))
      );

      // Store the videos as chapters
      const videoPromises = videoData.videos
        .filter((video: VideoMetadata) => !existingVideoIds.has(video.id))
        .map(async (video: VideoMetadata, index: number) => {
          // Create a new chapter for each video
          return db.chapter.create({
            data: {
              name: video.title,
              description: video.description,
              duration: "5-10 minutes", // Estimated duration
              category: "video", // Mark as video content
              topic: `youtube:${video.id}`, // Store YouTube ID in the topic field
              level: course.level,
              orderIndex: existingChapters.length + index,
              completed: false,
              courseId: course.id,
            }
          });
        });

      // Wait for all video chapters to be created
      const createdVideoChapters = await Promise.all(videoPromises);

      // Get all video chapters for this course
      const allVideoChapters = await db.chapter.findMany({
        where: {
          courseId: course.id,
          category: "video",
        },
        orderBy: {
          orderIndex: 'asc'
        }
      });

      // Format the response
      const formattedVideos = allVideoChapters.map(chapter => {
        // Extract YouTube ID from topic field
        const videoId = chapter.topic.replace("youtube:", "");
        return {
          id: chapter.id,
          videoId: videoId,
          title: chapter.name,
          description: chapter.description,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, // Use YouTube thumbnail URL convention
          completed: chapter.completed,
          orderIndex: chapter.orderIndex,
          chapterId: chapter.id // Include chapter ID for reference
        };
      });

      return NextResponse.json({ 
        courseId: course.id,
        courseName: course.name,
        videos: formattedVideos,
        message: createdVideoChapters.length > 0 
          ? `Added ${createdVideoChapters.length} new videos to course` 
          : "No new videos added"
      });
    } catch (error) {
      console.error("Error processing course videos:", error);
      return NextResponse.json(
        { error: "Failed to process course videos" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in course-videos route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
