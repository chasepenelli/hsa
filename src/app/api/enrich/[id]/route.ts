import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { enrichSound } from "@/lib/tiktok-enricher";
import { fetchOEmbedBatch } from "@/lib/oembed";
import {
  calculateTrajectory,
  calculateGrowthRate,
} from "@/lib/trending-calculator";
import type { SoundSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Look up sound
    const { data: sound, error } = await db
      .from("sounds")
      .select("id, title, rank, enriched_at")
      .eq("id", id)
      .single();

    if (error || !sound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    // Skip if enriched less than 6 hours ago
    if (sound.enriched_at) {
      const enrichedAt = new Date(sound.enriched_at).getTime();
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      if (enrichedAt > sixHoursAgo) {
        return NextResponse.json({
          status: "fresh",
          enriched_at: sound.enriched_at,
        });
      }
    }

    // Run enrichment
    const result = await enrichSound(id, sound.title);

    if (!result) {
      return NextResponse.json(
        { error: "Enrichment failed — could not fetch TikTok data" },
        { status: 502 }
      );
    }

    // Update usage_count on the sound
    await db
      .from("sounds")
      .update({
        usage_count: result.usage_count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Delete old example videos and insert new ones
    await db.from("example_videos").delete().eq("sound_id", id);

    if (result.videos.length > 0) {
      // Fetch oEmbed HTML in parallel for all videos
      const videoUrls = result.videos.map((v) => v.video_url);
      const oembedMap = await fetchOEmbedBatch(videoUrls);

      const videoRows = result.videos.map((v) => ({
        sound_id: id,
        video_url: v.video_url,
        oembed_html: oembedMap.get(v.video_url) ?? null,
        thumbnail_url: v.thumbnail_url,
        author_username: v.author_username,
        author_nickname: v.author_nickname,
        author_avatar_url: v.author_avatar_url,
        description: v.description,
        create_time: v.create_time,
        views: v.views,
        likes: v.likes,
        shares: v.shares,
        comments: v.comments,
        fetched_at: new Date().toISOString(),
      }));

      await db.from("example_videos").insert(videoRows);
    }

    // Upsert hashtags
    if (result.hashtags.length > 0) {
      // Delete existing and re-insert
      await db.from("sound_hashtags").delete().eq("sound_id", id);
      const hashtagRows = result.hashtags.map((tag) => ({
        sound_id: id,
        hashtag: tag,
      }));
      await db.from("sound_hashtags").upsert(hashtagRows, {
        onConflict: "sound_id,hashtag",
      });
    }

    // Update today's snapshot with enriched data
    const today = new Date().toISOString().slice(0, 10);

    // Calculate avg engagement from enriched videos
    const vids = result.videos;
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

    await db.from("sound_snapshots").upsert(
      {
        sound_id: id,
        snapshot_date: today,
        usage_count: result.usage_count,
        rank: sound.rank ?? 0,
        avg_views: avgViews,
        avg_likes: avgLikes,
        avg_shares: avgShares,
        avg_comments: avgComments,
      },
      { onConflict: "sound_id,snapshot_date" }
    );

    // Recalculate trajectory and growth rate
    const { data: snapshots } = await db
      .from("sound_snapshots")
      .select("*")
      .eq("sound_id", id)
      .order("snapshot_date", { ascending: true });

    const snapshotList = (snapshots ?? []) as SoundSnapshot[];
    const trajectory = calculateTrajectory(snapshotList);
    const growthRate = calculateGrowthRate(snapshotList);

    const now = new Date().toISOString();
    await db
      .from("sounds")
      .update({
        trajectory,
        growth_rate: growthRate,
        enriched_at: now,
        updated_at: now,
      })
      .eq("id", id);

    return NextResponse.json({
      status: "enriched",
      enriched_at: now,
      usage_count: result.usage_count,
      videos_count: result.videos.length,
      hashtags_count: result.hashtags.length,
    });
  } catch (err) {
    console.error("[api/enrich] Error:", err);
    return NextResponse.json(
      { error: "Enrichment failed" },
      { status: 500 }
    );
  }
}
