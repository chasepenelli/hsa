export interface Sound {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string | null;
  cover_url: string | null;
  play_url: string | null;
  usage_count: number;
  trajectory: "rising" | "falling" | "stable" | "new";
  growth_rate: number;
  rank: number;
  created_at: string;
  updated_at: string;
}

export interface SoundSnapshot {
  id: number;
  sound_id: string;
  snapshot_date: string;
  usage_count: number;
  rank: number;
  avg_views: number;
  avg_likes: number;
  avg_shares: number;
  avg_comments: number;
}

export interface ExampleVideo {
  id: number;
  sound_id: string;
  video_url: string;
  oembed_html: string | null;
  thumbnail_url: string | null;
  author_username: string | null;
  author_nickname: string | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  fetched_at: string;
}

export interface SoundHashtag {
  sound_id: string;
  hashtag: string;
}

export interface CollectionLog {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  source_used: string | null;
  sounds_collected: number;
  error_message: string | null;
}

export interface SoundWithDetails extends Sound {
  snapshots: SoundSnapshot[];
  example_videos: ExampleVideo[];
  hashtags: string[];
}

export interface DashboardStats {
  total_tracked: number;
  rising_count: number;
  falling_count: number;
  avg_growth: number;
  last_updated: string | null;
}

export interface CollectedSound {
  id: string;
  title: string;
  artist: string;
  duration: number;
  cover_url: string | null;
  play_url: string | null;
  usage_count: number;
  videos: CollectedVideo[];
  hashtags: string[];
}

export interface CollectedVideo {
  video_url: string;
  thumbnail_url: string | null;
  author_username: string | null;
  author_nickname: string | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}
