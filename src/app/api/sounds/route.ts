import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Sound, DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();

    const { data: sounds, error } = await db
      .from("sounds")
      .select("*")
      .order("rank", { ascending: true });

    if (error) throw error;

    const soundList = (sounds ?? []) as Sound[];

    // Get last collection time
    const { data: lastLog } = await db
      .from("collection_log")
      .select("completed_at")
      .eq("status", "success")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate stats
    const risingCount = soundList.filter((s) => s.trajectory === "rising").length;
    const fallingCount = soundList.filter((s) => s.trajectory === "falling").length;
    const avgGrowth =
      soundList.length > 0
        ? soundList.reduce((sum, s) => sum + s.growth_rate, 0) / soundList.length
        : 0;

    const stats: DashboardStats = {
      total_tracked: soundList.length,
      rising_count: risingCount,
      falling_count: fallingCount,
      avg_growth: Math.round(avgGrowth * 100) / 100,
      last_updated: lastLog?.completed_at ?? null,
    };

    // Get sparkline data for each sound (last 14 days)
    const soundsWithSparkline = await Promise.all(
      soundList.map(async (sound) => {
        const { data: snapshots } = await db
          .from("sound_snapshots")
          .select("snapshot_date, usage_count")
          .eq("sound_id", sound.id)
          .order("snapshot_date", { ascending: false })
          .limit(14);

        return {
          ...sound,
          sparkline: (snapshots ?? [])
            .reverse()
            .map((s: { usage_count: number }) => s.usage_count),
        };
      })
    );

    return NextResponse.json({ sounds: soundsWithSparkline, stats });
  } catch (err) {
    console.error("[api/sounds] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sounds" },
      { status: 500 }
    );
  }
}
