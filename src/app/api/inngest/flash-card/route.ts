import { inngest } from "@/features/inngest/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  await inngest.send({
    name: "course/generate.flashcards",
    data: {
      courseId,
    },
  });

  return NextResponse.json({ message: "Event sent!" });
}
