import { z } from "zod";

export const TUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string(),
  subscription: z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
  }),
});

export type TUser = z.infer<typeof TUserSchema>;

export type Steps = "type" | "topic";

export type GenerationConfig = {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseMimeType: string;
};

export type CourseChapter = {
  name: string;
  description: string;
  duration: string;
  category: string;
  topic: string;
  level: string;
};

export type CourseResponse = {
  name: string;
  description: string;
  chapters: CourseChapter[];
};

export type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};
