"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AlertCircle, HelpCircle, Info, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Question = {
    id: number;
    question: string;
    options: string[];
};

type UserResponse = {
    question: string;
    answer: string;
};

type AssessmentResult = {
    date: string;
    responses: UserResponse[];
    assessment: string;
};

// Mental health crisis resources
const CRISIS_RESOURCES = [
    { name: "National Suicide Prevention Lifeline", contact: "988 or 1-800-273-8255", url: "https://988lifeline.org/" },
    { name: "Crisis Text Line", contact: "Text HOME to 741741", url: "https://www.crisistextline.org/" },
    { name: "SAMHSA's National Helpline", contact: "1-800-662-4357", url: "https://www.samhsa.gov/find-help/national-helpline" },
];

export default function OnBoarding() {
    const router = useRouter();
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [assessment, setAssessment] = useState("");
    const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
    const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
    const [error, setError] = useState("");
    const [focus, setFocus] = useState("general wellness");
    const [showCrisisResources, setShowCrisisResources] = useState(false);
    const [dataPrivacyAcknowledged, setDataPrivacyAcknowledged] = useState(false);
    const [apiErrors, setApiErrors] = useState(0);
    const [retryingQuestion, setRetryingQuestion] = useState(false);

    // Load assessment history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('mentalHealthAssessments');
        if (savedHistory) {
            try {
                setAssessmentHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Error parsing saved assessments:", e);
                // Clear corrupted data
                localStorage.removeItem('mentalHealthAssessments');
            }
        }

        // Check if there's a previous unfinished assessment
        const unfinishedAssessment = localStorage.getItem('unfinishedAssessment');
        if (unfinishedAssessment) {
            try {
                const { responses, currentQuestionIndex } = JSON.parse(unfinishedAssessment);
                if (responses && responses.length > 0) {
                    setUserResponses(responses);
                    if (currentQuestionIndex) {
                        setCurrentQuestion(currentQuestionIndex);
                    }
                }
            } catch (e) {
                console.error("Error parsing unfinished assessment:", e);
                // Clear corrupted data
                localStorage.removeItem('unfinishedAssessment');
            }
        }
        
        // We'll fetch questions only when the assessment actually starts
    }, []);

    // Save unfinished assessment when user responds
    useEffect(() => {
        if (started && userResponses.length > 0 && !showResults) {
            try {
                localStorage.setItem('unfinishedAssessment', JSON.stringify({
                    responses: userResponses,
                    currentQuestionIndex: currentQuestion
                }));
            } catch (e) {
                console.error("Error saving unfinished assessment:", e);
                // Just log the error, don't disrupt user experience
            }
        }
    }, [userResponses, currentQuestion, started, showResults]);

    const fetchQuestions = async () => {
        setLoadingQuestions(true);
        setError("");
        setRetryingQuestion(false);
        setApiErrors(0);
        
        // Add retry logic for more resilience
        let retries = 2;
        let success = false;
        
        while (retries >= 0 && !success) {
            try {
                const response = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ focus }),
                    // Add timeout to prevent hanging requests
                    signal: AbortSignal.timeout(15000)
                });
                
                if (response.status === 429) {
                    setError("You've made too many requests. Please wait a moment and try again.");
                    throw new Error('Rate limit exceeded');
                }
                
                if (!response.ok) {
                    throw new Error(`Failed to generate questions: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.questions || data.questions.length < 5) {
                    throw new Error('Invalid question format received');
                }
                
                setQuestions(data.questions);
                success = true;
                
                // If we're using fallback questions (indicated by source)
                if (data.source === "fallback") {
                    console.log("Using fallback questions");
                    setApiErrors(prev => prev + 1);
                }
                
            } catch (error) {
                console.error('Error generating questions:', error);
                retries--;
                setApiErrors(prev => prev + 1);
                
                if (retries < 0) {
                    setError("We encountered an issue creating your assessment. Please try again later.");
                    // Use fallback questions
                    setQuestions([
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
                    ]);
                } else {
                    // If we still have retries left, let the user know we're trying again
                    setRetryingQuestion(true);
                    // Wait a second before retrying to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } finally {
                if (retries < 0 || success) {
                    setLoadingQuestions(false);
                    setRetryingQuestion(false);
                }
            }
        }
    };

    const handleAnswer = async (selectedOption: string) => {
        try {
            // Save the user's response
            const updatedResponses = [
                ...userResponses, 
                { 
                    question: questions[currentQuestion].question, 
                    answer: selectedOption 
                }
            ];
            
            setUserResponses(updatedResponses);

            const nextQuestion = currentQuestion + 1;
            if (nextQuestion < questions.length) {
                setCurrentQuestion(nextQuestion);
            } else {
                setLoading(true);
                
                // Crisis word detection - check for concerning responses that might indicate immediate risk
                const crisisKeywords = ['suicide', 'kill myself', 'want to die', 'end my life', 'harming myself'];
                const containsCrisisWord = updatedResponses.some(r => 
                    crisisKeywords.some(word => 
                        r.answer.toLowerCase().includes(word) || r.question.toLowerCase().includes(word)
                    )
                );
                
                if (containsCrisisWord) {
                    setShowCrisisResources(true);
                }
                
                try {
                    // Clear the unfinished assessment since we're completing it
                    localStorage.removeItem('unfinishedAssessment');
                    
                    // Add retry logic for more resilience
                    let retries = 2;
                    let success = false;
                    
                    while (retries >= 0 && !success) {
                        try {
                            // Send all responses for analysis
                            console.log("Sending responses for analysis");
                            const response = await fetch('/api/analyse-responses', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ responses: updatedResponses }),
                                // Add timeout to prevent hanging requests
                                signal: AbortSignal.timeout(25000)
                            });
                            
                            if (response.status === 429) {
                                setError("You've made too many requests. Please wait a moment and try again.");
                                throw new Error('Rate limit exceeded');
                            }
                            
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                console.error('Error response:', response.status, errorData);
                                throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
                            }
                            
                            const data = await response.json();
                            
                            if (!data.assessment) {
                                console.error('Missing assessment in response:', data);
                                throw new Error("Response did not contain assessment data");
                            }
                            
                            setAssessment(data.assessment);
                            success = true;
                            
                            // If we're using fallback assessment (indicated by source)
                            if (data.source === "fallback") {
                                console.log("Using fallback assessment");
                                setApiErrors(prev => prev + 1);
                            }
                            
                            // Save the completed assessment to history in localStorage
                            const newAssessment: AssessmentResult = {
                                date: new Date().toISOString(),
                                responses: updatedResponses,
                                assessment: data.assessment
                            };
                            
                            try {
                                const updatedHistory = [...assessmentHistory, newAssessment];
                                setAssessmentHistory(updatedHistory);
                                localStorage.setItem('mentalHealthAssessments', JSON.stringify(updatedHistory));
                            } catch (storageError) {
                                console.error('Error saving assessment history:', storageError);
                                // If localStorage fails, we still have the assessment in memory to display
                            }
                            
                            break;
                            
                        } catch (error) {
                            console.error('Error analyzing responses:', error);
                            retries--;
                            setApiErrors(prev => prev + 1);
                            
                            if (retries < 0) {
                                setError(error instanceof Error ? error.message : "We couldn't generate your assessment. Please try again later.");
                                setAssessment("We couldn't generate a personalized assessment at this time. Please try again later or consult with a mental health professional for an accurate evaluation.");
                            } else {
                                // Wait a second before retrying
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                    }
                    
                } catch (error: any) {
                    console.error('Error analyzing responses:', error);
                    setError(error?.message || "We couldn't generate your assessment. Please try again later.");
                    setAssessment("We couldn't generate a personalized assessment at this time. Please try again later or consult with a mental health professional for an accurate evaluation.");
                } finally {
                    setLoading(false);
                    setShowResults(true);
                }
            }
        } catch (e) {
            console.error("Error in handleAnswer:", e);
            setError("An unexpected error occurred. Please try again.");
        }
    };

    const restartAssessment = () => {
        setStarted(true);
        setCurrentQuestion(0);
        setUserResponses([]);
        setShowResults(false);
        setAssessment("");
        setError("");
        setShowCrisisResources(false);
        // Re-fetch questions for a new assessment
        fetchQuestions();
    };

    const viewHistory = () => {
        router.push('/history');
    };
    
    const startAssessment = () => {
        if (!dataPrivacyAcknowledged) {
            return;
        }
        
        setStarted(true);
        fetchQuestions();
    };

    if (loadingQuestions && !questions.length) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background">
                <div className="mx-4 max-w-2xl rounded-lg bg-card p-10 text-center shadow-md">
                    <h2 className="mb-6 text-2xl font-bold text-foreground">
                        {retryingQuestion ? "Retrying... Please wait" : "Preparing your mental health assessment..."}
                    </h2>
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    {apiErrors > 0 && (
                        <p className="mt-4 text-amber-600 dark:text-amber-400">
                            We're experiencing some delays. Please be patient.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (error && !questions.length) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background">
                <div className="mx-4 max-w-2xl rounded-lg bg-card p-10 text-center shadow-md">
                    <h2 className="mb-6 text-2xl font-bold text-foreground text-red-600">Error</h2>
                    <p className="mb-6 text-lg text-muted-foreground">{error}</p>
                    <button 
                        className="rounded-md bg-primary px-6 py-3 text-lg text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        onClick={fetchQuestions}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center bg-background">
            {!started ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mx-4 max-w-2xl rounded-lg bg-card p-10 text-center shadow-md"
                >
                    <h1 className="mb-6 text-4xl font-bold text-foreground">
                        Mental Health Check-In
                    </h1>
                    <p className="mb-6 text-xl text-muted-foreground">
                        This brief assessment will help you understand your current mental state. 
                        Your responses are private and will be used to provide personalized feedback.
                    </p>
                    
                    <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important Information</AlertTitle>
                        <AlertDescription className="text-left">
                            This is not a diagnostic tool. The assessment provides general feedback 
                            based on your responses. If you're experiencing significant distress, 
                            please consult with a mental health professional.
                        </AlertDescription>
                    </Alert>

                    {assessmentHistory.length > 0 && (
                        <div className="mb-6">
                            <p className="mb-2 text-lg text-muted-foreground">
                                You have {assessmentHistory.length} previous assessment{assessmentHistory.length > 1 ? 's' : ''}
                            </p>
                            <button 
                                className="rounded-md bg-secondary px-4 py-2 mb-6 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90"
                                onClick={viewHistory}
                            >
                                View Assessment History
                            </button>
                        </div>
                    )}

                    <div className="mb-8">
                        <label className="block text-left mb-2 text-lg font-medium">What would you like to focus on?</label>
                        <select 
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            className="w-full p-3 rounded-md border border-input bg-background text-foreground"
                        >
                            <option value="general wellness">General Mental Wellbeing</option>
                            <option value="anxiety">Anxiety</option>
                            <option value="depression">Depression</option>
                            <option value="stress">Stress Management</option>
                            <option value="sleep">Sleep Issues</option>
                        </select>
                    </div>
                    
                    <div className="mb-6 flex items-start">
                        <input
                            type="checkbox"
                            id="privacy-consent"
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                            checked={dataPrivacyAcknowledged}
                            onChange={(e) => setDataPrivacyAcknowledged(e.target.checked)}
                        />
                        <label htmlFor="privacy-consent" className="ml-2 block text-sm text-left">
                            <span className="font-medium">Privacy & Data Usage: </span>
                            I understand that my responses will be stored locally on my device and used to generate 
                            personalized feedback. This data is not shared with third parties or used for any 
                            purpose beyond providing me with this assessment.
                        </label>
                    </div>

                    <motion.button
                        whileHover={{ scale: dataPrivacyAcknowledged ? 1.02 : 1 }}
                        whileTap={{ scale: dataPrivacyAcknowledged ? 0.98 : 1 }}
                        className={cn(
                            "rounded-md px-8 py-3 text-xl shadow-sm transition-colors",
                            dataPrivacyAcknowledged 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                        onClick={startAssessment}
                        disabled={!dataPrivacyAcknowledged}
                    >
                        Begin Assessment
                    </motion.button>
                    
                    {!dataPrivacyAcknowledged && (
                        <p className="mt-2 text-sm text-amber-600">
                            Please acknowledge the privacy notice to continue
                        </p>
                    )}
                    
                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={() => setShowCrisisResources(!showCrisisResources)}
                            className="flex items-center gap-1 mx-auto text-primary hover:underline"
                        >
                            <ShieldAlert className="h-4 w-4" />
                            <span>Crisis Resources</span>
                        </button>
                        
                        {showCrisisResources && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md"
                            >
                                <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">
                                    If you need immediate support:
                                </h3>
                                <ul className="text-left space-y-2">
                                    {CRISIS_RESOURCES.map((resource, idx) => (
                                        <li key={idx}>
                                            <strong>{resource.name}:</strong> {resource.contact}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2 text-sm">
                                    If you're in immediate danger, please call emergency services (911 in the US).
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            ) : showResults ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-4 max-w-2xl rounded-lg bg-card p-10 text-center shadow-md"
                >
                    {loading ? (
                        <>
                            <h2 className="mb-6 text-3xl font-bold text-foreground">
                                Analyzing your responses...
                            </h2>
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            {apiErrors > 1 && (
                                <p className="mt-4 text-amber-600 dark:text-amber-400">
                                    We're experiencing some delays. Please be patient.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <h2 className="mb-6 text-3xl font-bold text-foreground">
                                Your Mental Health Assessment
                            </h2>
                            
                            {error && (
                                <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="mb-10 text-left">
                                <p className="whitespace-pre-line text-lg text-muted-foreground">{assessment}</p>
                            </div>
                            
                            {showCrisisResources && (
                                <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <AlertTitle className="text-red-700 dark:text-red-300">
                                        Important: Support Resources
                                    </AlertTitle>
                                    <AlertDescription className="text-left">
                                        <p className="mb-2">
                                            Based on your responses, we want to ensure you have access to immediate support:
                                        </p>
                                        <ul className="space-y-1 list-disc pl-5">
                                            {CRISIS_RESOURCES.map((resource, idx) => (
                                                <li key={idx}>
                                                    <strong>{resource.name}:</strong> {resource.contact}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-2 font-semibold">
                                            If you're in immediate danger, please call emergency services (911 in the US).
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                <div className="flex items-start">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                                    <p className="text-sm text-muted-foreground text-left">
                                        <strong>Important:</strong> This assessment is not a clinical diagnosis. If you're experiencing 
                                        significant distress, please consult with a qualified mental health professional. 
                                        The information provided is for educational purposes only and should not replace 
                                        professional advice, diagnosis, or treatment.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "rounded-md bg-primary px-6 py-3 text-lg text-primary-foreground",
                                        "shadow-sm transition-colors hover:bg-primary/90"
                                    )}
                                    onClick={restartAssessment}
                                >
                                    Take Another Assessment
                                </motion.button>
                                
                                {assessmentHistory.length > 1 && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "rounded-md bg-secondary px-6 py-3 text-lg text-secondary-foreground",
                                            "shadow-sm transition-colors hover:bg-secondary/90"
                                        )}
                                        onClick={viewHistory}
                                    >
                                        View History
                                    </motion.button>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            ) : (
                <>
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mx-4 w-full max-w-2xl rounded-lg bg-card p-10 shadow-md"
                    >
                        <div className="mb-8 flex items-center justify-between">
                            <span className="text-lg font-medium text-muted-foreground">
                                Question {currentQuestion + 1}/{questions.length}
                            </span>
                            <span className="h-2 w-full max-w-xs rounded-full bg-gray-200">
                                <div 
                                    className="h-full rounded-full bg-primary" 
                                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                ></div>
                            </span>
                        </div>

                        <h2 className="mb-8 text-2xl font-bold text-foreground">
                            {questions[currentQuestion]?.question}
                        </h2>

                        {error && (
                            <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {questions[currentQuestion]?.options.map((option, index) => (
                                <motion.button
                                    key={index}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={cn(
                                        "rounded-md border border-input bg-accent/50 p-4 text-left text-xl",
                                        "transition-colors hover:bg-accent"
                                    )}
                                    onClick={() => handleAnswer(option)}
                                >
                                    {option}
                                </motion.button>
                            ))}
                        </div>
                        
                        {currentQuestion > 0 && (
                            <div className="mt-6 text-center">
                                <button 
                                    className="text-primary hover:underline"
                                    onClick={() => {
                                        setUserResponses(userResponses.slice(0, -1));
                                        setCurrentQuestion(currentQuestion - 1);
                                    }}
                                >
                                    ← Back to previous question
                                </button>
                            </div>
                        )}
                        
                        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                            <button
                                className="text-sm text-muted-foreground flex items-center gap-1 mx-auto"
                                onClick={() => setShowCrisisResources(!showCrisisResources)}
                            >
                                <HelpCircle className="h-4 w-4" />
                                <span>Need immediate help?</span>
                            </button>
                            
                            {showCrisisResources && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm"
                                >
                                    <p className="font-medium text-red-700 dark:text-red-300 mb-2">
                                        If you need immediate support:
                                    </p>
                                    <ul className="text-left space-y-1">
                                        {CRISIS_RESOURCES.map((resource, idx) => (
                                            <li key={idx} className="text-sm">
                                                <span className="font-semibold">{resource.name}:</span> {resource.contact}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
