import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { CourseContent } from "@/components/course-content";
import { db } from "@/db";
import { getRecommendation } from "@/features/chapter/action/get-video-recommendation";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  const course = await db.course.findUnique({
    where: { id: (await params).id },
    include: {
      flashcards: true,
    },
  });

  if (!course) {
    notFound();
  }

  // Fetch YouTube videos using the getRecommendation server action
  let videos = [];
  try {
    videos = await getRecommendation(course.topic);
  } catch (error) {
    console.error("Error fetching video recommendations:", error);
    // Continue with empty videos array
  }

  return <CourseContent course={course} videos={videos} />;
}
