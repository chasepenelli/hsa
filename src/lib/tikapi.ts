import TikAPI from "tikapi";
import type { CollectedSound, CollectedVideo } from "./types";

let api: ReturnType<typeof TikAPI> | null = null;

function getApi() {
  if (api) return api;
  const key = process.env.TIKAPI_KEY;
  if (!key) throw new Error("TIKAPI_KEY not set");
  api = TikAPI(key);
  return api;
}

export async function fetchTrendingSounds(): Promise<CollectedSound[]> {
  const tikapi = getApi();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (tikapi.public as any).explore({
    count: 10,
  });

  const json = response?.json ?? {};
  const musicList = json.music_list ?? json.aweme_list ?? json.musics ?? [];

  if (!Array.isArray(musicList) || musicList.length === 0) {
    throw new Error("TikAPI returned no music results");
  }

  const sounds: CollectedSound[] = [];

  for (const item of musicList.slice(0, 10)) {
    const music = item.music ?? item;
    const soundId = String(music.id ?? music.mid ?? "");
    if (!soundId) continue;

    let videos: CollectedVideo[] = [];
    try {
      videos = await fetchSoundVideos(soundId);
    } catch {
      // Continue without videos
    }

    const hashtags: string[] = [];

    sounds.push({
      id: soundId,
      title: music.title ?? "Unknown",
      artist: music.author ?? music.owner_nickname ?? "Unknown",
      duration: music.duration ?? 0,
      cover_url: music.cover_large?.url_list?.[0] ?? music.cover_medium?.url_list?.[0] ?? null,
      play_url: music.play_url?.url_list?.[0] ?? null,
      usage_count: music.user_count ?? music.video_count ?? 0,
      videos,
      hashtags,
    });
  }

  if (sounds.length === 0) {
    throw new Error("TikAPI: No sounds could be parsed");
  }

  return sounds;
}

async function fetchSoundVideos(soundId: string): Promise<CollectedVideo[]> {
  const tikapi = getApi();
  const videos: CollectedVideo[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (tikapi.public as any).music({
      id: soundId,
    });

    const json = response?.json ?? {};
    const itemList = json.aweme_list ?? json.itemList ?? [];

    for (const item of itemList.slice(0, 5)) {
      const stats = item.statistics ?? item.stats ?? {};
      videos.push({
        video_url: `https://www.tiktok.com/@${item.author?.unique_id ?? "user"}/video/${item.aweme_id ?? item.id}`,
        thumbnail_url: item.video?.cover?.url_list?.[0] ?? item.video?.dynamicCover ?? null,
        author_username: item.author?.unique_id ?? null,
        author_nickname: item.author?.nickname ?? null,
        views: stats.play_count ?? stats.playCount ?? 0,
        likes: stats.digg_count ?? stats.diggCount ?? 0,
        shares: stats.share_count ?? stats.shareCount ?? 0,
        comments: stats.comment_count ?? stats.commentCount ?? 0,
      });
    }
  } catch {
    // Video fetch is best-effort
  }

  return videos;
}
