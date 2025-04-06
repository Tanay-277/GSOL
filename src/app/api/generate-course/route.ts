import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { rateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { Assessment, Course, PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini API client with safety checks
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  : null;

// Create a separate prisma client to ensure we can debug issues
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

interface UserResponse {
  question: string;
  answer: string;
}

interface FlashcardData {
  question: string;
  answer: string;
}

interface IllnessData {
  name: string;
  courseTitle: string;
  youtubeQuery: string;
  flashcards: FlashcardData[];
}

interface GeminiResponse {
  illnesses: IllnessData[];
}

export async function POST(request: NextRequest) {
  console.log("Starting POST request to generate-course endpoint");

  try {
    // Check database connection
    try {
      await prisma.$connect();
      console.log("Prisma connection successful");
    } catch (connError) {
      console.error("Prisma connection error:", connError);
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Finding user:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", user.id);

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

    const { responses, assessment } = body;

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: "Valid responses array is required" }, { status: 400 });
    }

    const sanitizedResponses = responses.map((r: UserResponse) => ({
      question: r.question.slice(0, 500).replace(/<[^>]*>?/gm, ""),
      answer: r.answer.slice(0, 500).replace(/<[^>]*>?/gm, ""),
    }));

    // Extract diagnostic information from the assessment if available
    let existingIssues: string[] = [];
    if (assessment && assessment.diagnosis && Array.isArray(assessment.diagnosis)) {
      existingIssues = assessment.diagnosis.map((d: { name: string }) => d.name);
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

    // Enhanced comprehensive prompt for illness detection, course creation, YouTube queries, and flashcards
    const comprehensivePrompt = `
      You are a mental health AI assistant inside a learning platform.
      
      A user has just completed a mental health assessment. Based on their answers, you need to:
      1. Detect possible mental health illnesses.
      2. For each illness, create a course title.
      3. Suggest YouTube video search queries related to that illness.
      4. Generate 3–5 flashcards based on key learnings from that topic.
      5. Return all information in structured JSON format to be shown on the dashboard.
      
      Input:
      ${JSON.stringify(sanitizedResponses)}
      
      Expected Output:
      {
        "illnesses": [
          {
            "name": "Generalized Anxiety Disorder",
            "courseTitle": "Understanding and Managing Anxiety",
            "youtubeQuery": "How to manage anxiety effectively",
            "flashcards": [
              {
                "question": "What are common symptoms of anxiety?",
                "answer": "Restlessness, fatigue, difficulty concentrating, and sleep disturbances."
              },
              {
                "question": "Name two strategies for managing anxiety.",
                "answer": "Cognitive behavioral therapy and deep breathing techniques."
              }
            ]
          }
        ]
      }
      
      Return ONLY the JSON with no additional explanation. Ensure it is a valid parseable JSON.
    `;

    console.log("Sending request to Gemini API");
    const analysisResult = await model.generateContent(comprehensivePrompt);
    const analysisText = await analysisResult.response.text();

    // Extract the JSON object from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const jsonResponse = jsonMatch ? jsonMatch[0] : "{}";

    try {
      const parsedData = JSON.parse(jsonResponse) as GeminiResponse;
      console.log("Successfully parsed Gemini response:", JSON.stringify(parsedData, null, 2));

      // Verify we have valid illness data
      if (
        !parsedData.illnesses ||
        !Array.isArray(parsedData.illnesses) ||
        parsedData.illnesses.length === 0
      ) {
        console.error("Missing or empty illnesses array in Gemini response");
        throw new Error("Invalid response format from AI - missing illnesses");
      }

      // Extract illness names for the assessment
      const illnessNames = parsedData.illnesses.map((illness) => illness.name);
      console.log("Identified illnesses:", illnessNames);

      // Store the assessment with identified issues
      console.log("Creating assessment in database...");

      // Verify prisma has the assessment model
      const models = Object.keys(prisma);
      console.log("Available Prisma models:", models);

      let createdAssessment: Assessment;

      try {
        createdAssessment = await prisma.assessment.create({
          data: {
            userId: user.id,
            responses: sanitizedResponses as { question: string; answer: string }[],
            result: assessment || {},
            issues: [...new Set([...existingIssues, ...illnessNames])], // Remove duplicates
          },
        });
        console.log("Assessment created:", createdAssessment.id);
      } catch (assessmentError) {
        console.error("Error creating assessment:", assessmentError);
        return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
      }

      // Create courses in the database
      const createdCourses: Course[] = [];
      console.log("Creating courses in database...");

      for (const illness of parsedData.illnesses) {
        try {
          // Create the course
          console.log(`Creating course for ${illness.name}...`);
          const createdCourse = await prisma.course.create({
            data: {
              name: illness.courseTitle,
              description: `Course about ${illness.name}`,
              topic: illness.youtubeQuery,
              level: "Easy",
              duration: "4 weeks",
              userId: user.id,
              assessmentId: createdAssessment.id,
            },
          });

          // Create flashcards for the course
          console.log(`Creating ${illness.flashcards.length} flashcards...`);
          const flashcardPromises = illness.flashcards.map((flashcard) =>
            prisma.flashcard.create({
              data: {
                title: flashcard.question,
                content: flashcard.answer,
                courseId: createdCourse.id,
              },
            }),
          );

          await Promise.all(flashcardPromises);
          createdCourses.push(createdCourse);
          console.log(`Course ${createdCourse.id} created successfully with flashcards`);
        } catch (courseError) {
          console.error(`Error creating course for ${illness.name}:`, courseError);
          // Continue with other courses even if one fails
        }
      }

      console.log("All courses created successfully. Returning response...");
      await prisma.$disconnect();
      return NextResponse.json(
        {
          illnesses: parsedData.illnesses,
          courses: createdCourses,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError, "Raw response:", analysisText);
      await prisma.$disconnect();
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error generating courses:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    // Ensure the connection is closed
    await prisma.$disconnect();
  }
}
