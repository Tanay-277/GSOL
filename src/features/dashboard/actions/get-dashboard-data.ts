"use server";

import { db } from "@/db";
import { unstable_cache } from "next/cache";

export type DashboardData = {
  totalCourses: number;
  coursesByType: {
    type: string;
    count: number;
  }[];
  coursesByLevel: {
    level: string;
    count: number;
  }[];
  recentCourses: {
    id: string;
    name: string;
    progress: number;
    type: string;
    level: string;
    totalChapters: number;
    completedChapters: number;
  }[];
};

export const getDashboardData = unstable_cache(
  async (userId: string): Promise<DashboardData> => {
    const [totalCourses, coursesByType, coursesByLevel, recentCourses] =
      await Promise.all([
        db.course.count({
          where: { userId },
        }),
        db.course.groupBy({
          by: ["type"],
          where: { userId },
          _count: true,
        }),
        db.course.groupBy({
          by: ["level"],
          where: { userId },
          _count: true,
        }),
        db.course.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
            chapters: {
              select: {
                id: true,
                completed: true,
              },
            },
          },
        }),
      ]);

    return {
      totalCourses,
      coursesByType: coursesByType.map(({ type, _count }) => ({
        type: type.toString(),
        count: _count,
      })),
      coursesByLevel: coursesByLevel.map(({ level, _count }) => ({
        level: level.toString(),
        count: _count,
      })),
      recentCourses: recentCourses.map((course) => {
        const totalChapters = course.chapters.length;
        const completedChapters = course.chapters.filter(
          (chapter) => chapter.completed,
        ).length;
        const progress = totalChapters
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

        return {
          id: course.id,
          name: course.name,
          type: course.type,
          level: course.level,
          progress,
          totalChapters,
          completedChapters,
        };
      }),
    };
  },
  ["dashboard-data"],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ["dashboard"],
  },
);
