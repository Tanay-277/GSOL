"use client";

import { CourseContent } from "@/components/course-content";
import { BlurFade } from "@/components/ui/blur";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, P } from "@/components/ui/typography";
import { getAllCourses } from "@/features/course/actions/get-all-course";
import { useUser } from "@/hooks/use-user";
import { Separator } from "@radix-ui/react-separator";
import { useQuery } from "@tanstack/react-query";

const LoadingSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="flex flex-col transition-all hover:shadow-md">
        <CardHeader className="pt-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Skeleton className="h-6 w-24" />
        </CardFooter>
      </Card>
    ))}
  </>
);

const Page = () => {
  const { user } = useUser();

  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: () => getAllCourses(user?.id as string),
    enabled: !!user?.id,
  });

  const videos = [
    {
      id: "dBnniua6-oM",
      title: "I had a black dog, his name was depression",
      description:
        "A short animated video that explains what it feels like to live with depression.",
      channelTitle: "World Health Organization (WHO)",
      thumbnail: "https://img.youtube.com/vi/dBnniua6-oM/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=dBnniua6-oM",
    },
    {
      id: "XiCrniLQGYc",
      title: "The Science of Depression",
      description:
        "An in-depth look at the science behind depression and how it affects the brain.",
      channelTitle: "AsapSCIENCE",
      thumbnail: "https://img.youtube.com/vi/XiCrniLQGYc/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=XiCrniLQGYc",
    },
    {
      id: "z-IR48Mb3W0",
      title: "How to Help Someone with Depression",
      description: "Practical advice on how to support someone dealing with depression.",
      channelTitle: "Psych Hub",
      thumbnail: "https://img.youtube.com/vi/z-IR48Mb3W0/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=z-IR48Mb3W0",
    },
  ];

  const sampleCourse = {
    id: "temp-id",
    name: "Mental Health Essentials",
    description:
      "Learn the fundamentals of mental health and well-being with expert insights and practical techniques.",
    topic: "Mental Health",
    level: "Beginner",
    duration: "2 hours",
    flashcards: [],
    createdAt: new Date().toISOString(),
    type: "Self-paced",
    category: "Health & Wellness",
  };

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-foreground bg-clip-text text-2xl font-bold tracking-tight md:text-3xl">
              Your Courses
            </H3>
            <P className="text-muted-foreground">
              Your personalized and generated courses to help your mental well-being.
            </P>
          </div>
        </div>

        {isError && (
          <div className="my-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            Failed to load courses. Please try again later.
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 border-t">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* <Link href={`/course/${sampleCourse.id}`}>
                <Card className="relative flex flex-col h-full transition-all duration-300 hover:shadow-lg group">
                  <CardHeader className="pt-6 pb-4">
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">{sampleCourse.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sampleCourse.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0">
                    <p className="mb-4 line-clamp-3 text-muted-foreground">{sampleCourse.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4 text-primary/70" />
                        <span className="capitalize">{sampleCourse.level.toLowerCase()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart className="h-4 w-4 text-primary/70" />
                        <span className="capitalize">{sampleCourse.type.toLowerCase()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary/70" />
                        <span>{sampleCourse.duration}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 group-hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap"></div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {sampleCourse.topic}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                        {sampleCourse.category}
                      </span>
                    </div>
                  </CardFooter>
                  <div
                    className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/10 transition-all duration-200 group-hover:ring-primary/40"
                    aria-hidden="true"
                  />
                </Card>
              </Link> */}

              <CourseContent course={sampleCourse} videos={videos} />
            </>
          )}
        </div>
      </section>
    </BlurFade>
  );
};

export default Page;
