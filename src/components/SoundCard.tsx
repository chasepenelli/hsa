"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TrajectoryBadge } from "./TrajectoryBadge";
import type { Sound } from "@/lib/types";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

interface SoundCardProps {
  sound: Sound & { sparkline: number[] };
}

export function SoundCard({ sound }: SoundCardProps) {
  const sparklineData = sound.sparkline.map((value, i) => ({
    i,
    value,
  }));

  const sparklineColor =
    sound.trajectory === "rising"
      ? "#34d399"
      : sound.trajectory === "falling"
        ? "#f87171"
        : "#60a5fa";

  return (
    <Link href={`/sounds/${sound.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Rank */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {sound.rank}
          </div>

          {/* Cover Art */}
          {sound.cover_url ? (
            <img
              src={sound.cover_url}
              alt={sound.title}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
              ♫
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{sound.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {sound.artist}
              {sound.genre && (
                <span className="ml-2 text-xs opacity-60">
                  &middot; {sound.genre}
                </span>
              )}
            </p>
          </div>

          {/* Sparkline */}
          {sparklineData.length > 1 && (
            <div className="hidden w-24 sm:block">
              <ResponsiveContainer width="100%" height={32}>
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sparklineColor}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats */}
          <div className="hidden shrink-0 text-right sm:block">
            <p className="font-semibold">{formatNumber(sound.usage_count)}</p>
            <p className="text-xs text-muted-foreground">videos</p>
          </div>

          {/* Growth */}
          <div className="hidden shrink-0 text-right md:block">
            <p
              className={`text-sm font-medium ${
                sound.growth_rate > 0
                  ? "text-emerald-400"
                  : sound.growth_rate < 0
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {sound.growth_rate > 0 ? "+" : ""}
              {sound.growth_rate.toFixed(1)}%
            </p>
          </div>

          {/* Trajectory */}
          <TrajectoryBadge trajectory={sound.trajectory} />
        </CardContent>
      </Card>
    </Link>
  );
}
