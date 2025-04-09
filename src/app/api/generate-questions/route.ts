import { rateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini API client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questionsCache = new Map<string, { questions: Question[], timestamp: number }>();

export async function POST(request: NextRequest) {
  if (!genAI) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    // Rate limiting
    const limiter = rateLimit({
      interval: 60 * 1000,
      uniqueTokenPerInterval: 500,
    });
    const ip = request.headers.get("x-forwarded-for") || "anonymous";

    try {
      await limiter.check(5, ip);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Extract focus & complexity
    let focus = "general wellness",
      complexity = "standard";
    try {
      const body = await request.json();
      focus =
        body.focus && typeof body.focus === "string"
          ? body.focus.slice(0, 50).replace(/[^\w\s]/gi, "")
          : focus;
      complexity =
        body.complexity && typeof body.complexity === "string"
          ? body.complexity.slice(0, 20).replace(/[^\w\s]/gi, "")
          : complexity;
    } catch {}
    
    // Generate cache key based on focus and complexity
    const cacheKey = `${focus}-${complexity}`;
    
    // Check cache first (cache valid for 5 minutes)
    const cachedResult = questionsCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < 5 * 60 * 1000) {
      console.log("Returning cached questions for:", cacheKey);
      return NextResponse.json(
        { questions: cachedResult.questions, source: "cached" },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'max-age=300, s-maxage=300',
          }
        },
      );
    }

    // Define model & chat session
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const chatSession = model.startChat({});

    // Define prompt
    const prompt = `
      You are a mental health professional creating an assessment questionnaire.

      Generate 8 mental health questions on "${focus}" with a "${complexity}" complexity level.
      Each question should have exactly 5 multiple-choice options.

      Return only a valid JSON object with this structure:
      { "questions": [{ "id": 1, "question": "...", "options": ["...", "...", "...", "...", "..."] }, ...] }
    `;

    // Generate response with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 15000),
    );
    
    // Use AbortController for more reliable timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const contentPromise = chatSession.sendMessage(prompt);
      const result = (await Promise.race([contentPromise, timeoutPromise])) as Awaited<
        typeof contentPromise
      >;
      clearTimeout(timeoutId);

      // Extract response text
      const candidates = result.response?.candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : "";
      
      if (!jsonText) {
        console.error("No valid JSON found in response");
        throw new Error("Invalid response format");
      }
      
      const initialParsedData = JSON.parse(jsonText);

      if (!initialParsedData.questions || !Array.isArray(initialParsedData.questions)) {
        throw new Error("Invalid questions format");
      }

      // Validate and sanitize questions
      interface Question {
        id: number;
        question: string;
        options: string[];
      }

      interface ParsedData {
        questions: Partial<Question>[];
      }

      const parsedData = JSON.parse(jsonText) as ParsedData;

      const validQuestions = parsedData.questions
        .filter(
          (q): q is Question =>
            Boolean(q.id) &&
            typeof q.question === "string" &&
            Array.isArray(q.options) &&
            q.options.length === 5,
        )
        // Ensure each question has a unique ID
        .map((q, idx) => ({
          ...q,
          id: idx + 1, // Override with sequential IDs
        }));

      if (validQuestions.length < 5) {
        throw new Error("Not enough valid questions generated");
      }

      // Save to cache
      questionsCache.set(cacheKey, {
        questions: validQuestions,
        timestamp: Date.now()
      });

      // Cleanup old cache entries
      const now = Date.now();
      for (const [key, value] of questionsCache.entries()) {
        if (now - value.timestamp > 30 * 60 * 1000) {  // 30 minutes expiration
          questionsCache.delete(key);
        }
      }

      return NextResponse.json(
        { questions: validQuestions, source: "ai-generated" },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'max-age=300, s-maxage=300',
          }
        },
      );
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.log("Error generating questions:", error);
    
    // Return fallback questions
    const fallbackQuestions = [
      {
        id: 1,
        question: "How would you rate your overall mood over the past two weeks?",
        options: ["Very poor", "Poor", "Neutral", "Good", "Very good"],
      },
      {
        id: 2,
        question: "How often have you felt anxious or worried recently?",
        options: ["Almost constantly", "Frequently", "Sometimes", "Rarely", "Never"],
      },
      {
        id: 3,
        question: "How would you describe your sleep quality?",
        options: ["Very poor", "Poor", "Fair", "Good", "Very good"],
      },
      {
        id: 4,
        question: "How would you rate your energy levels?",
        options: ["Very low", "Low", "Moderate", "High", "Very high"],
      },
      {
        id: 5,
        question: "How connected do you feel to others in your life?",
        options: ["Not at all", "Slightly", "Moderately", "Considerably", "Very"],
      },
      {
        id: 6,
        question: "How often do you have difficulty concentrating?",
        options: ["Almost constantly", "Frequently", "Sometimes", "Rarely", "Never"],
      },
      {
        id: 7,
        question: "How would you rate your stress level?",
        options: ["Very high", "High", "Moderate", "Low", "Very low"],
      },
      {
        id: 8,
        question: "How satisfied are you with your daily activities?",
        options: ["Not at all", "Slightly", "Moderately", "Considerably", "Very"],
      }
    ];
    
    return NextResponse.json(
      { questions: fallbackQuestions, source: "fallback" },
      { status: 200 }
    );
  }
}
