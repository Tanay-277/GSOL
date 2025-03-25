"use server";

import { TFormValues } from "@/app/(main)/create/page";
import { db } from "@/db";
import { ChatMessage, CourseResponse, GenerationConfig } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const initialHistory: ChatMessage[] = [
  {
    role: "user",
    parts: [
      {
        text: "Generate A Course Tutorial on Following\nDetail With field as Course Name,\nDescription, Along with Chapter Name,\nabout, Duration: Category: Programming',\nTopic: Python, Level:Basic, Duration: 1 hours,  , in JSON format",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: `{
  "name": "Python for Absolute Beginners",
  "description": "This course is designed for individuals with no prior programming experience...",
  "chapters": [
    {
      "name": "Introduction to Python",
      "description": "This chapter covers the basics...",
      "duration": "1 hours",
      "category": "Programming",
      "topic": "Python",
      "level": "Basic"
    }
  ]
}`,
      },
    ],
  },
];

function cleanJsonResponse(text: string): string {
  text = text.trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  text = text.replace(/\/\/.+$/gm, "");
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return text;
}

export type CourseGenerationResponse = {
  success: boolean;
  data: {
    id: string;
  };
};

export async function generateCourseContent({
  data,
  email,
}: {
  data: TFormValues;
  email: string;
}): Promise<CourseGenerationResponse> {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: initialHistory,
    });

    const prompt = `
      Generate a detailed course tutorial in valid JSON format with the following details:
      Topic: ${data.topic}
      Level: ${data.level}
      Type: ${data.type}

      The response should be a valid JSON object with these types:
      {
        "name": string,
        "description": string,
        "chapters": [{
          "name": string,
          "description": string,
          "duration": string,
          "category": string,
          "topic": string,
          "level": string
        }]
      }

      Each chapter should include Chapter Name, About, Duration, Category, Topic, and Level.
      Ensure all JSON properties are properly quoted.
    `;

    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    const cleanedJson = cleanJsonResponse(responseText);
    let courseResponse: CourseResponse;

    try {
      courseResponse = JSON.parse(cleanedJson);

      if (!courseResponse?.name || !Array.isArray(courseResponse?.chapters)) {
        throw new Error("Invalid course structure");
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
      throw new Error("Failed to parse course content");
    }

    try {
      const user = await db.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new Error("User not found");
      }

      const course = await db.$transaction(async (tx) => {
        return await tx.course.create({
          data: {
            name: courseResponse.name,
            description: courseResponse.description,
            type: data.type,
            topic: data.topic,
            level: data.level,
            category: "Programming",
            user: {
              connect: {
                id: user.id,
                email: user.email,
              },
            },
            chapters: {
              createMany: {
                data: courseResponse.chapters.map((chapter, index) => ({
                  name: chapter.name,
                  description: chapter.description,
                  duration: chapter.duration,
                  category: chapter.category,
                  topic: chapter.topic,
                  level: chapter.level,
                  orderIndex: index,
                  completed: false,
                })),
              },
            },
          },
        });
      });

      return {
        success: true,
        data: {
          id: course.id,
        },
      };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to save course to database");
    }
  } catch (error) {
    console.error("Course generation error:", error);
    throw error;
  }
}
