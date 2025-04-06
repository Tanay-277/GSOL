"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Medal, Star, Trophy } from "lucide-react";

type Course = {
  id: string;
  name: string;
  type: string;
  level: string;
  score: number;
  completionRate: number;
  achievements: string[];
};

type AnalyticsDisplayProps = {
  courses: Course[];
};

export function AnalyticsDisplay({ courses }: AnalyticsDisplayProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Course</TableHead>
            <TableHead className="w-20 text-center">Score</TableHead>
            <TableHead className="w-24 text-center">Completion</TableHead>
            <TableHead>Achievements</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course, index) => (
            <TableRow key={course.id}>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">{getRankIcon(index)}</div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{course.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {course.type} · {course.level}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono tabular-nums">{course.score}%</TableCell>
              <TableCell className="text-center">
                <div
                  className="relative h-2 w-full rounded-full bg-muted"
                  title={`${course.completionRate}% completed`}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-primary"
                    style={{ width: `${course.completionRate}%` }}
                  />
                </div>
                <span className="text-xs">{course.completionRate}%</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {course.achievements.map((achievement) => (
                    <Badge key={achievement} variant="secondary" className="text-xs">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
