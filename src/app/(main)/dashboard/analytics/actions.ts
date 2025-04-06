"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { CourseType } from "@prisma/client";
import { format, subMonths } from "date-fns";
import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";

export type AnalyticsData = {
  totalCourses: number;
  courseTypesCount: number;
  topicsCount: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  quizCompletionRate: number;
  averageQuizScore: number;
  coursesByType: {
    type: string;
    count: number;
  }[];
  coursesByLevel: {
    level: string;
    count: number;
  }[];
  quizPerformanceOverTime: {
    date: string;
    score: number;
  }[];
  topPerformingCourses: {
    id: string;
    name: string;
    type: string;
    level: string;
    score: number;
    completionRate: number;
    achievements: string[];
  }[];
};

// Get session outside the cached function
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Call the cached function with userId
  return getAnalyticsDataCached(userId);
}

// Move the actual data fetching to a cached function that accepts userId
const getAnalyticsDataCached = unstable_cache(
  async (userId: string): Promise<AnalyticsData> => {
    // Get all courses data
    const [totalCourses, coursesByType, coursesByLevel, uniqueTopics, quizzes, quizAttempts] =
      await Promise.all([
        // Total courses
        db.course.count({
          where: { userId },
        }),

        // Courses by type
        db.course.groupBy({
          by: ["type"],
          where: { userId },
          _count: true,
        }),

        // Courses by level
        db.course.groupBy({
          by: ["level"],
          where: { userId },
          _count: true,
        }),

        // Unique topics count
        db.course.findMany({
          where: { userId },
          select: { topic: true },
          distinct: ["topic"],
        }),

        // All quizzes
        db.quiz.findMany({
          where: {
            course: {
              userId,
            },
          },
          include: {
            attempts: true,
          },
        }),

        // All quiz attempts
        db.quizAttempt.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
      ]);

    // Calculate quiz-related metrics
    const totalQuizzes = quizzes.length;
    const totalQuizAttempts = quizAttempts.length;

    // Calculate average quiz score
    const averageQuizScore = totalQuizAttempts
      ? Math.round(
          quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizAttempts,
        )
      : 0;

    // Calculate quiz completion rate (quizzes with at least one attempt)
    const quizzesWithAttempts = quizzes.filter((quiz) => quiz.attempts.length > 0).length;
    const quizCompletionRate = totalQuizzes
      ? Math.round((quizzesWithAttempts / totalQuizzes) * 100)
      : 0;

    // Generate quiz performance over time (last 6 months)
    const lastSixMonths = Array.from({ length: 6 })
      .map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthYear = format(date, "MMM yyyy");

        // Filter attempts for this month
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthAttempts = quizAttempts.filter(
          (attempt) => attempt.createdAt >= monthStart && attempt.createdAt <= monthEnd,
        );

        // Calculate average score for this month
        const score = monthAttempts.length
          ? Math.round(
              monthAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / monthAttempts.length,
            )
          : 0;

        return {
          date: monthYear,
          score,
        };
      })
      .reverse();

    // Get top performing courses
    const coursesWithQuizzes = await db.course.findMany({
      where: {
        userId,
        quiz: {
          isNot: null,
        },
      },
      include: {
        quiz: {
          include: {
            attempts: true,
          },
        },
        chapters: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    const topPerformingCourses = coursesWithQuizzes
      .map((course) => {
        // Calculate completion rate
        const totalChapters = course.chapters.length;
        const completedChapters = course.chapters.filter((chapter) => chapter.completed).length;
        const completionRate = totalChapters
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

        // Calculate average quiz score
        const attempts = course.quiz?.attempts ?? [];
        const score = attempts.length
          ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
          : 0;

        // Generate achievements
        const achievements: string[] = [];

        if (completionRate === 100) {
          achievements.push("Completed");
        }

        if (score >= 90) {
          achievements.push("Excellence");
        } else if (score >= 80) {
          achievements.push("High Performer");
        }

        if (attempts.length >= 3) {
          achievements.push("Persistent");
        }

        return {
          id: course.id,
          name: course.name,
          type: course.type.toString(),
          level: course.level.toString(),
          score,
          completionRate,
          achievements,
        };
      })
      // Sort by score, then completion rate
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : b.completionRate - a.completionRate,
      )
      // Take top 5
      .slice(0, 5);

    return {
      totalCourses,
      courseTypesCount: Object.keys(CourseType).length,
      topicsCount: uniqueTopics.length,
      totalQuizzes,
      totalQuizAttempts,
      quizCompletionRate,
      averageQuizScore,
      coursesByType: coursesByType.map(({ type, _count }) => ({
        type: formatEnumValue(type.toString()),
        count: _count,
      })),
      coursesByLevel: coursesByLevel.map(({ level, _count }) => ({
        level: formatEnumValue(level.toString()),
        count: _count,
      })),
      quizPerformanceOverTime: lastSixMonths,
      topPerformingCourses,
    };
  },
  ["analytics-data"],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ["analytics"],
  },
);

// Helper function to format enum values for display
function formatEnumValue(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
