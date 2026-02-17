import { getDb } from "./db";
import { fetchTrendingSounds as fetchTikAPI } from "./tikapi";
import { fetchTrendingSoundsApify } from "./apify-fallback";
import { fetchOEmbedBatch } from "./oembed";
import {
  calculateTrajectory,
  calculateGrowthRate,
  classifyGenre,
} from "./trending-calculator";
import type { CollectedSound, SoundSnapshot } from "./types";
import { format } from "date-fns";

export async function collectTrendingSounds(): Promise<{
  success: boolean;
  source: string;
  count: number;
  error?: string;
}> {
  const db = getDb();
  const today = format(new Date(), "yyyy-MM-dd");

  // Start collection log
  const { data: logRow } = await db
    .from("collection_log")
    .insert({ status: "running" })
    .select("id")
    .single();
  const logId = logRow?.id;

  let sounds: CollectedSound[] = [];
  let sourceUsed = "";

  // Cascade: TikAPI → Apify
  const sources = [
    { name: "tikapi", fn: fetchTikAPI },
    { name: "apify", fn: fetchTrendingSoundsApify },
  ];

  for (const source of sources) {
    try {
      console.log(`[collector] Trying ${source.name}...`);
      sounds = await source.fn();
      sourceUsed = source.name;
      console.log(
        `[collector] ${source.name} returned ${sounds.length} sounds`
      );
      break;
    } catch (err) {
      console.warn(
        `[collector] ${source.name} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  if (sounds.length === 0) {
    if (logId) {
      await db
        .from("collection_log")
        .update({
          completed_at: new Date().toISOString(),
          status: "failed",
          error_message: "All sources failed",
        })
        .eq("id", logId);
    }

    return {
      success: false,
      source: "none",
      count: 0,
      error: "All data sources failed",
    };
  }

  // Collect all video URLs for oEmbed batch
  const allVideoUrls: string[] = [];
  for (const sound of sounds) {
    for (const video of sound.videos) {
      if (video.video_url) allVideoUrls.push(video.video_url);
    }
  }

  console.log(`[collector] Fetching oEmbed for ${allVideoUrls.length} videos...`);
  const oembedMap = await fetchOEmbedBatch(allVideoUrls);

  // Persist each sound
  for (let i = 0; i < sounds.length; i++) {
    const sound = sounds[i];
    const rank = i + 1;

    // Get existing snapshots for trajectory calculation
    const { data: existingSnapshots } = await db
      .from("sound_snapshots")
      .select("*")
      .eq("sound_id", sound.id)
      .order("snapshot_date", { ascending: true });

    // Calculate avg engagement from videos
    const avgViews =
      sound.videos.length > 0
        ? sound.videos.reduce((s, v) => s + v.views, 0) / sound.videos.length
        : 0;
    const avgLikes =
      sound.videos.length > 0
        ? sound.videos.reduce((s, v) => s + v.likes, 0) / sound.videos.length
        : 0;
    const avgShares =
      sound.videos.length > 0
        ? sound.videos.reduce((s, v) => s + v.shares, 0) / sound.videos.length
        : 0;
    const avgComments =
      sound.videos.length > 0
        ? sound.videos.reduce((s, v) => s + v.comments, 0) / sound.videos.length
        : 0;

    // Build snapshot list for trajectory calculation
    const allSnapshots: SoundSnapshot[] = [
      ...((existingSnapshots as SoundSnapshot[]) ?? []),
      {
        id: 0,
        sound_id: sound.id,
        snapshot_date: today,
        usage_count: sound.usage_count,
        rank,
        avg_views: avgViews,
        avg_likes: avgLikes,
        avg_shares: avgShares,
        avg_comments: avgComments,
      },
    ];

    const trajectory = calculateTrajectory(allSnapshots);
    const growthRate = calculateGrowthRate(allSnapshots);
    const genre = classifyGenre(sound.title, sound.artist);

    // Upsert sound
    await db.from("sounds").upsert(
      {
        id: sound.id,
        title: sound.title,
        artist: sound.artist,
        duration: sound.duration,
        genre,
        cover_url: sound.cover_url,
        play_url: sound.play_url,
        usage_count: sound.usage_count,
        trajectory,
        growth_rate: growthRate,
        rank,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // Upsert snapshot
    await db.from("sound_snapshots").upsert(
      {
        sound_id: sound.id,
        snapshot_date: today,
        usage_count: sound.usage_count,
        rank,
        avg_views: avgViews,
        avg_likes: avgLikes,
        avg_shares: avgShares,
        avg_comments: avgComments,
      },
      { onConflict: "sound_id,snapshot_date" }
    );

    // Replace example videos
    await db.from("example_videos").delete().eq("sound_id", sound.id);

    const videoRows = sound.videos.slice(0, 5).map((video) => ({
      sound_id: sound.id,
      video_url: video.video_url,
      oembed_html: oembedMap.get(video.video_url) ?? null,
      thumbnail_url: video.thumbnail_url,
      author_username: video.author_username,
      author_nickname: video.author_nickname,
      views: video.views,
      likes: video.likes,
      shares: video.shares,
      comments: video.comments,
    }));

    if (videoRows.length > 0) {
      await db.from("example_videos").insert(videoRows);
    }

    // Insert hashtags
    for (const hashtag of sound.hashtags) {
      await db
        .from("sound_hashtags")
        .upsert(
          { sound_id: sound.id, hashtag },
          { onConflict: "sound_id,hashtag" }
        );
    }
  }

  // Update collection log
  if (logId) {
    await db
      .from("collection_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "success",
        source_used: sourceUsed,
        sounds_collected: sounds.length,
      })
      .eq("id", logId);
  }

  console.log(
    `[collector] Done. ${sounds.length} sounds persisted via ${sourceUsed}.`
  );

  return {
    success: true,
    source: sourceUsed,
    count: sounds.length,
  };
}
