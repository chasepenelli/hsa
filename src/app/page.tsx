"use client";

import { useSounds } from "@/hooks/useSounds";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCards } from "@/components/StatsCards";
import { SoundCard } from "@/components/SoundCard";
import { GrowthRateChart } from "@/components/GrowthRateChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { sounds, stats, isLoading, isError, mutate } = useSounds();

  if (isError) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-400">
            Failed to load dashboard
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Make sure the server is running and try refreshing the page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <DashboardHeader stats={stats} onRefresh={() => mutate()} />

      {isLoading ? (
        <DashboardSkeleton />
      ) : sounds.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {stats && <StatsCards stats={stats} />}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Top 10 Trending Sounds</h2>
            {sounds.map((sound) => (
              <SoundCard key={sound.id} sound={sound} />
            ))}
          </div>

          <GrowthRateChart sounds={sounds} />
        </>
      )}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
      <div className="text-4xl mb-4">&#9835;</div>
      <h2 className="text-lg font-semibold">No sounds tracked yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Click &quot;Refresh Now&quot; to collect the latest trending TikTok
        sounds, or wait for the daily automatic collection.
      </p>
    </div>
  );
}
