"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  BarChart as ReChartsBarChart,
  LineChart as ReChartsLineChart,
  PieChart as ReChartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Custom colors
const COLORS = {
  blue: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"],
  purple: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"],
  green: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
  red: ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
  amber: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
};

// Types
type DataPoint = { type: string; count: number };
type LevelDataPoint = { level: string; count: number };
type PerformanceDataPoint = { date: string; score: number };

// Custom tooltip components
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active: boolean;
  payload: Array<{ value: number; name?: string }>;
  label: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-background p-2 shadow-md">
        <p className="mb-1 font-medium">{`${label}`}</p>
        <p className="text-sm text-foreground">{`Count: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const PerformanceTooltip = ({
  active,
  payload,
  label,
}: {
  active: boolean;
  payload: Array<{ value: number; name?: string }>;
  label: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-background p-2 shadow-md">
        <p className="mb-1 font-medium">{`${label}`}</p>
        <p className="text-sm text-foreground">{`Score: ${payload[0].value}%`}</p>
      </div>
    );
  }

  return null;
};

// PieChart Component
export function CourseTypesChart({ data }: { data: DataPoint[] }) {
  // Calculate others if too many types
  const processedData = useMemo(() => {
    if (data.length <= 5) return data;

    // Sort by count and take top 4
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    const topData = sortedData.slice(0, 4);

    // Sum the rest
    const otherCount = sortedData.slice(4).reduce((sum, item) => sum + item.count, 0);

    if (otherCount > 0) {
      topData.push({ type: "Others", count: otherCount });
    }

    return topData;
  }, [data]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsPieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="type"
            label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip active={true} payload={[]} label={""} />} />
          <Legend />
        </ReChartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

// BarChart Component
export function CourseLevelsChart({ data }: { data: LevelDataPoint[] }) {
  // Sort data by difficulty level
  const sortedData = useMemo(() => {
    const levelOrder: Record<string, number> = {
      Easy: 1,
      Moderate: 2,
      Difficult: 3,
    };

    return [...data].sort((a, b) => {
      return (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
    });
  }, [data]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsBarChart data={sortedData} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="level" tick={{ fill: "var(--foreground)" }} />
          <YAxis tick={{ fill: "var(--foreground)" }} tickFormatter={(value) => `${value}`} />
          <Tooltip content={<CustomTooltip active={true} payload={[]} label={""} />} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Courses" />
        </ReChartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// LineChart Component
export function PerformanceChart({ data }: { data: PerformanceDataPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "var(--foreground)" }} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: "var(--foreground)" }}
          />
          <Tooltip content={<PerformanceTooltip active={true} payload={[]} label={""} />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            name="Average Score"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ReChartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
