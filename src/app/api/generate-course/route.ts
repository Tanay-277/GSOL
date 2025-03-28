import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { rateLimit } from "@/lib/rate-limit";

// Initialize the Gemini API client with safety checks
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  : null;

interface UserResponse {
  question: string;
  answer: string;
}

export async function POST(request: NextRequest) {
    try {
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
          { status: 429 }
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
  
      const { responses } = body;
  
      if (!Array.isArray(responses) || responses.length === 0) {
        return NextResponse.json(
          { error: "Valid responses array is required" },
          { status: 400 }
        );
      }
  
      const sanitizedResponses = responses.map((r: UserResponse) => ({
        question: r.question.slice(0, 500).replace(/<[^>]*>?/gm, ""),
        answer: r.answer.slice(0, 500).replace(/<[^>]*>?/gm, ""),
      }));
  
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      });
  
      const prompt = `
        You are a professional mental health expert providing a supportive assessment.
        Analyze the following responses:
        
        ${JSON.stringify(sanitizedResponses)}
  
        Provide structured mental health recommendations in JSON format:
  
        {
          "course-1": {
            "course-name": "Autism: Improving Lifestyle and Understanding",
            "course-description": "This course will provide an overview of autism, its effects on individuals and families, and practical strategies for improving communication, social skills, and daily living."
          },
          "course-2": { "course-name": "Mental Health and Wellbeing", "course-description": "..." }
        }
      `;
  
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Model generation timeout")), 15000)
      );
  
      try {
        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]) as { response?: { text: () => Promise<string> } };
  
        if (!result?.response) {
          throw new Error("Invalid response from model");
        }
  
        const assessmentText = await result.response.text();
        const jsonMatch = assessmentText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : assessmentText;
  
        try {
          const assessment = JSON.parse(jsonString);
  
          if (!assessment || typeof assessment !== "object") {
            throw new Error("Invalid JSON structure");
          }
  
          return NextResponse.json(assessment, {
            status: 200,
            headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
          });
        } catch (jsonError) {
          return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 }
          );
        }
      } catch (generationError) {
        return NextResponse.json(
          { error: "Failed to generate assessment" },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }
  

// Helper function to extract a section from the assessment text
function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(
    `(?:\\*\\*)?${sectionName}(?:\\*\\*)?[:\\s]+(.*?)(?=(?:\\*\\*\\w|$|\\n\\s*\\n|\\n\\s*\\*\\*))`,
    "is",
  );
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// Helper function to extract bullet points from a section
function extractBulletPoints(text: string | null): string[] | null {
  if (!text) return null;

  // Try to find bullet points (marked by -, *, •, or numbers)
  const bulletPointRegex =
    /(?:^|\n)\s*(?:[-•*]|\d+\.)\s*(.*?)(?=(?:\n\s*(?:[-•*]|\d+\.)|$))/g;
  const matches = [...text.matchAll(bulletPointRegex)];

  if (matches.length > 0) {
    return matches.map((match) => match[1].trim());
  }

  // If no bullet points found, split by newlines
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line);
  if (lines.length > 0) {
    return lines;
  }

  // If no clear structure, return the text as a single point
  return [text.trim()];
}
