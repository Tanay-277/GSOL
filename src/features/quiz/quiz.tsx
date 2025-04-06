"use client";

import { BlurFade } from "@/components/ui/blur";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, P } from "@/components/ui/typography";
import { submitQuizAttempt } from "@/features/course/actions/quiz";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCourseQuiz } from "./actions/get-course-quiz";
import { getQuizFeedback } from "./actions/quiz-feedback";
import { QuizResult } from "./quiz-result";

type Props = {
  id: string;
};

export const QuizPage = ({ id }: Props) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { user } = useUser();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => getCourseQuiz({ id }),
  });

  const submitMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      const result = await submitQuizAttempt({
        quizId: quiz?.id as string,
        userId: user.id,
        answers,
      });

      const feedback = await getQuizFeedback({
        quizId: quiz?.id as string,
        answers,
      });

      return {
        ...result,
        feedback,
      };
    },
  });

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    submitMutation.mutate(userAnswers);
  };

  const question = quiz?.questions[currentQuestion];

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col">
          <div className="flex flex-col space-y-2 text-left">
            <Skeleton className="h-9 w-2/3 md:h-10" />
            <Skeleton className="h-5 w-1/3" />
          </div>

          <Separator className="my-4" />
          <Card className="border-none px-0 shadow-none">
            <CardContent className="px-0 pt-6">
              <div className="mb-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="mt-2 h-6 w-full" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="relative flex rounded-lg border border-input p-4">
                    <Skeleton className="absolute left-4 top-4 h-4 w-4 rounded-full" />
                    <div className="flex-1 pl-8">
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-2 flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </section>
    );
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-4xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">Quiz: {quiz.title}</H3>
            <P className="text-muted-foreground">Course: {quiz.course.name}</P>
          </div>

          <Separator className="my-4" />
          <Card className="border-none px-0 shadow-none">
            <CardContent className="px-0 pt-6">
              <div className="mb-4">
                <p className="text-lg font-medium">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </p>
                <P className="text-lg text-primary [&:not(:first-child)]:my-2">
                  {question?.question as string}
                </P>
              </div>

              <RadioGroup
                value={userAnswers[question?.id as string]}
                onValueChange={(value) => handleAnswerSelect(question?.id as string, value)}
                className="mt-4 grid gap-3 md:grid-cols-2"
              >
                {question?.options.map((option, index) => (
                  <div
                    key={`option-${index}`}
                    className="relative flex cursor-pointer rounded-lg border border-input p-4 transition-colors hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value={option}
                      id={`${question.id}-${index}`}
                      className="absolute left-4 top-4"
                      disabled={submitMutation.isPending}
                    />
                    <Label
                      htmlFor={`${question.id}-${index}`}
                      className="flex-1 cursor-pointer pl-8"
                    >
                      <div className="font-medium">{option}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="mt-2 flex justify-between">
            <Button
              variant="outline"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
            >
              Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                disabled={!userAnswers[question?.id as string]}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  submitMutation.isPending ||
                  Object.keys(userAnswers).length !== quiz.questions.length
                }
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>

          <Separator className="my-4 mt-8" />

          {submitMutation.isSuccess && <QuizResult feedback={submitMutation.data.feedback} />}
        </div>
      </section>
    </BlurFade>
  );
};
