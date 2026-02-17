import type { CollectedSound } from "./types";

const CREATIVE_CENTER_URL =
  "https://ads.tiktok.com/business/creativecenter/music/pc/en";

export async function fetchTrendingSoundsCreativeCenter(): Promise<
  CollectedSound[]
> {
  const response = await fetch(CREATIVE_CENTER_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Creative Center returned ${response.status}`);
  }

  const html = await response.text();

  // Extract __NEXT_DATA__ JSON from the SSR page
  const match = html.match(
    /\{"props":\{"pageProps":(\{[\s\S]*?\})\s*,\s*"__N_SSP"/
  );

  let pageProps: Record<string, unknown>;

  if (match) {
    try {
      pageProps = JSON.parse(match[1]);
    } catch {
      throw new Error("Creative Center: Failed to parse pageProps");
    }
  } else {
    // Try broader pattern
    const broader = html.match(/"musicList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
    if (!broader) {
      throw new Error("Creative Center: Could not find musicList in page");
    }
    try {
      const musicList = JSON.parse(broader[1]);
      pageProps = { musicList };
    } catch {
      throw new Error("Creative Center: Failed to parse musicList");
    }
  }

  const musicList = (pageProps.musicList ?? []) as Record<string, unknown>[];

  if (!Array.isArray(musicList) || musicList.length === 0) {
    throw new Error("Creative Center: musicList is empty");
  }

  const sounds: CollectedSound[] = [];

  for (const item of musicList.slice(0, 10)) {
    const soundId = String(
      item.clipId ?? item.musicId ?? item.id ?? ""
    );
    if (!soundId) continue;

    sounds.push({
      id: soundId,
      title: String(item.title ?? "Unknown"),
      artist: String(item.singer ?? item.author ?? "Unknown"),
      duration: Number(item.duration ?? 0),
      cover_url: (item.posterUrl ?? item.cover ?? null) as string | null,
      play_url: (item.musicUrl ?? item.detail ?? null) as string | null,
      usage_count: Number(item.usage_amount ?? item.videoCount ?? 0),
      videos: [],
      hashtags: [],
    });
  }

  if (sounds.length === 0) {
    throw new Error("Creative Center: No sounds could be parsed");
  }

  return sounds;
}
