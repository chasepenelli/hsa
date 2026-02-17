"use client";

export function EnrichmentBanner({
  isEnriching,
  enriched,
  error,
}: {
  isEnriching: boolean;
  enriched: boolean;
  error: string | null;
}) {
  if (!isEnriching && !enriched && !error) return null;

  if (isEnriching) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Fetching live data from TikTok...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (enriched) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        Data refreshed with live TikTok stats
      </div>
    );
  }

  return null;
}
