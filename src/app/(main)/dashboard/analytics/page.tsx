"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

const Dashboard = () => {
  const leaderboardData = [
    {
      rank: 1,
      courseName: "Advanced Machine Learning",
      score: 980,
      milestones: ["Research Publication", "Teaching Assistant"],
    },
    {
      rank: 2,
      courseName: "Full Stack Web Development",
      score: 875,
      milestones: ["Deployed Production App"],
    },
    {
      rank: 3,
      courseName: "Data Science Fundamentals",
      score: 860,
      milestones: ["Kaggle Competition Winner"],
    },
    {
      rank: 4,
      courseName: "Cloud Architecture",
      score: 845,
      milestones: ["AWS Certification"],
    },
    {
      rank: 5,
      courseName: "Cybersecurity Essentials",
      score: 830,
      milestones: ["CTF Competition Winner"],
    },
    {
      rank: 6,
      courseName: "Mobile App Development",
      score: 815,
      milestones: ["App Store Publication"],
    },
    {
      rank: 7,
      courseName: "UI/UX Design",
      score: 800,
      milestones: ["Design Portfolio"],
    },
    {
      rank: 8,
      courseName: "Blockchain Development",
      score: 785,
      milestones: ["Smart Contract Deployment"],
    },
    {
      rank: 9,
      courseName: "DevOps Engineering",
      score: 770,
      milestones: ["CI/CD Pipeline Implementation"],
    },
    {
      rank: 10,
      courseName: "Artificial Intelligence",
      score: 755,
      milestones: ["AI Model Deployment"],
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="m-3 w-full p-4">
      <Card className="mt-1 w-full pt-5">
        <CardHeader>
          <CardTitle>Course Leaderboard</CardTitle>
          <CardDescription>
            Completed courses and achievements!!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center">Rank</TableHead>
                  <TableHead className="w-1/3">Course</TableHead>
                  <TableHead className="w-24 text-center">Score</TableHead>
                  <TableHead className="w-1/3">Notable Achievements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((entry) => (
                  <TableRow key={entry.rank}>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {entry.rank > 3 && <span>{entry.rank}</span>}
                        {getRankIcon(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.courseName}
                    </TableCell>
                    <TableCell className="text-center">{entry.score}</TableCell>
                    <TableCell>
                      {entry.milestones.map((milestone) => (
                        <Badge
                          key={milestone}
                          variant="secondary"
                          className="mb-1 mr-1"
                        >
                          {milestone}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
