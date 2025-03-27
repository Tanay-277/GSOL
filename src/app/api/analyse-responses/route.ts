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

        // Create a prompt for mental health analysis with clear boundaries and structured JSON output
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
            
            IMPORTANT: You must respond with a valid JSON object in exactly this format:
            
            {
                "overallAssessment": "A concise paragraph summarizing the person's mental wellbeing",
                "keyObservations": ["observation 1", "observation 2", "observation 3"],
                "selfCareSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"],
                "diagnosis": [
                    {
                        "id": "note-1",
                        "name": "Important Note",
                        "description": "This is not a clinical diagnosis"
                    },
                    {
                        "id": "note-2",
                        "name": "Recommendation",
                        "description": "Consider professional support if experiencing significant distress"
                    }
                ]
            }
            
            USER RESPONSES:
            ${formattedResponses}
            
            Remember: Return ONLY a valid JSON object with no additional text.
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
            const assessmentText = response.text();
            
            if (!assessmentText || assessmentText.trim().length < 50) {
                console.error("Empty or too short assessment returned");
                return NextResponse.json(
                    { error: "Failed to generate a valid assessment" },
                    { status: 500 },
                );
            }

            // Try to parse the response as JSON
            try {
                // Extract JSON from the response (in case there's surrounding text)
                const jsonMatch = assessmentText.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : assessmentText;
                const assessment = JSON.parse(jsonString);
                
                // Validate that the parsed JSON has all required fields
                if (!assessment.overallAssessment || 
                    !Array.isArray(assessment.keyObservations) || 
                    !Array.isArray(assessment.selfCareSuggestions) ||
                    !Array.isArray(assessment.diagnosis)) {
                    
                    // If missing fields, create a properly structured fallback response
                    const fallbackAssessment = {
                        overallAssessment: extractSection(assessmentText, "Overall Assessment") || 
                            "Based on your responses, we've identified some aspects of your mental wellbeing to consider.",
                        keyObservations: extractBulletPoints(extractSection(assessmentText, "Key Observations")) || 
                            ["Consider speaking with a mental health professional for a proper evaluation."],
                        selfCareSuggestions: extractBulletPoints(extractSection(assessmentText, "Self-Care Suggestions")) || 
                            ["Practice regular self-care activities", "Maintain connections with supportive people", "Get adequate sleep and exercise", "Consider mindfulness practices", "Seek professional support if needed"],
                        diagnosis: [
                            {
                                id: "disclaimer",
                                name: "Important Note",
                                description: "This is not a clinical diagnosis and should not replace professional mental health advice."
                            }
                        ]
                    };
                    
                    console.log("Successfully created fallback structured assessment");
                    return NextResponse.json(fallbackAssessment, {
                        status: 200,
                        headers: {
                            "Cache-Control": "private, no-cache, no-store, must-revalidate",
                        },
                    });
                }
                
                console.log("Successfully generated structured assessment");
                return NextResponse.json(assessment, {
                    status: 200,
                    headers: {
                        "Cache-Control": "private, no-cache, no-store, must-revalidate",
                    },
                });
                
            } catch (jsonError) {
                console.error("Error parsing JSON from model response:", jsonError);
                
                // Create a structured response from the text-based assessment
                const structuredAssessment = {
                    overallAssessment: extractSection(assessmentText, "Overall Assessment") || assessmentText.substring(0, 200),
                    keyObservations: extractBulletPoints(extractSection(assessmentText, "Key Observations")) || 
                        ["Based on your responses, we recommend speaking with a mental health professional for a proper evaluation."],
                    selfCareSuggestions: extractBulletPoints(extractSection(assessmentText, "Self-Care Suggestions")) || 
                        ["Practice regular self-care activities", "Maintain connections with supportive people", "Get adequate rest", "Consider mindfulness practices", "Seek professional support if needed"],
                    diagnosis: [
                        {
                            id: "disclaimer",
                            name: "Important Note",
                            description: "This is not a clinical diagnosis and should not replace professional mental health advice."
                        }
                    ]
                };
                
                console.log("Created structured assessment from text response");
                return NextResponse.json(structuredAssessment, {
                    status: 200,
                    headers: {
                        "Cache-Control": "private, no-cache, no-store, must-revalidate",
                    },
                });
            }
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

// Helper function to extract a section from the assessment text
function extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`(?:\\*\\*)?${sectionName}(?:\\*\\*)?[:\\s]+(.*?)(?=(?:\\*\\*\\w|$|\\n\\s*\\n|\\n\\s*\\*\\*))`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

// Helper function to extract bullet points from a section
function extractBulletPoints(text: string | null): string[] | null {
    if (!text) return null;
    
    // Try to find bullet points (marked by -, *, •, or numbers)
    const bulletPointRegex = /(?:^|\n)\s*(?:[-•*]|\d+\.)\s*(.*?)(?=(?:\n\s*(?:[-•*]|\d+\.)|$))/g;
    const matches = [...text.matchAll(bulletPointRegex)];
    
    if (matches.length > 0) {
        return matches.map(match => match[1].trim());
    }
    
    // If no bullet points found, split by newlines
    const lines = text.split(/\n/).map(line => line.trim()).filter(line => line);
    if (lines.length > 0) {
        return lines;
    }
    
    // If no clear structure, return the text as a single point
    return [text.trim()];
}
