import { ApifyClient } from "apify-client";
import type { CollectedSound, CollectedVideo } from "./types";

export async function fetchTrendingSoundsApify(): Promise<CollectedSound[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN not set");

  const client = new ApifyClient({ token });

  const run = await client.actor("alien_force/tiktok-trending-sounds-tracker").call(
    { maxResults: 10 },
    { timeout: 120, memory: 256 }
  );

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error("Apify returned no results");
  }

  const sounds: CollectedSound[] = [];

  for (const item of items.slice(0, 10)) {
    const soundId = String(
      item.musicId ?? item.id ?? item.soundId ?? ""
    );
    if (!soundId) continue;

    const videos: CollectedVideo[] = [];
    const rawVideos = (item.videos ?? item.exampleVideos ?? []) as Record<string, unknown>[];

    for (const v of rawVideos.slice(0, 5)) {
      const stats = (v.stats ?? v.statistics ?? {}) as Record<string, number>;
      videos.push({
        video_url: String(v.url ?? v.videoUrl ?? v.webVideoUrl ?? ""),
        thumbnail_url: (v.thumbnail ?? v.thumbnailUrl ?? null) as string | null,
        author_username: (v.authorUsername ?? v.author ?? null) as string | null,
        author_nickname: (v.authorNickname ?? v.authorName ?? null) as string | null,
        views: Number(stats.plays ?? stats.views ?? v.plays ?? v.views ?? 0),
        likes: Number(stats.likes ?? stats.diggs ?? v.likes ?? v.diggs ?? 0),
        shares: Number(stats.shares ?? v.shares ?? 0),
        comments: Number(stats.comments ?? v.comments ?? 0),
      });
    }

    const rawHashtags = (item.hashtags ?? []) as (string | { name: string })[];
    const hashtags = rawHashtags.map((h) =>
      typeof h === "string" ? h : h.name
    );

    sounds.push({
      id: soundId,
      title: String(item.title ?? item.musicTitle ?? "Unknown"),
      artist: String(item.artist ?? item.authorName ?? item.author ?? "Unknown"),
      duration: Number(item.duration ?? 0),
      cover_url: (item.coverUrl ?? item.coverImage ?? item.cover ?? null) as string | null,
      play_url: (item.playUrl ?? item.musicUrl ?? null) as string | null,
      usage_count: Number(item.usageCount ?? item.videoCount ?? item.userCount ?? 0),
      videos,
      hashtags,
    });
  }

  if (sounds.length === 0) {
    throw new Error("Apify: No sounds could be parsed");
  }

  return sounds;
}
