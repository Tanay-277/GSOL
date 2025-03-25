import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: "userInput is required and must be a string" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = userInput;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText =
      (await response.text()) || "Sorry, I couldn't generate content.";

    return NextResponse.json({ generatedText });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Error generating content" },
      { status: 500 },
    );
  }
}
