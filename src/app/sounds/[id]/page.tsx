"use client";

import { use } from "react";
import Link from "next/link";
import { useSoundDetail } from "@/hooks/useSounds";
import { TrajectoryBadge } from "@/components/TrajectoryBadge";
import { EngagementMetrics } from "@/components/EngagementMetrics";
import { TrendChart } from "@/components/TrendChart";
import { VideoCarousel } from "@/components/VideoCarousel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function SoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { sound, isLoading, isError } = useSoundDetail(id);

  if (isError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to dashboard
        </Link>
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-400">
            Sound not found
          </h2>
        </div>
      </main>
    );
  }

  if (isLoading || !sound) {
    return (
      <main className="mx-auto max-w-5xl p-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </main>
    );
  }

  // Calculate average engagement from example videos
  const avgViews =
    sound.example_videos.length > 0
      ? Math.round(
          sound.example_videos.reduce((s, v) => s + v.views, 0) /
            sound.example_videos.length
        )
      : 0;
  const avgLikes =
    sound.example_videos.length > 0
      ? Math.round(
          sound.example_videos.reduce((s, v) => s + v.likes, 0) /
            sound.example_videos.length
        )
      : 0;
  const avgShares =
    sound.example_videos.length > 0
      ? Math.round(
          sound.example_videos.reduce((s, v) => s + v.shares, 0) /
            sound.example_videos.length
        )
      : 0;
  const avgComments =
    sound.example_videos.length > 0
      ? Math.round(
          sound.example_videos.reduce((s, v) => s + v.comments, 0) /
            sound.example_videos.length
        )
      : 0;

  // Rank history chart data
  const rankData = sound.snapshots.map((s) => ({
    date: format(parseISO(s.snapshot_date), "MMM d"),
    rank: s.rank,
  }));

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to dashboard
      </Link>

      {/* Sound Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {sound.cover_url ? (
            <img
              src={sound.cover_url}
              alt={sound.title}
              className="h-24 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted text-4xl">
              &#9835;
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{sound.title}</h1>
              <TrajectoryBadge trajectory={sound.trajectory} />
            </div>
            <p className="text-muted-foreground">{sound.artist}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Rank #{sound.rank}</span>
              <span>{formatNumber(sound.usage_count)} videos</span>
              {sound.duration > 0 && <span>{sound.duration}s</span>}
              {sound.genre && <span>{sound.genre}</span>}
              <span
                className={
                  sound.growth_rate > 0
                    ? "text-emerald-400"
                    : sound.growth_rate < 0
                      ? "text-red-400"
                      : ""
                }
              >
                {sound.growth_rate > 0 ? "+" : ""}
                {sound.growth_rate.toFixed(1)}% growth
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <EngagementMetrics
        views={avgViews}
        likes={avgLikes}
        shares={avgShares}
        comments={avgComments}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart snapshots={sound.snapshots} title="Usage Over Time" />

        {/* Rank History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rank History</CardTitle>
          </CardHeader>
          <CardContent>
            {rankData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rankData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    reversed
                    domain={[1, 10]}
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
                    formatter={(value) => [`#${value}`, "Rank"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">
                Not enough data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hashtags */}
      {sound.hashtags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Associated Hashtags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sound.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoCarousel videos={sound.example_videos} />
        </CardContent>
      </Card>
    </main>
  );
}
