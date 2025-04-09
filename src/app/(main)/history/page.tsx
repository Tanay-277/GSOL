"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Download,
  FileLock2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type UserResponse = {
  question: string;
  answer: string;
};

type AssessmentResult = {
  date: string;
  responses: UserResponse[];
  assessment: string;
};

export default function AssessmentHistory() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDataOptions, setShowDataOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [showExportNotice, setShowExportNotice] = useState(false);

  useEffect(() => {
    // Load assessment history from localStorage
    setLoading(true);
    setError(null);

    try {
      const savedHistory = localStorage.getItem("mentalHealthAssessments");

      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory) as AssessmentResult[];

          // Validate the data structure
          const isValidData = history.every(
            (item) =>
              item &&
              typeof item.date === "string" &&
              Array.isArray(item.responses) &&
              typeof item.assessment === "string",
          );

          if (!isValidData) {
            throw new Error("Invalid assessment data structure");
          }

          // Sort by date - newest first
          history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setAssessments(history);

          // Auto-select the most recent assessment if available
          if (history.length > 0) {
            setSelectedAssessment(history[0]);
          }
        } catch (e) {
          console.error("Error parsing saved assessments:", e);
          setError(
            "We couldn't load your assessment history due to corrupted data. You may need to start a new assessment.",
          );
          localStorage.removeItem("mentalHealthAssessments");
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      setError(
        "We couldn't access your assessment history. This may be due to private browsing mode or browser settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date error";
    }
  };

  const getProgressColor = (answer: string, options: string[]) => {
    if (!options || options.length === 0) return "bg-gray-300";

    const index = options.indexOf(answer);

    if (index === -1) return "bg-gray-300";

    const normalizedIndex = options.length > 1 ? index / (options.length - 1) : 0;

    if (normalizedIndex <= 0.25) return "bg-red-500";
    if (normalizedIndex <= 0.5) return "bg-yellow-500";
    if (normalizedIndex <= 0.75) return "bg-blue-500";
    return "bg-green-500";
  };

  const handleDeleteAssessment = (date: string, event: React.MouseEvent) => {
    // Prevent event bubbling to avoid selecting the assessment when clicking delete
    event.stopPropagation();
    setAssessmentToDelete(date);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAssessment = () => {
    if (!assessmentToDelete) return;

    try {
      // Find the assessment with the specified date
      const updatedAssessments = assessments.filter(
        (assessment) => assessment.date !== assessmentToDelete,
      );

      // Update state and localStorage
      setAssessments(updatedAssessments);
      localStorage.setItem("mentalHealthAssessments", JSON.stringify(updatedAssessments));

      // If the deleted assessment was selected, clear selection or select the first available
      if (selectedAssessment?.date === assessmentToDelete) {
        setSelectedAssessment(updatedAssessments.length > 0 ? updatedAssessments[0] : null);
      }

      setShowDeleteConfirm(false);
      setAssessmentToDelete(null);
    } catch (e) {
      console.error("Error deleting assessment:", e);
      setError("Failed to delete assessment. Please try again.");
    }
  };

  const exportAssessmentHistory = () => {
    try {
      // Create a download object with the assessment data
      const dataStr = JSON.stringify(assessments, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

      // Create download link and trigger click
      const exportName = `mental_health_assessments_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportName);
      linkElement.style.display = "none";
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      // Show export notice
      setShowExportNotice(true);
      // Hide notice after 3 seconds
      setTimeout(() => setShowExportNotice(false), 3000);
    } catch (e) {
      console.error("Error exporting assessments:", e);
      setError("Failed to export assessment data. Please try again.");
    }
  };

  const handleBackToAssessment = () => {
    router.push("/onboarding");
  };

  const deleteAllAssessments = () => {
    try {
      localStorage.removeItem("mentalHealthAssessments");
      setAssessments([]);
      setSelectedAssessment(null);
      setShowDataOptions(false);
    } catch (e) {
      console.error("Error clearing assessment history:", e);
      setError("Failed to clear assessment history. Please try again.");
    }
  };

  // Check if the assessment might contain crisis-related content
  const checkForCrisisContent = (assessment: AssessmentResult): boolean => {
    const crisisKeywords = ["suicide", "self-harm", "harm yourself", "crisis", "emergency"];

    // Check in responses
    const responsesContainCrisis = assessment.responses.some((r) =>
      crisisKeywords.some(
        (keyword) =>
          r.question.toLowerCase().includes(keyword) || r.answer.toLowerCase().includes(keyword),
      ),
    );

    // Check in assessment text
    const assessmentContainsCrisis = crisisKeywords.some((keyword) =>
      assessment.assessment.toLowerCase().includes(keyword),
    );

    return responsesContainCrisis || assessmentContainsCrisis;
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <div className="mx-4 max-w-3xl rounded-lg bg-card p-10 text-center shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Loading assessment history...</h2>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <div className="mx-4 max-w-3xl rounded-lg bg-card p-10 text-center shadow-md">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-4 text-2xl font-bold text-foreground">Error Loading History</h2>
          <p className="mb-6 text-lg text-muted-foreground">{error}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleBackToAssessment} variant="default">
              Start New Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <div className="mx-4 max-w-3xl rounded-lg bg-card p-10 text-center shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-foreground">No Assessment History</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            You haven&apos;t completed any mental health assessments yet.
          </p>
          <Button onClick={handleBackToAssessment} size="lg" className="text-lg">
            Take Your First Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Your Mental Health Assessment History
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track your mental wellbeing progress over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDataOptions(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <FileLock2 className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Data</span>
            </Button>

            <Button onClick={handleBackToAssessment} className="flex items-center gap-1" size="sm">
              <ChevronRight className="h-4 w-4" />
              <span>Take New Assessment</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-7">
          {/* Assessment list */}
          <div className="max-h-[70vh] overflow-y-auto rounded-lg bg-card p-4 shadow-md md:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Previous Assessments</h2>

            <div className="space-y-2">
              {assessments.map((assessment, index) => (
                <button
                  key={assessment.date}
                  className={cn(
                    "relative w-full rounded-md border p-3 text-left transition-colors",
                    selectedAssessment?.date === assessment.date
                      ? "border-primary bg-primary/10"
                      : "border-input hover:bg-accent/50",
                  )}
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Assessment {assessments.length - index}
                        {index === 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Latest
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(assessment.date)}</span>
                      </div>
                    </div>
                    <div
                      onClick={(e) => handleDeleteAssessment(assessment.date, e)}
                      className="cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete assessment"
                      role="button"
                      tabIndex={0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </div>
                  </div>

                  {checkForCrisisContent(assessment) && (
                    <div className="absolute right-1 top-1">
                      <span
                        className="text-red-500"
                        title="This assessment contains concerning content"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected assessment details */}
          <div className="max-h-[70vh] overflow-y-auto rounded-lg bg-card p-6 shadow-md md:col-span-5">
            {selectedAssessment ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="mb-4 text-2xl font-bold text-foreground">Assessment Details</h2>
                <p className="mb-2 text-sm text-muted-foreground">
                  Taken on {formatDate(selectedAssessment.date)}
                </p>

                <div className="mb-6 rounded-lg bg-accent/50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Your Responses</h3>
                  <div className="space-y-4">
                    {selectedAssessment.responses.map((response, i) => {
                      // Get all unique options from all questions
                      const allOptions = Array.from(
                        new Set(
                          assessments.flatMap((a) =>
                            a.responses
                              .filter((r) => r.question === response.question)
                              .map((r) => r.answer),
                          ),
                        ),
                      );

                      return (
                        <div key={i} className="rounded-md bg-background p-3 shadow-sm">
                          <p className="mb-1 font-medium text-foreground">{response.question}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">{response.answer}</p>
                            <span
                              className={`h-3 w-3 rounded-full ${getProgressColor(response.answer, allOptions)}`}
                              title="Response indicator"
                            ></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    Professional Assessment
                  </h3>
                  <div className="rounded-lg bg-background p-4 shadow-sm">
                    <p className="whitespace-pre-line text-muted-foreground">
                      {selectedAssessment.assessment}
                    </p>
                  </div>
                </div>

                {/* Show crisis resources if assessment contains crisis content */}
                {checkForCrisisContent(selectedAssessment) && (
                  <Alert className="mb-6 bg-red-50 dark:bg-red-900/20">
                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertTitle className="text-red-700 dark:text-red-300">
                      Support Resources
                    </AlertTitle>
                    <AlertDescription className="text-left">
                      <p className="mb-2">
                        Based on this assessment, please consider accessing support resources:
                      </p>
                      <ul className="list-disc space-y-1 pl-5">
                        {CRISIS_RESOURCES.map((resource, idx) => (
                          <li key={idx}>
                            <strong>{resource.name}:</strong> {resource.contact}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-start">
                    <HelpCircle className="mr-2 mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> This assessment is not a clinical diagnosis. If
                      you&apos;re experiencing significant distress, please consult with a qualified
                      mental health professional.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Select an assessment from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog for deleting an assessment */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAssessment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data management dialog */}
      <Dialog open={showDataOptions} onOpenChange={setShowDataOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileLock2 className="h-5 w-5" />
              <span>Manage Your Assessment Data</span>
            </DialogTitle>
            <DialogDescription>
              Your mental health assessment data is stored locally on your device. You can export or
              delete your data at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-green-600" />
                <div>
                  <h3 className="mb-1 font-medium">Data Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is stored locally on your device and is not sent to our servers. This
                    means your mental health information stays private, but also that it will be
                    lost if you clear your browser data.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={exportAssessmentHistory}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </Button>

              <Button
                onClick={deleteAllAssessments}
                variant="destructive"
                className="flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete All Data</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDataOptions(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export notification */}
      {showExportNotice && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-green-100 px-4 py-2 text-green-800 shadow-md dark:bg-green-900 dark:text-green-100">
          <ShieldCheck className="h-5 w-5" />
          <span>Data exported successfully</span>
        </div>
      )}
    </div>
  );
}
