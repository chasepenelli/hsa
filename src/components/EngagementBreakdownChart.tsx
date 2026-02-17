"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExampleVideo } from "@/lib/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function EngagementBreakdownChart({
  videos,
}: {
  videos: ExampleVideo[];
}) {
  if (videos.length === 0) return null;

  const data = videos.map((v, i) => ({
    name: v.author_username ? `@${v.author_username}` : `Video ${i + 1}`,
    Views: v.views,
    Likes: v.likes,
    Shares: v.shares,
    Comments: v.comments,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Engagement Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickFormatter={formatNumber}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value) => [formatNumber(Number(value))]}
            />
            <Legend />
            <Bar dataKey="Views" fill="hsl(210, 100%, 60%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Likes" fill="hsl(340, 80%, 60%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Shares" fill="hsl(160, 70%, 50%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Comments" fill="hsl(45, 90%, 55%)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
