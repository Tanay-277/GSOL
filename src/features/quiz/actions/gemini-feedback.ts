"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

type EnhancedFeedback = {
  questionId: string;
  explanation: string;
  conceptExplanation: string;
  relatedTopics: string[];
  studyResources: string[];
};

export async function getGeminiFeedback({
  quizId,
  answers,
}: {
  quizId: string;
  answers: Record<string, string>;
}) {
  try {
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        course: true,
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const enhancedFeedback: Record<string, EnhancedFeedback> = {};

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.answer;

      const prompt = `
        Context: This is a quiz question from a ${quiz.course.topic} course.
        Question: ${question.question}
        User's Answer: ${userAnswer}
        Correct Answer: ${question.answer}
        Result: ${isCorrect ? "Correct" : "Incorrect"}

        Please provide:
        1. A detailed explanation of why this answer is ${isCorrect ? "correct" : "incorrect"}
        2. An explanation of the core concept being tested
        3. Three related topics that the student should study
        4. Two specific study resources or practice exercises

        Format the response as JSON with the following structure:
        {
          "explanation": "explanation text",
          "conceptExplanation": "concept text",
          "relatedTopics": ["topic1", "topic2", "topic3"],
          "studyResources": ["resource1", "resource2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const feedback = JSON.parse(text);
        enhancedFeedback[question.id] = {
          questionId: question.id,
          ...feedback,
        };
      } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        enhancedFeedback[question.id] = {
          questionId: question.id,
          explanation: "Error generating detailed feedback",
          conceptExplanation: "Error generating concept explanation",
          relatedTopics: [],
          studyResources: [],
        };
      }
    }

    return enhancedFeedback;
  } catch (error) {
    console.error("Error generating Gemini feedback:", error);
    throw new Error("Failed to generate enhanced feedback");
  }
}
