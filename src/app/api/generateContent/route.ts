import { rateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini API client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  : null;

// Define safety settings for mental health content
const MENTAL_HEALTH_SAFETY_PREFIX = `
You are providing information about mental health topics. Please ensure your response:
1. Is supportive and non-judgmental
2. Avoids making clinical diagnoses
3. Emphasizes the importance of professional help when appropriate
4. Uses evidence-based information
5. Is sensitive to the seriousness of mental health conditions
6. Includes relevant disclaimers
7. Never provides advice that could be harmful or dangerous
8. Acknowledges the limitations of AI-generated information

Now, respond to this mental health related question:
`;

// List of terms that should trigger mental health safety features
const MENTAL_HEALTH_KEYWORDS = [
  "depression",
  "anxiety",
  "suicide",
  "suicidal",
  "self-harm",
  "cutting",
  "hurt myself",
  "mental health",
  "mental illness",
  "therapy",
  "therapist",
  "counseling",
  "counselor",
  "psychiatric",
  "psychiatrist",
  "psychologist",
  "disorder",
  "diagnosis",
  "medication",
  "bipolar",
  "schizophrenia",
  "trauma",
  "ptsd",
  "ocd",
  "eating disorder",
  "anorexia",
  "bulimia",
  "addiction",
  "substance abuse",
  "crisis",
  "panic",
  "mood",
  "adhd",
  "burnout",
  "grief",
  "stress",
  "insomnia",
];

// Crisis disclaimer to include in responses about serious mental health issues
const CRISIS_DISCLAIMER = `

IMPORTANT: If you're experiencing a mental health crisis, thoughts of harming yourself, 
or need immediate support, please contact a crisis resource:

- National Suicide Prevention Lifeline: 988 or 1-800-273-8255
- Crisis Text Line: Text HOME to 741741
- Or call emergency services (911 in the US)

This information is not a substitute for professional mental health advice, diagnosis, or treatment.
`;

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute per IP)
    const limiter = rateLimit({
      interval: 60 * 1000, // 60 seconds
      uniqueTokenPerInterval: 500, // Max 500 users per interval
    });

    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "anonymous";

    try {
      await limiter.check(10, ip); // 10 requests per minute per IP
    } catch (error) {
      console.log("Rate limit exceeded for IP:", ip);
      console.log(error);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Check API key is configured
    if (!genAI) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json({ error: "Service configuration error" }, { status: 500 });
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userInput, context } = body;

    if (!userInput || typeof userInput !== "string" || userInput.trim() === "") {
      return NextResponse.json(
        { error: "userInput is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // Input validation and sanitization
    const sanitizedInput = userInput
      .trim()
      .slice(0, 1000) // Limit input length
      .replace(/<[^>]*>?/gm, ""); // Remove HTML tags

    // Check if input contains harmful content
    const harmfulContentPatterns = [
      /how\s+to\s+(harm|hurt|injure|kill)/i,
      /(suicide|suicidal)\s+(methods|ways|how\s+to)/i,
      /how\s+to\s+(make|create|build)\s+(bombs|explosives|weapons)/i,
      /how\s+to\s+hack/i,
    ];

    const containsHarmfulContent = harmfulContentPatterns.some((pattern) =>
      pattern.test(sanitizedInput),
    );

    if (containsHarmfulContent) {
      return NextResponse.json(
        {
          generatedText:
            "I cannot provide information on harmful or dangerous topics. " +
            "If you're experiencing a crisis or need support, please contact a mental health " +
            "professional or crisis support service like the National Suicide Prevention Lifeline at 988.",
        },
        { status: 200 },
      );
    }

    // Detect if this is a mental health related query
    const containsMentalHealthTerms = MENTAL_HEALTH_KEYWORDS.some((keyword) =>
      sanitizedInput.toLowerCase().includes(keyword.toLowerCase()),
    );

    // Determine if this might be a crisis query
    const crisisTerms = [
      "suicide",
      "kill myself",
      "want to die",
      "end my life",
      "harm myself",
      "hurt myself",
    ];
    const containsCrisisTerms = crisisTerms.some((term) =>
      sanitizedInput.toLowerCase().includes(term.toLowerCase()),
    );

    // Access the generative model with appropriate safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
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
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Add safety prefix for mental health related requests
    let safetyPrefix = "";
    if (containsMentalHealthTerms) {
      safetyPrefix = MENTAL_HEALTH_SAFETY_PREFIX;
    }

    // Configure generation parameters based on context
    const generationConfig = {
      temperature: context?.creative ? 0.8 : 0.2,
      topK: 40,
      topP: context?.creative ? 0.95 : 0.85,
      maxOutputTokens: 2048,
    };

    // Add timeout for model generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Model generation timeout")), 15000); // 15 seconds timeout
    });

    // Generate content using the prompt with timeout
    try {
      // Combine the safety prefix with the user input
      const prompt = safetyPrefix + sanitizedInput;

      // Generate content
      const contentPromise = model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const result = await Promise.race([contentPromise, timeoutPromise]);

      // @ts-expect-error - result is the content generation result if the race was won by contentPromise
      const response = await result.response;
      let generatedText = await response.text();

      // Ensure response is not empty
      if (!generatedText || generatedText.trim() === "") {
        throw new Error("Empty response generated");
      }

      // Add crisis disclaimer for mental health crisis queries
      if (containsCrisisTerms) {
        generatedText = generatedText + CRISIS_DISCLAIMER;
      }

      // Add a general disclaimer for all mental health content
      if (
        containsMentalHealthTerms &&
        !generatedText.includes("not a substitute for professional")
      ) {
        generatedText =
          generatedText +
          "\n\nThis information is not a substitute for professional mental health advice, diagnosis, or treatment.";
      }

      return NextResponse.json({
        generatedText,
        metadata: {
          isMentalHealth: containsMentalHealthTerms,
          containsCrisisTerms,
        },
      });
    } catch (error) {
      console.error("Error generating content:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Return a graceful error message to the client
      return NextResponse.json(
        {
          generatedText:
            "I'm sorry, I couldn't generate a response at this time. Please try again later.",
          error: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in content generation route:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Error generating content: " + errorMessage },
      { status: 500 },
    );
  }
}
