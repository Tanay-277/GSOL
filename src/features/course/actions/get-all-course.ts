"use server";

import { db } from "@/db";

export const getAllCourses = async (id: string) => {
  if (!id) throw new Error("Email is required to fetch courses");

  try {
    const courses = await db.course.findMany({
      where: { userId: id },
    });
    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new Error("Failed to fetch courses");
  }
};
