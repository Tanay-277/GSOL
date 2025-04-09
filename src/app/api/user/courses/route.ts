import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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

    // Get query params
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    
    // If courseId is provided, return a single course with detailed information
    if (courseId) {
      const course = await db.course.findUnique({
        where: {
          id: courseId,
          userId: user.id,
        },
        include: {
          chapters: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
          flashcards: true,
          quiz: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      return NextResponse.json({
        course,
      });
    }

    // Otherwise return all courses for the user
    const courses = await db.course.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        chapters: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
    });

    // Calculate progress for each course
    const coursesWithProgress = courses.map(course => {
      const totalChapters = course.chapters.length;
      const completedChapters = course.chapters.filter(chapter => chapter.completed).length;
      const progressPercentage = totalChapters > 0 
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;

      return {
        ...course,
        progress: progressPercentage,
        completedChapters,
        totalChapters,
      };
    });

    return NextResponse.json({
      courses: coursesWithProgress,
    });
  } catch (error) {
    console.error("Error fetching user courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
