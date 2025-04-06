import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type QuizResultProps = {
  feedback: {
    score: number;
    totalQuestions: number;
    percentageScore: number;
    questionFeedback: {
      questionId: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }[];
    passingScore: number;
    passed: boolean;
    improvement?: string[];
  };
};

export function QuizResult({ feedback }: QuizResultProps) {
  return (
    <Card className="mt-6 border-none px-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center justify-between">
          Quiz Results
          <Badge variant={feedback.passed ? "success" : "destructive"}>
            {feedback.passed ? "Passed" : "Failed"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">
                {feedback.score}/{feedback.totalQuestions}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className="text-2xl font-bold">{feedback.percentageScore.toFixed(1)}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Passing Score</p>
              <p className="text-2xl font-bold">{feedback.passingScore}%</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Question Review</h4>
            {feedback.questionFeedback.map((q, i) => (
              <div key={q.questionId} className="space-y-2">
                <p className="font-medium">
                  Question {i + 1}: {q.question}
                </p>
                <div className="grid gap-2 pl-4">
                  <p className={q.isCorrect ? "text-green-600" : "text-red-600"}>
                    Your answer: {q.userAnswer}
                  </p>
                  {!q.isCorrect && (
                    <p className="text-green-600">Correct answer: {q.correctAnswer}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {feedback.improvement && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">Areas for Improvement</h4>
                <ul className="list-inside list-disc space-y-1">
                  {feedback.improvement.map((item, i) => (
                    <li key={i} className="text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
