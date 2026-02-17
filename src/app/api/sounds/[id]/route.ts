import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Sound, SoundSnapshot, ExampleVideo, SoundWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { data: sound, error } = await db
      .from("sounds")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !sound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    const { data: snapshots } = await db
      .from("sound_snapshots")
      .select("*")
      .eq("sound_id", id)
      .order("snapshot_date", { ascending: true });

    const { data: exampleVideos } = await db
      .from("example_videos")
      .select("*")
      .eq("sound_id", id)
      .order("views", { ascending: false });

    const { data: hashtagRows } = await db
      .from("sound_hashtags")
      .select("hashtag")
      .eq("sound_id", id);

    const result: SoundWithDetails = {
      ...(sound as Sound),
      enriched_at: sound.enriched_at ?? null,
      snapshots: (snapshots ?? []) as SoundSnapshot[],
      example_videos: (exampleVideos ?? []) as ExampleVideo[],
      hashtags: (hashtagRows ?? []).map((h: { hashtag: string }) => h.hashtag),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/sounds/[id]] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sound" },
      { status: 500 }
    );
  }
}
