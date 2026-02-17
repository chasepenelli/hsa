"use client";

import { useState, useEffect, useCallback } from "react";
import type { SoundWithDetails } from "@/lib/types";
import type { KeyedMutator } from "swr";

interface UseEnrichmentOptions {
  sound: SoundWithDetails | null;
  mutate: KeyedMutator<SoundWithDetails>;
}

function isStale(sound: SoundWithDetails): boolean {
  if (sound.usage_count === 0) return true;
  if (sound.example_videos.length === 0) return true;
  if (!sound.enriched_at) return true;

  const enrichedAt = new Date(sound.enriched_at).getTime();
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  return enrichedAt < sixHoursAgo;
}

export function useEnrichment({ sound, mutate }: UseEnrichmentOptions) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrich = useCallback(async () => {
    if (!sound || isEnriching) return;
    setIsEnriching(true);
    setError(null);

    try {
      const res = await fetch(`/api/enrich/${sound.id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Enrichment failed");
        return;
      }

      if (data.status === "enriched") {
        setEnriched(true);
        // Revalidate the sound detail data
        await mutate();
      }
      // "fresh" means no enrichment needed
    } catch {
      setError("Network error during enrichment");
    } finally {
      setIsEnriching(false);
    }
  }, [sound, isEnriching, mutate]);

  // Auto-trigger enrichment when sound data is stale
  useEffect(() => {
    if (sound && isStale(sound) && !isEnriching && !enriched && !error) {
      enrich();
    }
  }, [sound, isEnriching, enriched, error, enrich]);

  return { isEnriching, enriched, error };
}
