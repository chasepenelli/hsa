import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  }

  client = createClient(url, key);
  return client;
}

/**
 * Run this once to create all tables in Supabase.
 * Execute via: npx tsx scripts/setup-db.ts
 * Or run the SQL directly in the Supabase SQL editor.
 */
export const SCHEMA_SQL = `
-- Sounds table
CREATE TABLE IF NOT EXISTS sounds (
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
);

-- Sound snapshots (one per sound per day)
CREATE TABLE IF NOT EXISTS sound_snapshots (
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
);

-- Example videos
CREATE TABLE IF NOT EXISTS example_videos (
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
);

-- Sound hashtags (many-to-many)
CREATE TABLE IF NOT EXISTS sound_hashtags (
  sound_id TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  PRIMARY KEY (sound_id, hashtag)
);

-- Collection log
CREATE TABLE IF NOT EXISTS collection_log (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','partial','failed')),
  source_used TEXT,
  sounds_collected INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_sound_date ON sound_snapshots(sound_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_videos_sound ON example_videos(sound_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_sound ON sound_hashtags(sound_id);
CREATE INDEX IF NOT EXISTS idx_sounds_rank ON sounds(rank);
`;

export default getDb;
