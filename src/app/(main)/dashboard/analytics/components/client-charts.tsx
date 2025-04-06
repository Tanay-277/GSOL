"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsDisplay } from "./analytics-display";
import { CourseLevelsChart, CourseTypesChart, PerformanceChart } from "./charts";

type ChartProps = {
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: any[];
  chartType: "type" | "level" | "performance";
};

export function ClientChart({ title, description, chartData, chartType }: ChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartType === "type" && <CourseTypesChart data={chartData} />}
        {chartType === "level" && <CourseLevelsChart data={chartData} />}
        {chartType === "performance" && <PerformanceChart data={chartData} />}
      </CardContent>
    </Card>
  );
}

type TableProps = {
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  courses: any[];
};

export function ClientTable({ title, description, courses }: TableProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <AnalyticsDisplay courses={courses} />
      </CardContent>
    </Card>
  );
}
