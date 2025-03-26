import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from '@/lib/rate-limit';

// Initialize the Gemini API client
const genAI = process.env.GEMINI_API_KEY ? 
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string) : null;

// Fallback questions in case of API or parsing errors
const fallbackQuestions = {
  "questions": [
    {
      "id": 1,
      "question": "How would you rate your overall mood over the past two weeks?",
      "options": ["Very poor", "Poor", "Neutral", "Good", "Very good"]
    },
    {
      "id": 2,
      "question": "How often have you felt anxious or worried recently?",
      "options": ["Almost constantly", "Frequently", "Sometimes", "Rarely", "Never"]
    },
    {
      "id": 3,
      "question": "How would you describe your sleep quality?",
      "options": ["Very poor", "Poor", "Fair", "Good", "Very good"]
    },
    {
      "id": 4,
      "question": "How would you rate your energy levels?",
      "options": ["Very low", "Low", "Moderate", "High", "Very high"]
    },
    {
      "id": 5,
      "question": "How connected do you feel to others in your life?",
      "options": ["Not at all", "Slightly", "Moderately", "Considerably", "Very"]
    }
  ]
};

interface Question {
  id: number;
  question: string;
  options: string[];
}

export async function POST(request: NextRequest) {
  // Check API key is configured
  if (!genAI) {
    console.error("GEMINI_API_KEY not configured");
    return NextResponse.json(
      { questions: fallbackQuestions.questions, source: "fallback", error: "API key missing" },
      { status: 200 }
    );
  }

  try {
    // Apply rate limiting (5 requests per minute per IP)
    const limiter = rateLimit({
      interval: 60 * 1000, // 60 seconds
      uniqueTokenPerInterval: 500, // Max 500 users per interval
    });
    
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    try {
      await limiter.check(5, ip); // 5 requests per minute per IP
    } catch (error) {
      console.log("Rate limit exceeded for IP:", ip);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Initialize focus to a default value
    let focus = "general wellness";
    let complexity = "standard";
    
    // Try to get request body parameters if provided
    try {
      const body = await request.json();
      // Sanitize input
      focus = (body.focus && typeof body.focus === 'string') ? 
        body.focus.slice(0, 50).replace(/[^\w\s]/gi, '') : focus;
      complexity = (body.complexity && typeof body.complexity === 'string') ? 
        body.complexity.slice(0, 20).replace(/[^\w\s]/gi, '') : complexity;
    } catch (e) {
      // No parameters provided or invalid JSON, use defaults
      console.log("No parameters provided or invalid JSON, using defaults");
    }
    
    // Access the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a prompt to generate mental health assessment questions
    const prompt = `
      You are a mental health professional creating an assessment questionnaire.

      Please generate 8 professional mental health assessment questions focusing on "${focus}" with a "${complexity}" complexity level.
      
      Each question should:
      1. Be clear, compassionate, and non-stigmatizing
      2. Help identify potential areas of mental health concern
      3. Have exactly 5 multiple choice options that represent a range of responses
      4. Use accessible language appropriate for someone who may have mental health challenges
      
      Return ONLY a valid JSON object with this exact structure:
      {
        "questions": [
          {
            "id": 1,
            "question": "Your first question here?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
          },
          {
            "id": 2,
            "question": "Your second question here?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
          }
          // and so on for a total of 8 questions
        ]
      }

      Do not include any markdown formatting, explanations, or additional text outside the JSON structure.
    `;

    // Add timeout for model generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Model generation timeout')), 15000); // 15 seconds timeout
    });

    // Generate content using the prompt with timeout
    const contentPromise = model.generateContent(prompt);
    const result = await Promise.race([contentPromise, timeoutPromise]);
    
    // @ts-ignore - result is the content generation result if the race was won by contentPromise
    const response = await result.response;
    const text = response.text();

    // Find the JSON object in the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    let jsonText = jsonMatch ? jsonMatch[0] : text;

    // Try to parse the response as JSON
    try {
      const parsedData = JSON.parse(jsonText);
      
      // Validate that the parsed data has the expected structure
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        console.error("Invalid response format - questions array missing");
        return NextResponse.json(
          { questions: fallbackQuestions.questions, source: "fallback", error: "Invalid response format" },
          { status: 200 }
        );
      }
      
      // Validate each question has the required fields
      const validQuestions: Question[] = parsedData.questions.filter((q: Question) => 
        q.id && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 5
      );
      
      if (validQuestions.length < 5) {
        console.error("Not enough valid questions returned");
        return NextResponse.json(
          { questions: fallbackQuestions.questions, source: "fallback", error: "Not enough valid questions" },
          { status: 200 }
        );
      }
      
      // Ensure we have correct IDs (1-based sequential)
      const fixedQuestions: Question[] = validQuestions.map((q: Question, index: number) => ({
        ...q,
        id: index + 1,
        // Sanitize question and options for security
        question: q.question.replace(/<[^>]*>?/gm, ''),
        options: q.options.map(opt => typeof opt === 'string' ? opt.replace(/<[^>]*>?/gm, '') : String(opt))
      }));
      
      return NextResponse.json(
        { questions: fixedQuestions, source: "ai-generated" },
        { status: 200, headers: { 'Cache-Control': 'max-age=600, s-maxage=600' } }
      );
    } catch (error) {
      console.error("Error parsing generated questions:", error);
      return NextResponse.json(
        { questions: fallbackQuestions.questions, source: "fallback", error: "JSON parsing error" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { questions: fallbackQuestions.questions, source: "fallback", error: "Generation error" },
      { status: 200 }
    );
  }
}