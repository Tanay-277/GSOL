"use client";

import { BlurFade } from "@/components/ui/blur";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { H3, P } from "@/components/ui/typography";
import { generateCourseContent } from "@/features/course/actions/generate";
import { successToast } from "@/features/global/toast";
import { useUser } from "@/hooks/use-user";
import { Steps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookSolid, Code, LetterJ } from "@mynaui/icons-react";
import { CourseLevel, CourseType } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  GraduationCap,
  Pen,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const studyOptions = [
  {
    id: CourseType.Exam,
    label: "General Exam",
    description: "Prepare for upcoming tests and examinations",
    icon: () => <GraduationCap className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Job_Interview,
    label: "Job Interview",
    description: "Get ready for your next career opportunity",
    icon: () => <BriefcaseBusiness className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Practice,
    label: "Practice",
    description: "Enhance your skills through regular practice",
    icon: () => <Pen className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Coding,
    label: "Coding",
    description: "Master programming concepts and challenges",
    icon: () => <Code className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Jee,
    label: "JEE",
    description: "Prepare for Joint Entrance Examination",
    icon: () => <LetterJ className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Neet,
    label: "NEET",
    description: "Prepare for Medical Entrance Test",
    icon: () => <Stethoscope className="mb-2 h-10 w-10" />,
  },
  {
    id: CourseType.Others,
    label: "Other",
    description: "Customize your own learning path",
    icon: () => <BookSolid className="mb-2 h-10 w-10" />,
  },
];

const formSchema = z.object({
  type: z.nativeEnum(CourseType),
  topic: z.string().min(3, {
    message: "Topic must be at least 3 characters long",
  }),
  level: z.nativeEnum(CourseLevel),
});

export type TFormValues = z.infer<typeof formSchema>;

export default function Create() {
  const [step, setStep] = useState<Steps>("type");
  const { user } = useUser();
  const router = useRouter();

  const form = useForm<TFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: CourseType.Exam,
      topic: "",
      level: "Easy",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["create-course"],
    mutationFn: async (data: TFormValues) => {
      return await generateCourseContent({
        data,
        email: user?.email as string,
      });
    },
    onSuccess: ({ data, success }) => {
      if (!success) throw new Error("Failed to create course");

      router.push(`/course/${data.id}`);
      successToast("Course created successfully");
    },
  });

  const onSubmit = async (data: TFormValues) => {
    try {
      await mutate(data);
    } catch (error) {
      console.error("Error creating course:", error);
      throw new Error("Failed to create course");
    }
  };

  return (
    <>
      {step === "type" && (
        <BlurFade inView>
          <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col space-y-2 text-left">
                <H3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Start Building Your Personalized Learning Journey
                </H3>
                <P className="text-muted-foreground">
                  Choose your learning path to generate tailored study materials
                  for your next project
                </P>
              </div>

              <RadioGroup
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                defaultValue={CourseType.Exam}
                onValueChange={(v) => {
                  form.setValue("type", v as CourseType);
                }}
              >
                {studyOptions.map((option) => (
                  <Label
                    key={option.id}
                    className="group relative flex cursor-pointer flex-col items-center gap-4 rounded-xl bg-card p-6 shadow transition-all duration-200 has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary"
                  >
                    <RadioGroupItem
                      id={option.id}
                      value={option.id}
                      className="sr-only after:absolute after:inset-0"
                    />
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary transition-colors group-has-[[data-state=checked]]:bg-primary/10">
                      <option.icon />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    <div
                      className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20 transition-all duration-200 hover:ring-foreground/40"
                      aria-hidden="true"
                    />
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex justify-end pt-4">
                <Button
                  size="lg"
                  className="px-8"
                  onClick={() => setStep("topic")}
                >
                  Continue
                </Button>
              </div>
            </div>
          </section>
        </BlurFade>
      )}
      {step === "topic" && (
        <BlurFade inView>
          <section className="container mx-auto max-w-6xl py-8 md:px-4 md:py-12">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col space-y-2 text-left">
                <H3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Start Building Your Personalized Learning Journey
                </H3>
                <P className="text-muted-foreground">
                  Choose your learning path to generate tailored study materials
                  for your next project
                </P>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Textarea {...field} placeholder="Enter topic" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Set Difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CourseLevel).map((level) => (
                              <SelectItem
                                key={level}
                                value={level}
                                className="px-2 capitalize"
                              >
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <div className="flex justify-between pt-4">
                <Button
                  size="lg"
                  className="px-8"
                  onClick={() => setStep("type")}
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  className="px-8"
                  onClick={() => {
                    if (step === "topic") {
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                >
                  {isPending ? "Generating..." : "Continue"}
                </Button>
              </div>
            </div>
          </section>
        </BlurFade>
      )}
    </>
  );
}
