"use server";

import { db } from "@/db";

export const getCourseQuiz = async ({ id }: { id: string }) => {
  const course = await db.course.findFirst({
    where: {
      id,
    },
    include: {
      chapters: true,
      flashcards: true,
      quiz: true,
      user: true,
    },
  });

  const quiz = await db.quiz.findUnique({
    where: {
      id: course?.quiz?.id as string,
    },
    include: {
      questions: {
        include: {
          quiz: true,
        },
      },
      attempts: true,
      course: true,
    },
  });
  return quiz;
};
