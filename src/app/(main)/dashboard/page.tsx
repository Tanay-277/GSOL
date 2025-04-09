"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, BookOpen, GraduationCap, Layout, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Chapter {
  id: string;
  completed: boolean;
}

interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  type: string;
  duration: string;
  chapters: Chapter[];
  progress: number;
  completedChapters: number;
  totalChapters: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/courses');
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Unable to load your courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Get recently added courses (last 3)
  const recentCourses = [...courses].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);
  
  // Get in-progress courses (not 100% complete)
  const inProgressCourses = courses.filter(course => course.progress > 0 && course.progress < 100);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/onboarding">
            <Button className="bg-primary hover:bg-primary/90">
              <GraduationCap className="mr-2 h-4 w-4" />
              Mental Health Check-In
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center">
            <Layout className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            All Courses
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">
                  {courses.length === 1 ? '1 course' : `${courses.length} courses`} in your library
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCourses.length}</div>
                <p className="text-xs text-muted-foreground">
                  {inProgressCourses.length === 1 ? '1 course' : `${inProgressCourses.length} courses`} in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.filter(course => course.progress === 100).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Courses you&apos;ve completed
                </p>
              </CardContent>
            </Card>
          </div>
          
          <h3 className="text-xl font-bold">Recent Courses</h3>
          
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-red-500">{error}</p>
              </CardContent>
            </Card>
          ) : recentCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center">No courses available. Take a mental health assessment to get personalized courses.</p>
                <div className="mt-4 flex justify-center">
                  <Link href="/onboarding">
                    <Button>Start Assessment</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{course.name}</CardTitle>
                      <Badge variant={
                        course.level === "Easy" ? "outline" : 
                        course.level === "Moderate" ? "secondary" : 
                        "destructive"
                      }>
                        {course.level}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{course.completedChapters}/{course.totalChapters} chapters</span>
                      <span>{course.progress}% complete</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>{course.duration || "Multiple chapters"}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/course/${course.id}`} className="w-full">
                      <Button className="w-full">
                        {course.progress === 0 ? "Start" : course.progress === 100 ? "Review" : "Continue"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* All Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Your Courses</h3>
            <Link href="/onboarding">
              <Button variant="outline">Take New Assessment</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <div className="px-6 pb-2">
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-red-500">{error}</p>
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">No courses found</h3>
                  <p className="mt-2 text-muted-foreground">Take a mental health assessment to generate personalized courses.</p>
                  <div className="mt-6">
                    <Link href="/onboarding">
                      <Button>Start Assessment</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                      <Badge variant={
                        course.level === "Easy" ? "outline" : 
                        course.level === "Moderate" ? "secondary" : 
                        "destructive"
                      }>
                        {course.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{course.type}</span>
                        <span>{course.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{course.completedChapters}/{course.totalChapters} chapters</span>
                      <span>{course.progress}% complete</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  <CardFooter>
                    <Link href={`/course/${course.id}`} className="w-full">
                      <Button className="w-full">
                        {course.progress === 0 ? "Start Course" : course.progress === 100 ? "Review Course" : "Continue Learning"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Name</div>
                <div>{session?.user?.name || "Not available"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Email</div>
                <div>{session?.user?.email || "Not available"}</div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/settings">
                <Button variant="outline">Settings</Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="ghost">Sign out</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
