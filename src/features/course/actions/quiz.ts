"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function submitQuizAttempt({
  quizId,
  userId,
  answers,
}: {
  quizId: string;
  userId: string;
  answers: Record<string, string>;
}) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  let score = 0;
  quiz.questions.forEach((question) => {
    if (answers[question.id] === question.answer) {
      score++;
    }
  });

  await db.quizAttempt.create({
    data: {
      quizId,
      userId,
      score,
      answers: answers,
    },
  });

  revalidatePath(`/courses/${quiz.courseId}/quiz`);

  return {
    score,
    totalQuestions: quiz.questions.length,
  };
}
