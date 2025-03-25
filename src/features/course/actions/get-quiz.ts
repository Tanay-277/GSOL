"use server";

import { db } from "@/db";

export const getQuiz = async (id: string) => {
  const quiz = await db.quiz.findUnique({
    where: {
      id,
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
