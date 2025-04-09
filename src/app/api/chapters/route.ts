import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { chapterId, completed } = body;

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: "Completed status must be a boolean" }, { status: 400 });
    }

    // First get the chapter
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Verify the course belongs to the user
    if (chapter.course.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the chapter completion status
    const updatedChapter = await db.chapter.update({
      where: { id: chapterId },
      data: { completed },
    });

    // Get updated course progress
    const totalChapters = await db.chapter.count({
      where: { courseId: chapter.courseId },
    });
    
    const completedChapters = await db.chapter.count({
      where: { 
        courseId: chapter.courseId,
        completed: true,
      },
    });
    
    const progress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;

    return NextResponse.json({
      chapter: updatedChapter,
      courseProgress: {
        courseId: chapter.courseId,
        totalChapters,
        completedChapters,
        progress
      }
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 }
    );
  }
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

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("id");
    
    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    // Get the chapter with its course
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Verify the course belongs to the user
    if (chapter.course.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If it's a video chapter, fetch YouTube video details if needed
    if (chapter.category === "video" && chapter.topic.startsWith("youtube:")) {
      const videoId = chapter.topic.replace("youtube:", "");
      
      // Return the chapter with video info
      return NextResponse.json({
        ...chapter,
        videoId,
        videoUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}
