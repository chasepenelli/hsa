"use client";

import { use } from "react";
import Link from "next/link";
import { useSoundDetail } from "@/hooks/useSounds";
import { useEnrichment } from "@/hooks/useEnrichment";
import { TrajectoryBadge } from "@/components/TrajectoryBadge";
import { TrendChart } from "@/components/TrendChart";
import { VideoGrid } from "@/components/VideoGrid";
import { EngagementBreakdownChart } from "@/components/EngagementBreakdownChart";
import { EnrichmentBanner } from "@/components/EnrichmentBanner";
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
import { format, parseISO, formatDistanceToNow } from "date-fns";

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
  const { sound, isLoading, isError, mutate } = useSoundDetail(id);
  const { isEnriching, enriched, error: enrichError } = useEnrichment({
    sound,
    mutate,
  });

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </main>
    );
  }

  // Calculate average engagement from example videos
  const vids = sound.example_videos;
  const avgViews =
    vids.length > 0
      ? Math.round(vids.reduce((s, v) => s + v.views, 0) / vids.length)
      : 0;
  const avgLikes =
    vids.length > 0
      ? Math.round(vids.reduce((s, v) => s + v.likes, 0) / vids.length)
      : 0;
  const avgShares =
    vids.length > 0
      ? Math.round(vids.reduce((s, v) => s + v.shares, 0) / vids.length)
      : 0;
  const avgComments =
    vids.length > 0
      ? Math.round(vids.reduce((s, v) => s + v.comments, 0) / vids.length)
      : 0;

  // Rank history chart data
  const rankData = sound.snapshots.map((s) => ({
    date: format(parseISO(s.snapshot_date), "MMM d"),
    rank: s.rank,
  }));

  const enrichedAgo = sound.enriched_at
    ? formatDistanceToNow(new Date(sound.enriched_at), { addSuffix: true })
    : null;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{sound.title}</h1>
              <TrajectoryBadge trajectory={sound.trajectory} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{sound.artist}</span>
              <span className="text-muted-foreground/40">|</span>
              <span>Rank #{sound.rank}</span>
              <span className="text-muted-foreground/40">|</span>
              <span>{formatNumber(sound.usage_count)} videos</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={
                  sound.growth_rate > 0
                    ? "text-emerald-400 font-medium"
                    : sound.growth_rate < 0
                      ? "text-red-400 font-medium"
                      : "text-muted-foreground"
                }
              >
                {sound.growth_rate > 0 ? "+" : ""}
                {sound.growth_rate.toFixed(1)}% growth
              </span>
              {sound.duration > 0 && (
                <span className="text-muted-foreground">{sound.duration}s</span>
              )}
              {sound.genre && (
                <Badge variant="secondary" className="text-xs">
                  {sound.genre}
                </Badge>
              )}
              {enrichedAgo && (
                <span className="text-xs text-muted-foreground/60">
                  Enriched {enrichedAgo}
                </span>
              )}
            </div>
            {sound.play_url && (
              <audio controls className="mt-2 h-8 w-full max-w-xs">
                <source src={sound.play_url} />
              </audio>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enrichment Banner */}
      <EnrichmentBanner
        isEnriching={isEnriching}
        enriched={enriched}
        error={enrichError}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Videos</p>
              <p className="text-xl font-semibold">{formatNumber(sound.usage_count)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Views</p>
              <p className="text-xl font-semibold">{formatNumber(avgViews)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Likes</p>
              <p className="text-xl font-semibold">{formatNumber(avgLikes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Shares</p>
              <p className="text-xl font-semibold">{formatNumber(avgShares)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Comments</p>
              <p className="text-xl font-semibold">{formatNumber(avgComments)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Engagement Breakdown Chart */}
      <EngagementBreakdownChart videos={sound.example_videos} />

      {/* Hashtags */}
      {sound.hashtags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hashtags</CardTitle>
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

      {/* Top Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top Videos Using This Sound
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoGrid videos={sound.example_videos} />
        </CardContent>
      </Card>
    </main>
  );
}
