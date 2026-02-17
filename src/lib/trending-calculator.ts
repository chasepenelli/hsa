import type { SoundSnapshot } from "./types";

export type Trajectory = "rising" | "falling" | "stable" | "new";

export function calculateTrajectory(
  snapshots: SoundSnapshot[]
): Trajectory {
  if (snapshots.length < 2) return "new";

  // Sort by date ascending
  const sorted = [...snapshots].sort(
    (a, b) => a.snapshot_date.localeCompare(b.snapshot_date)
  );

  // Use last 7 snapshots or whatever we have
  const recent = sorted.slice(-7);

  if (recent.length < 2) return "new";

  // Calculate linear trend using simple regression
  const n = recent.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recent[i].usage_count;
    sumXY += i * recent[i].usage_count;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgUsage = sumY / n;

  // Normalize slope relative to average usage
  const normalizedSlope = avgUsage > 0 ? slope / avgUsage : 0;

  if (normalizedSlope > 0.05) return "rising";
  if (normalizedSlope < -0.05) return "falling";
  return "stable";
}

export function calculateGrowthRate(
  snapshots: SoundSnapshot[]
): number {
  if (snapshots.length < 2) return 0;

  const sorted = [...snapshots].sort(
    (a, b) => a.snapshot_date.localeCompare(b.snapshot_date)
  );

  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  if (oldest.usage_count === 0) {
    return newest.usage_count > 0 ? 100 : 0;
  }

  return (
    ((newest.usage_count - oldest.usage_count) / oldest.usage_count) * 100
  );
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  "Hip Hop": ["rap", "hip hop", "trap", "drill", "hiphop"],
  Pop: ["pop", "dance pop", "synth"],
  "R&B": ["r&b", "rnb", "soul", "r & b"],
  Electronic: ["edm", "electronic", "house", "techno", "dubstep", "bass"],
  Latin: ["reggaeton", "latin", "bachata", "salsa", "cumbia"],
  Country: ["country", "western", "nashville"],
  Rock: ["rock", "punk", "metal", "grunge", "alternative"],
  "K-Pop": ["kpop", "k-pop", "korean"],
  Afrobeats: ["afrobeat", "afro", "amapiano"],
  Indie: ["indie", "lo-fi", "lofi"],
};

export function classifyGenre(
  title: string,
  artist: string
): string | null {
  const text = `${title} ${artist}`.toLowerCase();

  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return genre;
    }
  }

  return null;
}
