import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { rateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini API client with safety checks
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  : null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limiter = rateLimit({
      interval: 60 * 1000, // 60 seconds
      uniqueTokenPerInterval: 500, // Max 500 users per interval
    });

    const ip = request.headers.get("x-forwarded-for") || "anonymous";

    try {
      await limiter.check(3, ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    if (!genAI) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { courseId, topic } = body;

    if (!courseId || !topic) {
      return NextResponse.json({ error: "Course ID and topic are required" }, { status: 400 });
    }

    // Verify the course belongs to the user
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const prompt = `
      You are an educational expert creating flashcards for a course on ${topic}.
      Generate 10 high-quality flashcards that cover key concepts, definitions, and important information about this topic.
      
      Each flashcard should have a clear question on the front and a concise, accurate answer on the back.
      The content should be educational, factual, and appropriate for learning.
      
      Return the flashcards in the following JSON format:
      
      {
        "flashcards": [
          {
            "title": "What is the definition of X?",
            "content": "X is defined as..."
          },
          {
            "title": "What are the main symptoms of Y?",
            "content": "The main symptoms of Y include..."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const flashcardText = await result.response.text();

    // Extract the JSON object from the response
    const flashcardMatch = flashcardText.match(/\{[\s\S]*\}/);
    const flashcardJson = flashcardMatch ? flashcardMatch[0] : "{}";
    const flashcardData = JSON.parse(flashcardJson);

    // Create flashcards in the database
    const createdFlashcards = [];
    for (const flashcard of flashcardData.flashcards || []) {
      const createdFlashcard = await db.flashcard.create({
        data: {
          title: flashcard.title,
          content: flashcard.content,
          courseId,
        },
      });
      createdFlashcards.push(createdFlashcard);
    }

    return NextResponse.json(
      {
        flashcards: createdFlashcards,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
