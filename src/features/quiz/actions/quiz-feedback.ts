"use server";

import { db } from "@/db";
import { getGeminiFeedback } from "./gemini-feedback";

type QuizFeedback = {
  score: number;
  totalQuestions: number;
  percentageScore: number;
  questionFeedback: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    aiFeedback?: {
      explanation: string;
      conceptExplanation: string;
      relatedTopics: string[];
      studyResources: string[];
    };
  }[];
  passingScore: number;
  passed: boolean;
  improvement?: string[];
};

export async function getQuizFeedback({
  quizId,
  answers,
}: {
  quizId: string;
  answers: Record<string, string>;
}): Promise<QuizFeedback> {
  try {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const geminiFeedback = await getGeminiFeedback({ quizId, answers });

    const totalQuestions = quiz.questions.length;
    const passingScore = 70;
    let correctAnswers = 0;
    const questionFeedback: QuizFeedback["questionFeedback"] = [];
    const improvementAreas: string[] = [];

    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.answer;

      if (isCorrect) {
        correctAnswers++;
      } else {
        improvementAreas.push(question.question);
      }

      questionFeedback.push({
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: question.answer,
        isCorrect,
        aiFeedback: geminiFeedback[question.id],
      });
    });

    const score = correctAnswers;
    const percentageScore = (correctAnswers / totalQuestions) * 100;
    const passed = percentageScore >= passingScore;

    const improvement =
      improvementAreas.length > 0
        ? [
            "Review these topics:",
            ...improvementAreas.map((q) => `- ${q}`),
            passed
              ? "Focus on these areas to achieve an even better score next time!"
              : "Focus on these areas and try again to pass the quiz.",
          ]
        : undefined;

    return {
      score,
      totalQuestions,
      percentageScore,
      questionFeedback,
      passingScore,
      passed,
      improvement,
    };
  } catch (error) {
    console.error("Error generating quiz feedback:", error);
    throw new Error("Failed to generate quiz feedback");
  }
}
