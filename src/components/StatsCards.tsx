"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: "Total Tracked",
      value: stats.total_tracked,
      color: "text-primary",
    },
    {
      label: "Rising",
      value: stats.rising_count,
      color: "text-emerald-400",
    },
    {
      label: "Falling",
      value: stats.falling_count,
      color: "text-red-400",
    },
    {
      label: "Avg Growth",
      value: `${stats.avg_growth > 0 ? "+" : ""}${stats.avg_growth}%`,
      color:
        stats.avg_growth > 0
          ? "text-emerald-400"
          : stats.avg_growth < 0
            ? "text-red-400"
            : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
