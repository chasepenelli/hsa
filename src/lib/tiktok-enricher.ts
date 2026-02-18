export interface EnrichedVideo {
  video_url: string;
  thumbnail_url: string | null;
  author_username: string | null;
  author_nickname: string | null;
  author_avatar_url: string | null;
  description: string | null;
  create_time: number | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export interface EnrichmentResult {
  usage_count: number;
  videos: EnrichedVideo[];
  hashtags: string[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  if (!matches) return [];
  return matches.map((tag) => tag.slice(1).toLowerCase());
}

export async function enrichSound(
  soundId: string,
  soundTitle: string
): Promise<EnrichmentResult | null> {
  try {
    const slug = slugify(soundTitle);
    const url = `https://www.tiktok.com/music/${slug}-${soundId}`;

    console.log(`[enricher] Fetching: ${url}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    console.log(`[enricher] HTTP ${response.status}, content-type: ${response.headers.get("content-type")}`);

    if (!response.ok) {
      console.error(`[enricher] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    console.log(`[enricher] HTML length: ${html.length}`);

    // Extract the __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON blob
    const marker = "__UNIVERSAL_DATA_FOR_REHYDRATION__";
    const markerIdx = html.indexOf(marker);
    console.log(`[enricher] Marker found: ${markerIdx !== -1} at pos ${markerIdx}`);

    const scriptRegex = new RegExp(
      `<script[^>]*id="${marker}"[^>]*>([\\s\\S]*?)</script>`
    );
    let match = scriptRegex.exec(html);
    console.log(`[enricher] Script regex matched: ${!!match}`);

    if (!match) {
      // Fallback: look for the variable assignment pattern
      const varRegex = new RegExp(
        `window\\["${marker}"\\]\\s*=\\s*(\\{[\\s\\S]*?\\});?\\s*</script>`
      );
      match = varRegex.exec(html);
      console.log(`[enricher] Var regex matched: ${!!match}`);
    }

    if (!match?.[1]) {
      console.error("[enricher] Could not find rehydration data in HTML");
      console.error(`[enricher] HTML snippet: ${html.substring(Math.max(0, markerIdx - 50), markerIdx + 200).substring(0, 300)}`);
      return null;
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(match[1]);
    } catch {
      console.error("[enricher] Failed to parse rehydration JSON");
      return null;
    }

    // Navigate to the music detail data
    // The structure is typically: __DEFAULT_SCOPE__["webapp.music-detail"]
    const scope = data["__DEFAULT_SCOPE__"] as Record<string, unknown> | undefined;
    console.log(`[enricher] Scope keys: ${scope ? Object.keys(scope).join(", ") : "null"}`);
    const musicDetail = scope?.["webapp.music-detail"] as Record<string, unknown> | undefined;

    if (!musicDetail) {
      console.error("[enricher] No webapp.music-detail found in data");
      return null;
    }

    console.log(`[enricher] musicDetail keys: ${Object.keys(musicDetail).join(", ")}`);

    // Extract music info and stats
    const musicInfo = musicDetail.musicInfo as Record<string, unknown> | undefined;
    const stats = musicInfo?.stats as Record<string, number> | undefined;
    const usage_count = stats?.videoCount ?? 0;

    // Extract item list (top videos)
    const itemList = (musicDetail.itemList ?? []) as Record<string, unknown>[];

    const allHashtags = new Set<string>();
    const videos: EnrichedVideo[] = [];

    for (const item of itemList.slice(0, 6)) {
      const videoId = item.id as string | undefined;
      const desc = (item.desc as string) ?? "";
      const createTime = item.createTime as number | undefined;

      // Extract author info
      const author = item.author as Record<string, unknown> | undefined;
      const authorUsername = (author?.uniqueId as string) ?? null;
      const authorNickname = (author?.nickname as string) ?? null;
      const authorAvatar =
        (author?.avatarMedium as string) ??
        (author?.avatarThumb as string) ??
        null;

      // Extract video stats
      const videoStats = item.stats as Record<string, number> | undefined;
      const views = videoStats?.playCount ?? 0;
      const likes = videoStats?.diggCount ?? videoStats?.heartCount ?? 0;
      const shares = videoStats?.shareCount ?? 0;
      const comments = videoStats?.commentCount ?? 0;

      // Extract thumbnail
      const video = item.video as Record<string, unknown> | undefined;
      const cover =
        (video?.cover as string) ??
        (video?.dynamicCover as string) ??
        (video?.originCover as string) ??
        null;

      // Build video URL
      const video_url = videoId
        ? `https://www.tiktok.com/@${authorUsername ?? "user"}/video/${videoId}`
        : null;

      if (video_url) {
        videos.push({
          video_url,
          thumbnail_url: cover,
          author_username: authorUsername,
          author_nickname: authorNickname,
          author_avatar_url: authorAvatar,
          description: desc || null,
          create_time: createTime ?? null,
          views,
          likes,
          shares,
          comments,
        });
      }

      // Extract hashtags from description
      for (const tag of extractHashtags(desc)) {
        allHashtags.add(tag);
      }

      // Also check challenges/textExtra
      const textExtra = (item.textExtra ?? []) as Record<string, unknown>[];
      for (const te of textExtra) {
        const hashtagName = te.hashtagName as string | undefined;
        if (hashtagName) {
          allHashtags.add(hashtagName.toLowerCase());
        }
      }
    }

    return {
      usage_count,
      videos,
      hashtags: Array.from(allHashtags),
    };
  } catch (err) {
    console.error("[enricher] Error:", err);
    return null;
  }
}
