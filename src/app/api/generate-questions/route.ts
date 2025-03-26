import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  if (!genAI) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    // Rate limiting
    const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    try {
      await limiter.check(5, ip);
    } catch {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Extract focus & complexity
    let focus = "general wellness", complexity = "standard";
    try {
      const body = await request.json();
      focus = (body.focus && typeof body.focus === 'string') ? body.focus.slice(0, 50).replace(/[^\w\s]/gi, '') : focus;
      complexity = (body.complexity && typeof body.complexity === 'string') ? body.complexity.slice(0, 20).replace(/[^\w\s]/gi, '') : complexity;
    } catch {}

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
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000));
    const contentPromise = chatSession.sendMessage(prompt);
    const result = await Promise.race([contentPromise, timeoutPromise]) as Awaited<typeof contentPromise>;

    // Extract response text
    const candidates = result.response?.candidates;
    const text = candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : "";
    const initialParsedData = JSON.parse(jsonText);

    if (!initialParsedData.questions || !Array.isArray(initialParsedData.questions)) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    // Validate and sanitize questions
    // Define interfaces
    interface Question {
      id: number;
      question: string;
      options: string[];
    }
    
    interface ParsedData {
      questions: Partial<Question>[];
    }
    
    const parsedData = JSON.parse(jsonText) as ParsedData;
    
    const validQuestions = parsedData.questions.filter((q): q is Question =>
      Boolean(q.id) && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 5
    );

    if (validQuestions.length < 5) {
      return NextResponse.json({ error: "Not enough valid questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: validQuestions, source: "ai-generated" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Generation error" }, { status: 500 });
  }
}
