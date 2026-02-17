import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS sounds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT 'Unknown',
    duration INTEGER NOT NULL DEFAULT 0,
    genre TEXT,
    cover_url TEXT,
    play_url TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    trajectory TEXT NOT NULL DEFAULT 'new' CHECK(trajectory IN ('rising','falling','stable','new')),
    growth_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sound_snapshots (
    id SERIAL PRIMARY KEY,
    sound_id TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    avg_views DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_likes DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_shares DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_comments DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE(sound_id, snapshot_date)
  )`,
  `CREATE TABLE IF NOT EXISTS example_videos (
    id SERIAL PRIMARY KEY,
    sound_id TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    oembed_html TEXT,
    thumbnail_url TEXT,
    author_username TEXT,
    author_nickname TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sound_hashtags (
    sound_id TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,
    PRIMARY KEY (sound_id, hashtag)
  )`,
  `CREATE TABLE IF NOT EXISTS collection_log (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','partial','failed')),
    source_used TEXT,
    sounds_collected INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
  )`,
];

export async function POST() {
  try {
    const db = getDb();
    const results: string[] = [];

    for (const sql of TABLES_SQL) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
      const { error } = await db.rpc("exec_sql", { sql_query: sql });

      if (error) {
        // If rpc doesn't exist, we can't auto-create tables via the REST API.
        // The user needs to run the SQL in the Supabase dashboard.
        results.push(`${tableName}: ${error.message}`);
      } else {
        results.push(`${tableName}: OK`);
      }
    }

    return NextResponse.json({
      message: "Schema setup attempted",
      results,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Setup failed. Please run the SQL manually in the Supabase SQL Editor.",
        details: err instanceof Error ? err.message : String(err),
        sql: "Run: npx tsx scripts/setup-db.ts to get the full SQL",
      },
      { status: 500 }
    );
  }
}
