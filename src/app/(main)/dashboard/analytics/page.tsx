import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { getAnalyticsData } from "./actions";
import { ClientChart, ClientTable } from "./components/client-charts";

export default async function AnalyticsPage() {
  return (
    <div className="m-3 w-full p-4">
      <h1 className="mb-6 text-3xl font-bold">Course Analytics</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<MetricCardSkeleton />}>
          <TotalCoursesCard />
        </Suspense>

        <Suspense fallback={<MetricCardSkeleton />}>
          <TotalQuizzesCard />
        </Suspense>

        <Suspense fallback={<MetricCardSkeleton />}>
          <AverageScoreCard />
        </Suspense>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <CoursesByTypeChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <CoursesByLevelChart />
        </Suspense>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <QuizPerformanceChart />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <TopPerformingCoursesTable />
        </Suspense>
      </div>
    </div>
  );
}

// Metric Cards
async function TotalCoursesCard() {
  const data = await getAnalyticsData();
  return (
    <MetricCard
      title="Total Courses"
      description="Courses created and enrolled"
      value={data.totalCourses}
      badges={[{ label: `${data.courseTypesCount} types`, variant: "outline" }]}
      footer={`Across ${data.topicsCount} topics`}
    />
  );
}

async function TotalQuizzesCard() {
  const data = await getAnalyticsData();
  return (
    <MetricCard
      title="Quiz Attempts"
      description="Total quiz attempts across courses"
      value={data.totalQuizAttempts}
      badges={[
        { label: `${data.totalQuizzes} quizzes`, variant: "outline" },
        {
          label: `${data.quizCompletionRate}% completion rate`,
          variant: data.quizCompletionRate >= 70 ? "outline" : "secondary",
        },
      ]}
    />
  );
}

async function AverageScoreCard() {
  const data = await getAnalyticsData();
  const badgeLabel =
    data.averageQuizScore >= 80
      ? "Excellent"
      : data.averageQuizScore >= 60
        ? "Good"
        : "Needs Improvement";
  const badgeVariant =
    data.averageQuizScore >= 80
      ? "outline"
      : data.averageQuizScore >= 60
        ? "secondary"
        : "destructive";

  return (
    <MetricCard
      title="Average Quiz Score"
      description="Overall quiz performance"
      value={`${data.averageQuizScore}%`}
      badges={[{ label: badgeLabel, variant: badgeVariant }]}
    />
  );
}

// Charts
async function CoursesByTypeChart() {
  const data = await getAnalyticsData();
  return (
    <ChartCard
      title="Courses by Type"
      description="Distribution of course types"
      chartData={data.coursesByType}
      chartType="type"
    />
  );
}

async function CoursesByLevelChart() {
  const data = await getAnalyticsData();
  return (
    <ChartCard
      title="Courses by Difficulty Level"
      description="Distribution across difficulty levels"
      chartData={data.coursesByLevel}
      chartType="level"
    />
  );
}

async function QuizPerformanceChart() {
  const data = await getAnalyticsData();
  return (
    <ChartCard
      title="Quiz Performance Over Time"
      description="Average score on latest quizzes"
      chartData={data.quizPerformanceOverTime}
      chartType="performance"
    />
  );
}

// Table
async function TopPerformingCoursesTable() {
  const data = await getAnalyticsData();
  return (
    <TableCard
      title="Top Performing Courses"
      description="Courses with highest completion rates"
      courses={data.topPerformingCourses}
    />
  );
}

// Skeletons
function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="p-6 pt-2">
        <Skeleton className="h-10 w-20" />
        <div className="mt-2 flex items-center space-x-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="p-6 pt-0">
        <Skeleton className="h-80 w-full rounded-md" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
        </div>
      </div>
    </div>
  );
}

// Components for server-rendered data
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  description: string;
  value: string | number;
  badges?: Array<{
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }>;
  footer?: string;
};

function MetricCard({ title, description, value, badges = [], footer }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        <div className="mt-2 flex items-center space-x-2">
          {badges.map((badge, i) => (
            <Badge key={i} variant={badge.variant} className="text-xs">
              {badge.label}
            </Badge>
          ))}
          {footer && <span className="text-sm text-muted-foreground">{footer}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

type ChartCardProps = {
  title: string;
  description: string;
  chartData: unknown[];
  chartType: "type" | "level" | "performance";
};

function ChartCard({ title, description, chartData, chartType }: ChartCardProps) {
  return (
    <ClientChart
      title={title}
      description={description}
      chartData={chartData}
      chartType={chartType}
    />
  );
}

type TableCardProps = {
  title: string;
  description: string;
  courses: unknown[];
};

function TableCard({ title, description, courses }: TableCardProps) {
  return <ClientTable title={title} description={description} courses={courses} />;
}
