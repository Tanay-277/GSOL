import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { rateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { Course, PrismaClient } from "@prisma/client";
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

interface ChapterData {
  title: string;
  description: string;
  duration: string;
  content: string;
}

interface IllnessData {
  name: string;
  courseTitle: string;
  description: string;
  youtubeQuery: string;
  level: "Easy" | "Moderate" | "Difficult";
  chapters: ChapterData[];
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
      const text = await request.text();
      console.log("Request body received, length:", text.length);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { responses, assessment } = body;

    console.log("Received responses array length:", responses?.length || 0);
    console.log("Assessment received:", assessment ? "yes" : "no");

    if (!Array.isArray(responses) || responses.length === 0) {
      console.error("Invalid responses array:", responses);
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

    // Enhanced prompt for course generation with chapters and videos
    const comprehensivePrompt = `
      You are a mental health AI assistant inside a learning platform.
      
      A user has just completed a mental health assessment. Based on their answers, you need to:
      1. Detect possible mental health issues.
      2. For each issue, create a detailed course with multiple chapters.
      3. Return all information in structured JSON format.
      
      Input:
      ${JSON.stringify(sanitizedResponses)}
      
      Expected Output:
      {
        "illnesses": [
          {
            "name": "Generalized Anxiety Disorder",
            "courseTitle": "Understanding and Managing Anxiety",
            "description": "A comprehensive course on managing anxiety symptoms and building coping strategies",
            "youtubeQuery": "How to manage anxiety effectively techniques",
            "level": "Easy",
            "chapters": [
              {
                "title": "Understanding Anxiety",
                "description": "Learn about what anxiety is and how it affects your body and mind",
                "duration": "15-20 minutes",
                "content": "Anxiety is a natural response to stress. This chapter explores the science behind anxiety, common triggers, and how to recognize symptoms early."
              },
              {
                "title": "Breathing Techniques",
                "description": "Simple breathing exercises to manage acute anxiety",
                "duration": "10-15 minutes",
                "content": "Proper breathing can help regulate your nervous system. This chapter covers diaphragmatic breathing, box breathing, and 4-7-8 technique with step-by-step instructions."
              },
              {
                "title": "Cognitive Strategies",
                "description": "Identifying and challenging anxious thoughts",
                "duration": "25-30 minutes",
                "content": "Our thoughts influence our feelings. Learn how to identify cognitive distortions that fuel anxiety and techniques to challenge and reframe negative thinking patterns."
              },
              {
                "title": "Building a Self-Care Routine",
                "description": "Creating daily habits that reduce anxiety",
                "duration": "15-20 minutes",
                "content": "Consistent self-care is essential for managing anxiety. This chapter helps you build a personalized self-care plan including sleep hygiene, nutrition, exercise, and relaxation practices."
              },
              {
                "title": "When to Seek Professional Help",
                "description": "Understanding treatment options and resources",
                "duration": "10-15 minutes",
                "content": "While self-help strategies are valuable, sometimes professional support is needed. This chapter covers therapy options, medication considerations, and how to find the right mental health provider."
              }
            ]
          }
        ]
      }
      
      Requirements:
      1. Create 1-2 relevant courses based on the assessment
      2. Each course should have 4-6 logical chapters that build on each other
      3. Provide appropriate course levels: "Easy", "Moderate", or "Difficult"
      4. Make YouTube query strings specific and educational
      5. Create helpful, detailed chapter content
      6. Be compassionate and educational in tone
      
      Return ONLY the JSON with no additional explanation.
    `;

    console.log("Sending request to Gemini API");
    
    // Use AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Gemini API request timeout triggered");
      controller.abort();
    }, 30000); // 30 seconds timeout
    
    try {
      const analysisResult = await model.generateContent(comprehensivePrompt);
      clearTimeout(timeoutId);
      
      console.log("Gemini API response received");
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

        // Extract illness names
        const illnessNames = parsedData.illnesses.map((illness) => illness.name);
        console.log("Identified illnesses:", illnessNames);

        // Store the assessment with identified issues
        console.log("Creating assessment in database...");

        const createdAssessment = await prisma.assessment.create({
          data: {
            userId: user.id,
            responses: sanitizedResponses,
            result: assessment || {},
            issues: [...new Set([...existingIssues, ...illnessNames])], // Remove duplicates
          },
        });
        console.log("Assessment created:", createdAssessment.id);

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
                description: illness.description || `Course about ${illness.name}`,
                topic: illness.youtubeQuery,
                level: illness.level || "Easy",
                duration: `${illness.chapters.length * 15}-${illness.chapters.length * 30} minutes`,
                type: "Others", // Default type
                userId: user.id,
                assessmentId: createdAssessment.id,
              },
            });
            console.log(`Course created: ${createdCourse.id}`);

            // Create chapters for the course
            console.log(`Creating ${illness.chapters.length} chapters...`);
            for (let i = 0; i < illness.chapters.length; i++) {
              const chapter = illness.chapters[i];
              await prisma.chapter.create({
                data: {
                  name: chapter.title,
                  description: chapter.description,
                  duration: chapter.duration,
                  category: "text", // Default category for text content
                  topic: chapter.content,
                  level: illness.level || "Easy",
                  orderIndex: i,
                  courseId: createdCourse.id,
                  completed: false,
                },
              });
            }
            
            // Trigger YouTube video chapter creation in the background
            try {
              console.log(`Triggering video fetch for course ${createdCourse.id}...`);
              // Fire and forget - don't wait
              fetch(`${request.nextUrl.origin}/api/course-videos?courseId=${createdCourse.id}`, {
                method: "GET",
                headers: {
                  // Include auth headers
                  "Cookie": request.headers.get("cookie") || "",
                  "x-forwarded-for": ip,
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                },
              }).catch(e => console.error(`Video fetch request error for course ${createdCourse.id}:`, e));
            } catch (videoError) {
              console.error(`Error triggering video fetch for course ${createdCourse.id}:`, videoError);
              // Non-critical error, continue
            }

            createdCourses.push(createdCourse);
            console.log(`Course ${createdCourse.id} created successfully with chapters`);
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
    } catch (genError) {
      clearTimeout(timeoutId);
      console.error("Error during Gemini API call:", genError);
      
      if (genError && typeof genError === 'object' && 'name' in genError && genError.name === 'AbortError') {
        return NextResponse.json(
          { error: "Course generation timed out" },
          { status: 408 }
        );
      }
      
      throw genError;
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
