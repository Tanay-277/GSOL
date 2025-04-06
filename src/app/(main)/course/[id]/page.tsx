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
  let videos = [
    {
      id: "dBnniua6-oM",
      title: "I had a black dog, his name was depression",
      description: "A short animated video that explains what it feels like to live with depression.",
      channelTitle: "World Health Organization (WHO)",
      thumbnail: "https://img.youtube.com/vi/dBnniua6-oM/default.jpg",
      videoUrl: "https://www.youtube.com/watch?v=dBnniua6-oM",
    },
    {
      id: "XiCrniLQGYc",
      title: "The Science of Depression",
      description: "An in-depth look at the science behind depression and how it affects the brain.",
      channelTitle: "AsapSCIENCE",
      thumbnail: "https://img.youtube.com/vi/XiCrniLQGYc/default.jpg",
      videoUrl: "https://www.youtube.com/watch?v=XiCrniLQGYc",
    },
    {
      id: "z-IR48Mb3W0",
      title: "How to Help Someone with Depression",
      description: "Practical advice on how to support someone dealing with depression.",
      channelTitle: "Psych Hub",
      thumbnail: "https://img.youtube.com/vi/z-IR48Mb3W0/default.jpg",
      videoUrl: "https://www.youtube.com/watch?v=z-IR48Mb3W0",
    },
  ];
  try {
    videos = await getRecommendation(course.topic);
  } catch (error) {
    console.error("Error fetching video recommendations:", error);
    // Continue with empty videos array
  }

  return <CourseContent course={course} videos={videos} />;
}
