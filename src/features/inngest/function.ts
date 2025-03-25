import { Course, Flashcard, PrismaClient } from "@prisma/client";
import { inngest } from "./client";
import { generateFlashcards, generateQuiz } from "./generate-flash-card";

const prisma = new PrismaClient();

export const triggerFlashcards = inngest.createFunction(
  { id: "generate-flashcards" },
  { event: "course/generate.flashcards" },
  async ({ event, step }) => {
    const { courseId } = event.data;

    const course = await step.run("fetch-course", async () => {
      return await prisma.course.findUnique({
        where: { id: courseId },
        include: { chapters: true },
      });
    });

    if (!course) {
      throw new Error(`Course not found with ID: ${courseId}`);
    }

    const data = {
      ...course,
      createdAt: new Date(course?.createdAt.toString() ?? ""),
      updatedAt: new Date(course?.updatedAt?.toString() ?? ""),
    };

    const result = await generateFlashcards(data as Course);

    try {
      const flashcardsData = result.map((result: Flashcard) => ({
        title: result.title,
        content: result.content,
        courseId: course?.id as string,
      }));

      await prisma.flashcard.createMany({
        data: flashcardsData,
      });
    } catch (error) {
      console.error("Error inserting flashcards:", error);
    }

    return { courseId, status: "completed", result };
  },
);

export const generateVideoRecommendations = inngest.createFunction(
  { id: "generate-video-recommendations" },
  { event: "video/generate.recommendations" },
  async ({ event }) => {
    const { courseId, chapterId } = event.data;
    return { status: "completed", data: { courseId, chapterId } };
  },
);

export const triggerQuiz = inngest.createFunction(
  { id: "generate-quiz" },
  { event: "course/generate.quiz" },
  async ({ event }) => {
    const { courseId } = event.data;

    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { chapters: true },
      });

      if (!course) {
        throw new Error(`Course not found with ID: ${courseId}`);
      }

      const data = {
        ...course,
        createdAt: new Date(course?.createdAt.toString() ?? ""),
        updatedAt: new Date(course?.updatedAt?.toString() ?? ""),
      };

      const result = await generateQuiz(data as Course);

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error("Quiz generation failed or returned empty result");
      }

      const response = await prisma.$transaction(async (tx) => {
        const quiz = await tx.quiz.create({
          data: {
            courseId: course.id,
            title: `Quiz for ${course.name}`,
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const questionsData = result.map((item: any) => ({
          question: item.question,
          answer: item.answer,
          options: item.options,
          quizId: quiz.id,
        }));

        if (
          !questionsData.every(
            (q) => q.question && q.answer && Array.isArray(q.options),
          )
        ) {
          throw new Error("Invalid question data structure");
        }

        await tx.quizQuestion.createMany({
          data: questionsData,
        });

        return quiz;
      });

      return {
        courseId,
        status: "completed",
        result,
        quizId: response.id,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Detailed error in quiz generation:", {
        error,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },
);
