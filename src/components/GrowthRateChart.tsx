"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sound } from "@/lib/types";

export function GrowthRateChart({ sounds }: { sounds: Sound[] }) {
  const data = sounds.map((s) => ({
    name: s.title.length > 20 ? s.title.slice(0, 20) + "..." : s.title,
    growth: Math.round(s.growth_rate * 100) / 100,
    fullName: s.title,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Growth Rate Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
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
              formatter={(value) => [`${Number(value).toFixed(2)}%`, "Growth Rate"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ""
              }
            />
            <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.growth > 0
                      ? "hsl(152, 69%, 53%)"
                      : "hsl(0, 84%, 60%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
