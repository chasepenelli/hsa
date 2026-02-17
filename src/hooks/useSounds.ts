"use client";

import useSWR from "swr";
import type { Sound, DashboardStats, SoundWithDetails } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SoundsResponse {
  sounds: (Sound & { sparkline: number[] })[];
  stats: DashboardStats;
}

export function useSounds() {
  const { data, error, isLoading, mutate } = useSWR<SoundsResponse>(
    "/api/sounds",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    sounds: data?.sounds ?? [],
    stats: data?.stats ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useSoundDetail(id: string) {
  const { data, error, isLoading } = useSWR<SoundWithDetails>(
    `/api/sounds/${id}`,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    sound: data ?? null,
    isLoading,
    isError: !!error,
  };
}
