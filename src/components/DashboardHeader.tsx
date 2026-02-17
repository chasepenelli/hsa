"use client";

import { RefreshButton } from "./RefreshButton";
import type { DashboardStats } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export function DashboardHeader({
  stats,
  onRefresh,
}: {
  stats: DashboardStats | null;
  onRefresh: () => void;
}) {
  const lastUpdated = stats?.last_updated
    ? formatDistanceToNow(new Date(stats.last_updated + "Z"), {
        addSuffix: true,
      })
    : "Never";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          TikTok Trending Sounds
        </h1>
        <p className="text-muted-foreground mt-1">
          Top 10 trending sounds updated daily &middot; Last updated{" "}
          {lastUpdated}
        </p>
      </div>
      <RefreshButton onSuccess={onRefresh} />
    </div>
  );
}
