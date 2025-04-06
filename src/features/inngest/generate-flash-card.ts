import { GenerationConfig, GoogleGenerativeAI } from "@google/generative-ai";
import { Course } from "@prisma/client";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

function cleanJsonResponse(text: string): string {
  text = text.trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  text = text.replace(/\/\/.+$/gm, "");
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return text;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const generationConfig: GenerationConfig = {
  temperature: 0.8,
  topP: 0.9,
  topK: 50,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function generateContent(input: string) {
  try {
    const chatSession = await model.startChat({
      generationConfig,
      history: [],
    });

    const response = await chatSession.sendMessage(input);
    if (!response) {
      throw new Error("Failed to generate content using Gemini API");
    }
    const cleanedResponse = cleanJsonResponse(response.response.text());

    const parsedData = JSON.parse(cleanedResponse);

    return parsedData;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

export async function generateFlashcards(course: Course) {
  const input = `Generate a detailed course tutorial in valid JSON format with the following details: 
      Topic: ${course.topic}
      Level: ${course.level}
      Type: ${course.type}

      Return 5 flashcards related to the course. Each flashcard should have:
      - "title": A short title of the flashcard topic
      - "content": A detailed explanation of the flashcard topic

      The JSON structure should be only the flashcards array:
    
         
          {
            "title": "string",
            "content": "string"
          }[]
         
         
       

      Ensure all JSON properties are properly quoted and formatted. No markdown formatting or comments.

      Please generate a set of flashcards for this course.
      `;

  const flashcards = await generateContent(input);

  const flashcardsData = flashcards.map((flashcard: { title: string; content: string }) => ({
    title: flashcard.title,
    content: flashcard.content,
  }));

  return flashcardsData;
}

export async function generateQuiz(course: Course) {
  const input = `Generate a detailed course tutorial in valid JSON format with the following details: 
      Topic: ${course.topic}
      Level: ${course.level}
      Type: ${course.type}

      Return 3 questions related to the course. Each question should have:
      - "question": A question related to the course
      - "answer": The correct answer to the question

      The JSON structure should be only the questions array:    
         
          {
            "question": "string",
            "answer": "string",
            "options": ["string", "string", "string", "string"]
          }[]
      }

      Ensure all JSON properties are properly quoted and formatted. No markdown formatting or comments.

      Please generate a set of questions for this course.
      `;

  const questions = await generateContent(input);

  const questionsData = questions.map(
    (question: { question: string; answer: string; options: string[] }) => ({
      question: question.question,
      answer: question.answer,
      options: question.options,
    }),
  );

  return questionsData;
}
