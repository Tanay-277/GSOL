import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { question, options, answer, quizId } = body;

    if (!question || !options || !answer || !quizId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const createdQuestion = await prisma.quizQuestion.create({
      data: {
        question,
        options,
        answer,
        quizId,
      },
    });

    return NextResponse.json(createdQuestion, { status: 201 });
  } catch (error) {
    console.error("[QUIZ_QUESTION_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("quizId");

  if (!quizId) {
    return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
  }

  const questions = await prisma.quizQuestion.findMany({
    where: { quizId },
  });

  return NextResponse.json(questions);
}
