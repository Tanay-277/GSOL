"use server";

import { db } from "@/db";

export const getCourse = async (id: string) => {
  try {
    return await db.course.findFirst({
      where: {
        id,
      },
      include: {
        chapters: true,
        user: true,
        flashcards: true,
        quiz: true,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get course");
  }
};
