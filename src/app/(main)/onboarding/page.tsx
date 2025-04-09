"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Heart,
  HelpCircle,
  Info,
  ListTodo,
  ShieldAlert,
  Smile,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

// interface ApiResponse {
//   overallAssessment: string;
//   keyObservations: string[];
//   selfCareSuggestions: string[];
//   diagnosis: { id: string; name: string; description: string }[];
// }

// Mental health crisis resources
const CRISIS_RESOURCES = [
  {
    name: "National Suicide Prevention Lifeline",
    contact: "988 or 1-800-273-8255",
    url: "https://988lifeline.org/",
  },
  {
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    url: "https://www.crisistextline.org/",
  },
  {
    name: "SAMHSA's National Helpline",
    contact: "1-800-662-4357",
    url: "https://www.samhsa.gov/find-help/national-helpline",
  },
];

// Array of focus options for the combobox
const focusOptions = [
  { value: "general wellness", label: "General Mental Wellbeing" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "stress", label: "Stress Management" },
  { value: "sleep", label: "Sleep Issues" },
];

export default function OnBoarding() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false); // Changed to false initially
  const [assessment, setAssessment] = useState("");
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState("general wellness");
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [dataPrivacyAcknowledged, setDataPrivacyAcknowledged] = useState(false);
  const [apiErrors, setApiErrors] = useState(0);
  const [retryingQuestion, setRetryingQuestion] = useState(false);
  const [open, setOpen] = useState(false); // State for controlling combobox
  const [showConfirmation, setShowConfirmation] = useState(false); // New state for confirmation step
  const [lastResponse, setLastResponse] = useState<string>(""); // Store the last response temporarily
  const [processedAssessment, setProcessedAssessment] = useState<{
    overall: string;
    observations: string;
    recommendations: string;
    selfCare: string[];
    disclaimer: string;
    diagnosis?: { id: string; name: string; description: string }[] | string;
  } | null>(null);
  const [sidebarToggled, setSidebarToggled] = useState(false); // Added state to track if sidebar has been toggled
  const [requestSuccess, setRequestSuccess] = useState(false); // Added state to track API request success

  const { toggleSidebar } = useSidebar();

  // Add a new ref to track if we're currently fetching
  const isFetchingRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Load only completed assessment history from localStorage on mount
  useEffect(() => {
    // Only toggle sidebar once
    if (!sidebarToggled) {
      toggleSidebar();
      setSidebarToggled(true);
    }

    const savedHistory = localStorage.getItem("mentalHealthAssessments");
    if (savedHistory) {
      try {
        setAssessmentHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error parsing saved assessments:", e);
        // Clear corrupted data
        localStorage.removeItem("mentalHealthAssessments");
      }
    }
    // No need to load unfinished assessments anymore
  }, [toggleSidebar, sidebarToggled]);

  const fetchQuestions = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log("Already fetching questions, request ignored");
      return;
    }

    // Clear any existing timeout
    setLoadingQuestions(true);
    setError("");
    setRetryingQuestion(false);
    setApiErrors(0);
    setRequestSuccess(false); // Reset success state

    // Set fetching flag to true
    isFetchingRef.current = true;

    // Add retry logic for more resilience
    let retries = 2;

    try {
      while (retries >= 0 && !requestSuccess) {
        try {
          const response = await fetch("/api/generate-questions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ focus }),
            // Add cache control
            cache: "no-store",
          });

          if (response.status === 429) {
            setError("You've made too many requests. Please wait a moment and try again.");
            throw new Error("Rate limit exceeded");
          }

          if (!response.ok) {
            throw new Error(`Failed to generate questions: ${response.status}`);
          }

          const data = await response.json();

          if (!data.questions || data.questions.length < 5) {
            throw new Error("Invalid question format received");
          }

          setQuestions(data.questions);
          setRequestSuccess(true); // Set success state

          // If we're using fallback questions (indicated by source)
          if (data.source === "fallback") {
            console.log("Using fallback questions");
            setApiErrors((prev) => prev + 1);
          }
          break; // Exit the while loop on success
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error("Error generating questions:", error);
          retries--;
          setApiErrors((prev) => prev + 1);

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
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    } finally {
      setLoadingQuestions(false);
      setRetryingQuestion(false);
      // Reset fetching flag
      isFetchingRef.current = false;
    }
  };

  const handleAnswer = async (selectedOption: string) => {
    try {
      const nextQuestion = currentQuestion + 1;

      // If this is the last question, show confirmation instead of immediately submitting
      if (nextQuestion >= questions.length) {
        setLastResponse(selectedOption);
        setShowConfirmation(true);
        return;
      }

      // Save the user's response for non-final questions
      const updatedResponses = [
        ...userResponses,
        {
          question: questions[currentQuestion].question,
          answer: selectedOption,
        },
      ];

      setUserResponses(updatedResponses);
      setCurrentQuestion(nextQuestion);
    } catch (e) {
      console.error("Error in handleAnswer:", e);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // Modify the start assessment function to prevent duplicate calls
  const startAssessment = () => {
    if (!dataPrivacyAcknowledged || isFetchingRef.current) {
      return;
    }

    setStarted(true);
    fetchQuestions();
  };

  const handleSubmitAssessment = async () => {
    try {
      // Prevent duplicate submissions
      if (loading || isSubmittingRef.current) {
        console.log("Submission already in progress, ignoring duplicate request");
        return;
      }

      isSubmittingRef.current = true;
      setShowConfirmation(false);
      setLoading(true);
      setShowResults(true);
      setRequestSuccess(false);

      console.log("Starting assessment submission process");

      // Add the last response that was stored when showing confirmation
      const finalResponses = [
        ...userResponses,
        {
          question: questions[currentQuestion].question,
          answer: lastResponse,
        },
      ];

      setUserResponses(finalResponses);

      // Crisis word detection
      const crisisKeywords = [
        "suicide",
        "kill myself",
        "want to die",
        "end my life",
        "harming myself",
      ];
      const containsCrisisWord = finalResponses.some((r) =>
        crisisKeywords.some(
          (word) =>
            r.answer.toLowerCase().includes(word) || r.question.toLowerCase().includes(word),
        ),
      );

      if (containsCrisisWord) {
        setShowCrisisResources(true);
      }

      // Set a global timeout for the entire operation
      const analysisTimeout = setTimeout(() => {
        console.log("Analysis request timed out");
        setLoading(false);
        setError("Analysis request timed out. Using generic assessment.");
        setAssessment(FALLBACK_ASSESSMENT);
        setProcessedAssessment(processAssessment(FALLBACK_ASSESSMENT));
        isSubmittingRef.current = false;
      }, 40000); // Extended to 40 seconds due to multiple API calls

      try {
        console.log("Sending analysis request");

        // Use AbortController for reliable timeout
        const controller = new AbortController();
        const fetchTimeoutId = setTimeout(() => {
          console.log("Analysis fetch timeout triggered");
          controller.abort();
        }, 20000); // Extended to 20 seconds

        // Send all responses for analysis with explicit no-cache
        const response = await fetch("/api/analyse-responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({ responses: finalResponses }),
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(fetchTimeoutId);

        if (response.status === 429) {
          console.error("Rate limit exceeded");
          setError("You've made too many requests. Please wait a moment and try again.");
          throw new Error("Rate limit exceeded");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", response.status, errorData);
          throw new Error(
            `Server error: ${response.status} - ${errorData.error || "Unknown error"}`,
          );
        }

        console.log("Analysis response received");
        const data = await response.json();

        if (
          !data.overallAssessment ||
          !data.keyObservations ||
          !data.selfCareSuggestions ||
          !data.diagnosis
        ) {
          console.error("Missing key fields in response:", data);
          throw new Error("Response did not contain expected fields");
        }

        // Set the processed assessment with the response data
        setProcessedAssessment({
          overall: data.overallAssessment,
          observations: data.keyObservations.join("\n"),
          recommendations: "", // Add empty recommendations
          selfCare: data.selfCareSuggestions,
          disclaimer:
            "This assessment is not a clinical diagnosis and should not replace professional mental health advice.",
          diagnosis: data.diagnosis,
        });

        // Store the completed assessment in history
        const newAssessment = {
          date: new Date().toISOString(),
          responses: finalResponses,
          assessment: JSON.stringify(data),
        };

        try {
          const updatedHistory = [...assessmentHistory, newAssessment];
          setAssessmentHistory(updatedHistory);
          localStorage.setItem("mentalHealthAssessments", JSON.stringify(updatedHistory));
        } catch (storageError) {
          console.error("Error saving assessment history:", storageError);
        }

        // Generate courses based on the assessment
        console.log("Generating courses based on assessment");
        try {
          const courseController = new AbortController();
          const courseTimeoutId = setTimeout(() => {
            console.log("Course generation timeout triggered");
            courseController.abort();
          }, 30000); // Extended to 30 seconds for course generation

          const courseResponse = await fetch("/api/generate-course", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
            body: JSON.stringify({
              responses: finalResponses,
              assessment: data,
            }),
            signal: courseController.signal,
            cache: "no-store",
          });

          clearTimeout(courseTimeoutId);

          if (!courseResponse.ok) {
            console.error("Error generating courses:", courseResponse.status);
            setError(
              "We couldn't generate personalized courses at this time. You can still view your assessment results.",
            );
          } else {
            const courseData = await courseResponse.json();
            console.log("Courses generated successfully:", courseData);

            // If courses were generated
            if (courseData.courses && courseData.courses.length > 0) {
              // Store the generated courses in localStorage for the dashboard
              localStorage.setItem("generatedCourses", JSON.stringify(courseData.courses));

              // Store the first course ID for direct navigation
              localStorage.setItem("lastGeneratedCourseId", courseData.courses[0].id);
            }

            setError("");
            console.log("Ready to access courses");
          }
        } catch (courseError) {
          console.error("Error generating courses:", courseError);
          setError(
            "We couldn't generate personalized courses at this time. You can still view your assessment results.",
          );
        }

        setRequestSuccess(true); // Set success state
        clearTimeout(analysisTimeout);
      } catch (error) {
        console.error("Error analyzing responses:", error);
        setError(
          error instanceof Error
            ? error.message
            : "We couldn't generate your assessment. Please try again later.",
        );
        setAssessment(FALLBACK_ASSESSMENT);
        setProcessedAssessment(processAssessment(FALLBACK_ASSESSMENT));
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
        clearTimeout(analysisTimeout);
      }
    } catch (e) {
      console.error("Error in handleSubmitAssessment:", e);
      setError("An unexpected error occurred. Please try again.");
      isSubmittingRef.current = false;
      setLoading(false);
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
    router.push("/history");
  };

  const FALLBACK_ASSESSMENT = `
    Overall Assessment:
    Based on your responses, you appear to be experiencing some mental health challenges that may benefit from attention and self-care strategies.

    Key Observations:
    Your responses suggest some areas of concern that would benefit from self-monitoring and possibly professional support. Remember that everyone experiences ups and downs in their mental wellbeing.

    Personalized Recommendations:
    Consider establishing a consistent self-care routine that includes physical activity, healthy eating, adequate sleep, and social connection. Mindfulness practices like meditation may also help manage stress.

    Self-Care Suggestions:
    - Try to maintain a regular sleep schedule
    - Engage in physical activity for at least 30 minutes daily
    - Practice deep breathing when feeling overwhelmed
    - Connect with supportive friends or family members
    - Consider reaching out to a mental health professional for a comprehensive assessment

    NOTE: This assessment is generated automatically and is not a substitute for professional mental health advice, diagnosis, or treatment. If you're experiencing severe distress or thoughts of self-harm, please contact a crisis helpline or emergency services immediately.
    `;

  const processAssessment = (text: string) => {
    try {
      const sections = {
        overall: "",
        observations: "",
        recommendations: "",
        selfCare: [] as string[],
        disclaimer: "",
        diagnosis: [] as { id: string; name: string; description: string }[],
      };

      const overallMatch = text.match(/Overall Assessment[:\s]+([\s\S]+?)(?:Key Observations|$)/i);
      if (overallMatch && overallMatch[1]) {
        sections.overall = overallMatch[1].trim();
      }

      const observationsMatch = text.match(
        /Key Observations[:\s]+([\s\S]+?)(?:Personalized Recommendations|$)/i,
      );
      if (observationsMatch && observationsMatch[1]) {
        sections.observations = observationsMatch[1].trim();
      }

      const recommendationsMatch = text.match(
        /Personalized Recommendations[:\s]+([\s\S]+?)(?:Self-Care Suggestions|$)/i,
      );
      if (recommendationsMatch && recommendationsMatch[1]) {
        sections.recommendations = recommendationsMatch[1].trim();
      }

      const selfCareMatch = text.match(/Self-Care Suggestions[:\s]+([\s\S]+?)(?:NOTE:|$)/i);
      if (selfCareMatch && selfCareMatch[1]) {
        const bulletPoints = selfCareMatch[1]
          .split(/[\n\r]+/)
          .map((item) => item.replace(/^[-•*]\s*/, "").trim())
          .filter((item) => item.length > 0);

        sections.selfCare = bulletPoints;
      }

      const disclaimerMatch =
        text.match(/NOTE:[:\s]+([\s\S]+)$/i) ||
        text.match(/IMPORTANT:[:\s]+([\s\S]+)$/i) ||
        text.match(/DISCLAIMER:[:\s]+([\s\S]+)$/i);
      if (disclaimerMatch && disclaimerMatch[1]) {
        sections.disclaimer = disclaimerMatch[1].trim();
      } else {
        sections.disclaimer =
          "This assessment is not a clinical diagnosis and should not replace professional mental health advice.";
      }

      return sections;
    } catch (error) {
      console.error("Error processing assessment text:", error);
      return {
        overall: text,
        observations: "",
        recommendations: "",
        selfCare: [],
        disclaimer:
          "This assessment is not a clinical diagnosis and should not replace professional mental health advice.",
        diagnosis: [],
      };
    }
  };

  useEffect(() => {
    if (FALLBACK_ASSESSMENT && !processedAssessment) {
      setProcessedAssessment(processAssessment(FALLBACK_ASSESSMENT));
    }
  }, [FALLBACK_ASSESSMENT, processedAssessment]);

  const navigateToCourse = useCallback(() => {
    const lastCourseId = localStorage.getItem("lastGeneratedCourseId");

    if (lastCourseId) {
      console.log("Navigating to last generated course:", lastCourseId);
      router.push(`/course/${lastCourseId}`);
      return;
    }

    const courses = localStorage.getItem("generatedCourses");
    if (courses) {
      const parsedCourses = JSON.parse(courses);
      if (parsedCourses && parsedCourses.length > 0) {
        console.log("Navigating to first course from storage:", parsedCourses[0].id);
        router.push(`/course/${parsedCourses[0].id}`);
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  if (loadingQuestions && !questions.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <div className="mx-4 max-w-2xl rounded-lg bg-card p-10 text-center shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-foreground">
            {retryingQuestion
              ? "Retrying... Please wait"
              : "Preparing your mental health assessment..."}
          </h2>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          {apiErrors > 0 && (
            <p className="mt-4 text-amber-600 dark:text-amber-400">
              We&apos;re experiencing some delays. Please be patient.
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
          transition={{ duration: 0.6 }}
          className="mx-4 max-w-lg rounded-xl bg-card p-8 text-center shadow-md"
        >
          <h1 className="mb-4 text-3xl font-bold text-foreground">Mental Health Check-In</h1>
          <p className="mb-5 text-base text-muted-foreground">
            This brief assessment will help you understand your current mental state and provide
            personalized recommendations.
          </p>

          <Alert className="mb-5 bg-blue-50 dark:bg-blue-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not a Diagnostic Tool</AlertTitle>
            <AlertDescription className="text-sm">
              This provides general feedback based on your responses. For clinical diagnosis, please
              consult a healthcare professional.
            </AlertDescription>
          </Alert>

          {assessmentHistory.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-sm text-muted-foreground">
                You have {assessmentHistory.length} previous assessment
                {assessmentHistory.length > 1 ? "s" : ""}
              </p>
              <Button variant="outline" className="w-full" onClick={viewHistory}>
                View Assessment History
              </Button>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-left text-sm font-medium">
              What would you like to focus on?
            </label>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between border border-input bg-background p-3 text-left font-normal"
                >
                  {focus
                    ? focusOptions.find((option) => option.value === focus)?.label
                    : "Select focus area..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search for focus area..." className="h-9" />
                  <CommandEmpty>No focus area found.</CommandEmpty>
                  <CommandGroup>
                    {focusOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          setFocus(currentValue);
                          setOpen(false);
                        }}
                      >
                        {option.label}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            focus === option.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-5 flex items-start">
            <input
              type="checkbox"
              id="privacy-consent"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={dataPrivacyAcknowledged}
              onChange={(e) => setDataPrivacyAcknowledged(e.target.checked)}
            />
            <label htmlFor="privacy-consent" className="ml-2 block text-left text-xs">
              <span className="font-medium">Privacy Notice: </span>
              Assessment results will be stored locally on your device only and not shared with
              third parties.
            </label>
          </div>

          <motion.button
            whileHover={{ scale: dataPrivacyAcknowledged ? 1.02 : 1 }}
            whileTap={{ scale: dataPrivacyAcknowledged ? 0.98 : 1 }}
            className={cn(
              "w-full rounded-md py-3 text-lg font-medium shadow-sm transition-colors",
              dataPrivacyAcknowledged
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-gray-300 text-gray-500",
            )}
            onClick={startAssessment}
            disabled={!dataPrivacyAcknowledged}
          >
            Begin Assessment
          </motion.button>

          {!dataPrivacyAcknowledged && (
            <p className="mt-2 text-xs text-amber-600">
              Please acknowledge the privacy notice to continue
            </p>
          )}

          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={() => setShowCrisisResources(!showCrisisResources)}
              className="mx-auto flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Crisis Resources</span>
            </button>

            {showCrisisResources && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20"
              >
                <h3 className="mb-2 text-sm font-bold text-red-700 dark:text-red-300">
                  If you need immediate support:
                </h3>
                <ul className="space-y-1 text-left text-xs">
                  {CRISIS_RESOURCES.map((resource, idx) => (
                    <li key={idx}>
                      <strong>{resource.name}:</strong> {resource.contact}
                    </li>
                  ))}
                </ul>
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
            <div className="py-8">
              <h2 className="mb-6 text-3xl font-bold text-foreground">Analyzing Your Responses</h2>
              <div className="relative mx-auto my-8 h-24 w-24">
                <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                <div className="absolute inset-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-full border-2 border-dashed border-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smile className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-lg text-muted-foreground">
                We&apos;re carefully processing your responses to provide you with personalized
                insights.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                This usually takes about 15-30 seconds.
              </p>
              {apiErrors > 1 && (
                <p className="mt-4 text-amber-600 dark:text-amber-400">
                  We&apos;re experiencing some delays. Thank you for your patience.
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="mb-8 text-3xl font-bold text-foreground">
                Your Mental Health Assessment
              </h2>

              {error && (
                <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {processedAssessment ? (
                <div className="mb-8 space-y-5">
                  {/* Overall Assessment */}
                  <div className="rounded-xl border border-muted bg-card p-5 text-left shadow-sm">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                        <Heart className="h-5 w-5 text-rose-500" />
                      </div>
                      <h3 className="text-xl font-medium">Overall Assessment</h3>
                    </div>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {processedAssessment.overall}
                    </p>
                  </div>

                  {/* Diagnosis Section using Collapsible */}
                  {processedAssessment.diagnosis && (
                    <Collapsible className="rounded-xl border border-muted bg-card shadow-sm">
                      <div className="p-5">
                        <CollapsibleTrigger className="group flex w-full items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                              <Info className="h-5 w-5 text-violet-500" />
                            </div>
                            <h3 className="text-xl font-medium">Potential Conditions</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="px-5 pb-5">
                        {Array.isArray(processedAssessment.diagnosis) ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {processedAssessment.diagnosis.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border border-muted bg-background p-4 shadow-sm"
                              >
                                <h4 className="mb-1 font-medium text-foreground">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground">
                            {typeof processedAssessment.diagnosis === "string"
                              ? processedAssessment.diagnosis
                              : "Based on your responses, no specific conditions were identified. This is not a clinical diagnosis."}
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Key Observations using Collapsible */}
                  {processedAssessment.observations && (
                    <Collapsible className="rounded-xl border border-muted bg-card shadow-sm">
                      <div className="p-5">
                        <CollapsibleTrigger className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                              <BookOpen className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-medium">Key Observations</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="px-5 pb-5">
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {processedAssessment.observations}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Self-Care Suggestions using Collapsible */}
                  {processedAssessment.selfCare && processedAssessment.selfCare.length > 0 && (
                    <Collapsible className="rounded-xl border border-muted bg-card shadow-sm">
                      <div className="p-5">
                        <CollapsibleTrigger className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                              <ListTodo className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-medium">Self-Care Recommendations</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="px-5 pb-5">
                        <ul className="ml-2 space-y-3">
                          {processedAssessment.selfCare.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-base text-muted-foreground"
                            >
                              <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Disclaimer */}
                  {processedAssessment.disclaimer && (
                    <div className="rounded-lg bg-blue-50 p-4 text-left dark:bg-blue-900/20">
                      <div className="flex items-start">
                        <Info className="mr-2 mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-muted-foreground">
                          <strong>Important:</strong> {processedAssessment.disclaimer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Personalized Courses Button - Updated to go directly to course */}
                  <div className="mt-6 rounded-xl border border-muted bg-card p-5 text-center shadow-sm">
                    <div className="mb-3 flex items-center justify-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <BookOpen className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="text-xl font-medium">Your Personalized Course</h3>
                    </div>
                    <p className="mb-5 text-base text-muted-foreground">
                      Based on your assessment results, we&apos;ve created a customized learning
                      path to help you improve your mental wellbeing.
                    </p>
                    <Button
                      onClick={navigateToCourse}
                      className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:text-white dark:hover:bg-green-800"
                      size="lg"
                    >
                      View My Courses
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-10 text-left">
                  <p className="whitespace-pre-line text-base text-muted-foreground">
                    {assessment}
                  </p>
                </div>
              )}

              {showCrisisResources && (
                <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-700 dark:text-red-300">
                    Important: Support Resources
                  </AlertTitle>
                  <AlertDescription className="text-left">
                    <p className="mb-2">
                      Based on your responses, we want to ensure you have access to immediate
                      support:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {CRISIS_RESOURCES.map((resource, idx) => (
                        <li key={idx}>
                          <strong>{resource.name}:</strong> {resource.contact}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">
                      If you&apos;re in immediate danger, please call emergency services (911 in the
                      US).
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "rounded-md bg-primary px-6 py-3 text-lg text-primary-foreground",
                    "shadow-sm transition-colors hover:bg-primary/90",
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
                      "shadow-sm transition-colors hover:bg-secondary/90",
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
            key={`question-${currentQuestion}-${showConfirmation}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-4 w-full max-w-2xl rounded-lg bg-card p-10 shadow-md"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-lg font-medium text-muted-foreground">
                Question {currentQuestion + 1}/{questions.length}
              </span>
              <div className="w-full max-w-xs">
                <Progress
                  value={((currentQuestion + 1) / questions.length) * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Confirmation Screen */}
            {showConfirmation ? (
              <div className="text-center">
                <h2 className="mb-6 text-2xl font-bold text-foreground">
                  Ready to Submit Your Assessment?
                </h2>
                <p className="mb-8 text-muted-foreground">
                  You&apos;ve answered all the questions. Click &quot;Submit&quot; to receive your
                  personalized feedback.
                </p>

                <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-start">
                    <Info className="mr-2 mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-left text-sm text-muted-foreground">
                      Your responses will be analyzed to provide personalized feedback about your
                      mental health. This is not a clinical diagnosis.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={handleSubmitAssessment}
                  >
                    Submit Assessment
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowConfirmation(false);
                      setLastResponse("");
                    }}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            ) : (
              // Question Screen (unchanged)
              <>
                <h2 className="mb-8 text-2xl font-bold text-foreground">
                  {questions[currentQuestion]?.question}
                </h2>

                {error && (
                  <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
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
                        "transition-colors hover:bg-accent",
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
              </>
            )}

            <div className="mt-8 border-t border-gray-200 pt-4 text-center dark:border-gray-700">
              <button
                className="mx-auto flex items-center gap-1 text-sm text-muted-foreground"
                onClick={() => setShowCrisisResources(!showCrisisResources)}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Need immediate help?</span>
              </button>

              {showCrisisResources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 rounded-md bg-red-50 p-3 text-sm dark:bg-red-900/20"
                >
                  <p className="mb-2 font-medium text-red-700 dark:text-red-300">
                    If you need immediate support:
                  </p>
                  <ul className="space-y-1 text-left">
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
