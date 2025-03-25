import { inngest } from "@/features/inngest/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });
  }

  await inngest.send({
    name: "video/generate.recommendations",
    data: {
      courseId,
      chapterId,
    },
  });

  return NextResponse.json({ message: "Event sent!" });
}
