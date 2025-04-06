"use client";

import { BlurFade } from "@/components/ui/blur";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, P } from "@/components/ui/typography";
import { getAllCourses } from "@/features/course/actions/get-all-course";
import { useUser } from "@/hooks/use-user";
import { BookOpen } from "@mynaui/icons-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Clock } from "lucide-react";
import Link from "next/link";

const LoadingSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="flex flex-col">
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

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">Your Courses</H3>
            <P className="text-muted-foreground">Your personalized and generated courses.</P>
          </div>
        </div>

        {isError && (
          <div className="py-8 text-center text-red-600">
            Failed to load courses. Please try again later.
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            courses?.map((course) => (
              <Link href={`/course/${course.id}`} key={course.id}>
                <Card key={course.id} className="relative flex flex-col shadow-none">
                  <CardHeader className="pt-6">
                    <CardTitle className="text-xl font-semibold">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0">
                    <p className="mb-4 line-clamp-2 text-muted-foreground">{course.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span className="capitalize">{course.level.toLowerCase()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart className="h-4 w-4" />
                        <span className="capitalize">{course.type.toLowerCase()}</span>
                      </div>

                      {course.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 hover:border-t-primary/40">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800">
                        {course.topic}
                      </span>
                      {course.category && (
                        <span className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </CardFooter>
                  <div
                    className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20 transition-all duration-200 hover:ring-foreground/40"
                    aria-hidden="true"
                  />
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </BlurFade>
  );
};

export default Page;
