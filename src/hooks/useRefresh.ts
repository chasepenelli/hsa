"use client";

import { useState, useCallback } from "react";

export function useRefresh(onSuccess?: () => void) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Refresh failed");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Network error during refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [onSuccess]);

  return { refresh, isRefreshing, error };
}
