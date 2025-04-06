"use client";

import { BlurFade } from "@/components/ui/blur";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { H3, P } from "@/components/ui/typography";
import Link from "next/link";
import { useEffect } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DashboardData } from "./actions/get-dashboard-data";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];

export function DashboardClient({ data }: { data: DashboardData }) {
  console.log(localStorage.getItem("mentalHealthAssessments") || "[]");

  useEffect(() => {
    const assessments = JSON.parse(localStorage.getItem("mentalHealthAssessments") || "[]");
    const lastassessment = Array.isArray(assessments)
      ? assessments.pop()
      : "No previous assessment found";

    console.log(lastassessment);

    const fetchData = async () => {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: lastassessment,
      });
      const responseData = await response.json();
      console.log(responseData);
    };
    fetchData();
  }, [data.recentCourses]);

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">Your Dashboard</H3>
            <P className="text-muted-foreground">
              Welcome to your dashboard. Here you can track your progress across {data.totalCourses}{" "}
              courses.
            </P>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="relative border-none shadow-none">
              <CardHeader className="pt-6">
                <CardTitle>Course Types</CardTitle>
                <CardDescription>Distribution of your courses by type</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.coursesByType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.coursesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20" />
            </Card>

            <Card className="relative border-none shadow-none">
              <CardHeader className="pt-6">
                <CardTitle>Difficulty Levels</CardTitle>
                <CardDescription>Your courses by difficulty</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.coursesByLevel}>
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20" />
            </Card>

            <Card className="relative border-none shadow-none">
              <CardHeader className="pt-6">
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Courses</span>
                    <span className="text-2xl font-bold">{data.totalCourses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Types</span>
                    <span className="text-2xl font-bold">{data.coursesByType.length}</span>
                  </div>
                </div>
              </CardContent>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20" />
            </Card>
          </div>

          <Separator className="my-2" />

          <Card className="relative border-none px-0 shadow-none">
            <CardHeader className="px-0">
              <div className="flex flex-col space-y-2 text-left">
                <H3 className="text-2xl font-bold tracking-tight md:text-3xl">Recent Courses</H3>
                <P className="text-muted-foreground">Your most recent courses</P>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              {data.recentCourses.map((course) => (
                <div className="relative rounded-lg p-4" key={course.id}>
                  <Link href={`/course/${course.id}`} className="mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">{course.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {course.type} • {course.level}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{course.progress}%</p>
                        <p className="text-xs text-muted-foreground">
                          {course.completedChapters} of {course.totalChapters} chapters
                        </p>
                      </div>
                    </div>
                    <Progress value={course.progress} className="mt-2 w-full" />
                    <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/20" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </BlurFade>
  );
}
