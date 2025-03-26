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
        // Apply rate limiting (3 requests per minute per IP)
        const limiter = rateLimit({
            interval: 60 * 1000, // 60 seconds
            uniqueTokenPerInterval: 500, // Max 500 users per interval
        });

        // Get client IP for rate limiting
        const ip = request.headers.get("x-forwarded-for") || "anonymous";

        try {
            await limiter.check(3, ip); // 3 requests per minute per IP for analysis
        } catch (error) {
            console.log("Rate limit exceeded for IP:", ip);
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 },
            );
        }

        // Check if API key is configured
        if (!genAI) {
            console.error("GEMINI_API_KEY not configured");
            return NextResponse.json(
                { error: "API key missing" },
                { status: 500 },
            );
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 },
            );
        }

        const { responses } = body;

        // Validate responses structure
        if (!responses || !Array.isArray(responses) || responses.length === 0) {
            console.error("Invalid or empty responses:", responses);
            return NextResponse.json(
                { error: "Valid responses array is required" },
                { status: 400 },
            );
        }

        // Ensure responses have the required structure
        const isValidResponses = responses.every(
            (r: UserResponse) =>
                r &&
                typeof r.question === "string" &&
                typeof r.answer === "string" &&
                r.question.trim() !== "" &&
                r.answer.trim() !== "",
        );

        if (!isValidResponses) {
            console.error("Responses do not have the required structure:", responses);
            return NextResponse.json(
                { error: "Each response must contain question and answer as non-empty strings" },
                { status: 400 },
            );
        }

        // Sanitize inputs to prevent prompt injection
        const sanitizedResponses = responses.map((r: UserResponse) => ({
            question: r.question.slice(0, 500).replace(/<[^>]*>?/gm, ""),
            answer: r.answer.slice(0, 500).replace(/<[^>]*>?/gm, ""),
        }));

        // Access the generative model with safety settings
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

        // Format the responses for the prompt
        const formattedResponses = sanitizedResponses
            .map((r: UserResponse) => `Question: ${r.question}\nAnswer: ${r.answer}`)
            .join("\n\n");

        // Create a prompt for mental health analysis with clear boundaries
        const prompt = `
                        You are a professional mental health expert providing a supportive assessment. 
                        Analyze the following responses to a mental health questionnaire.
                        
                        Based on these responses, provide a comprehensive but concise professional assessment of the individual's 
                        current mental state, potential concerns, and personalized recommendations for improving mental wellbeing.
                        
                        Important guidelines:
                        1. DO NOT provide a clinical diagnosis or suggest specific psychiatric conditions
                        2. Maintain a compassionate, non-judgmental tone
                        3. Do not suggest medication or specific treatment plans
                        4. Focus on general wellbeing and self-care strategies
                        5. Always emphasize the importance of professional help when appropriate
                        6. Use evidence-based approaches when making suggestions
                        7. Include a clear disclaimer about the limitations of an automated assessment
                        
                        FORMAT: Provide your response in clear paragraphs with the following sections:
                        1. Overall Assessment
                        2. Key Observations
                        3. Self-Care Suggestions

                        The response should be maximum of 100 characters.

                        {
                             "overallAssessment": "The user appears to be struggling with feelings of sadness and hopelessness, but is motivated to seek help and improve their mental wellbeing.",
                            "keyObservations": [
                                "The user has expressed feelings of sadness and hopelessness.",
                                "The user is motivated to seek help and improve their mental wellbeing."
                            ],
                            "selfCareSuggestions": [
                                "Practice self-compassion and acknowledge that it is okay to feel sad or overwhelmed.",
                                "Reach out to a trusted friend or family member for emotional support.",
                                "Engage in activities that bring joy and relaxation, such as exercise, hobbies, or spending time in nature."
                            ],
                            "diagnosis": [
                                {
                                    "id": "string",
                                    "name": "string",
                                    "description": "string"
                                },
                                {
                                    "id": "...",
                                    "name": "...",
                                    "description": "..."
                                },...
                            ]
                        }
                            you should follow the above format.
                        
                        USER RESPONSES:
                        ${formattedResponses}
                        
                        Important: End with a clear disclaimer that this is not a clinical diagnosis and encourage seeking professional help if experiencing significant distress.
                `;

        // Add timeout for model generation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Model generation timeout")), 15000); // 15 seconds timeout
        });

        // Generate content using the prompt with timeout
        try {
            const contentPromise = model.generateContent(prompt);
            const result = await Promise.race([contentPromise, timeoutPromise]);

            // @ts-ignore - result is the content generation result if the race was won by contentPromise
            const response = await result.response;
            const assessment = response.text();

            if (!assessment || assessment.trim().length < 100) {
                console.error("Empty or too short assessment returned");
                return NextResponse.json(
                    { error: "Failed to generate a valid assessment" },
                    { status: 500 },
                );
            }

            // Final safety check - ensure assessment contains appropriate disclaimer
            const finalAssessment = assessment.includes("not a clinical diagnosis")
                ? assessment
                : `${assessment}\n\nNOTE: This assessment is not a clinical diagnosis and should not replace professional mental health advice. If you're experiencing significant distress, please consult with a qualified mental health professional.`;

            console.log("Successfully generated assessment");

            // Return the generated assessment with cache control headers
            return NextResponse.json(
                { assessment: finalAssessment, source: "ai-generated" },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "private, no-cache, no-store, must-revalidate",
                    },
                },
            );
        } catch (generationError) {
            console.error("Error during content generation:", generationError);
            return NextResponse.json(
                { error: "Failed to generate assessment" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error analyzing responses:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 },
        );
    }
}
