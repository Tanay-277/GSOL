import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { formatDistanceToNow } from "date-fns";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      courses: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mental Health Assessments</CardTitle>
            <CardDescription>Your recent mental health assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {user.assessments && user.assessments.length > 0 ? (
              <div className="space-y-4">
                {user.assessments.map((assessment) => (
                  <div key={assessment.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">
                          Assessment from{" "}
                          {formatDistanceToNow(new Date(assessment.createdAt), {
                            addSuffix: true,
                          })}
                        </h3>
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-500">Identified Issues:</h4>
                          <ul className="mt-1 list-inside list-disc text-sm">
                            {assessment.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard">View Courses</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/onboarding">Take New Assessment</Link>
                </Button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="mb-4 text-gray-500">You haven&apos;t taken any assessments yet.</p>
                <Button asChild>
                  <Link href="/onboarding">Take Assessment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Courses</CardTitle>
            <CardDescription>Courses based on your assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {user.courses && user.courses.length > 0 ? (
              <div className="space-y-4">
                {user.courses.map((course) => (
                  <div key={course.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{course.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                            {course.level}
                          </span>
                          {course.duration && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                              {course.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/course/${course.id}`}>View Course</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/course">View All Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="mb-4 text-gray-500">No courses recommended yet.</p>
                <Button asChild>
                  <Link href="/onboarding">Take Assessment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
