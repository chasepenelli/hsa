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

/**
 * Parse human-readable count like "266.5k" or "2.4M" into a number.
 */
function parseHumanCount(str: string): number {
  const match = str.match(/([\d.]+)\s*([kKmMbB])?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toLowerCase();
  if (suffix === "k") return Math.round(num * 1_000);
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "b") return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

/**
 * Pass 1: Fetch OG meta tags using social bot UA.
 * TikTok always serves these regardless of IP — gives us the real usage count.
 */
async function fetchOgMeta(
  musicUrl: string
): Promise<{ usage_count: number } | null> {
  try {
    const response = await fetch(musicUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "facebookexternalhit/1.1" },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract og:description which contains "266.5k videos - Watch awesome..."
    const descMatch = html.match(
      /property="og:description"\s+content="([^"]*)"/
    );
    if (!descMatch?.[1]) return null;

    const desc = descMatch[1];
    // Parse "266.5k videos" pattern
    const countMatch = desc.match(/^([\d.]+[kKmMbB]?)\s+videos/);
    if (!countMatch?.[1]) return null;

    const usage_count = parseHumanCount(countMatch[1]);
    console.log(`[enricher] OG meta: ${countMatch[1]} → ${usage_count}`);
    return { usage_count };
  } catch (err) {
    console.error("[enricher] OG meta fetch failed:", err);
    return null;
  }
}

/**
 * Pass 2: Attempt full page scrape for video list and hashtags.
 * This only works from non-datacenter IPs — gracefully returns null on failure.
 */
async function fetchFullPageData(
  musicUrl: string
): Promise<{ videos: EnrichedVideo[]; hashtags: string[] } | null> {
  try {
    const response = await fetch(musicUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract rehydration JSON
    const marker = "__UNIVERSAL_DATA_FOR_REHYDRATION__";
    const scriptRegex = new RegExp(
      `<script[^>]*id="${marker}"[^>]*>([\\s\\S]*?)</script>`
    );
    const match = scriptRegex.exec(html);
    if (!match?.[1]) return null;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(match[1]);
    } catch {
      return null;
    }

    const scope = data["__DEFAULT_SCOPE__"] as
      | Record<string, unknown>
      | undefined;
    const musicDetail = scope?.["webapp.music-detail"] as
      | Record<string, unknown>
      | undefined;

    if (!musicDetail) {
      console.log("[enricher] Full page: no music-detail (datacenter IP block)");
      return null;
    }

    const itemList = (musicDetail.itemList ?? []) as Record<string, unknown>[];
    const allHashtags = new Set<string>();
    const videos: EnrichedVideo[] = [];

    for (const item of itemList.slice(0, 6)) {
      const videoId = item.id as string | undefined;
      const desc = (item.desc as string) ?? "";
      const createTime = item.createTime as number | undefined;

      const author = item.author as Record<string, unknown> | undefined;
      const authorUsername = (author?.uniqueId as string) ?? null;
      const authorNickname = (author?.nickname as string) ?? null;
      const authorAvatar =
        (author?.avatarMedium as string) ??
        (author?.avatarThumb as string) ??
        null;

      const videoStats = item.stats as Record<string, number> | undefined;
      const views = videoStats?.playCount ?? 0;
      const likes = videoStats?.diggCount ?? videoStats?.heartCount ?? 0;
      const shares = videoStats?.shareCount ?? 0;
      const comments = videoStats?.commentCount ?? 0;

      const video = item.video as Record<string, unknown> | undefined;
      const cover =
        (video?.cover as string) ??
        (video?.dynamicCover as string) ??
        (video?.originCover as string) ??
        null;

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

      for (const tag of extractHashtags(desc)) {
        allHashtags.add(tag);
      }

      const textExtra = (item.textExtra ?? []) as Record<string, unknown>[];
      for (const te of textExtra) {
        const hashtagName = te.hashtagName as string | undefined;
        if (hashtagName) allHashtags.add(hashtagName.toLowerCase());
      }
    }

    return { videos, hashtags: Array.from(allHashtags) };
  } catch {
    return null;
  }
}

export async function enrichSound(
  soundId: string,
  soundTitle: string
): Promise<EnrichmentResult | null> {
  try {
    const slug = slugify(soundTitle);
    const musicUrl = `https://www.tiktok.com/music/${slug}-${soundId}`;
    console.log(`[enricher] Enriching: ${musicUrl}`);

    // Pass 1: Get usage count from OG meta (always works)
    // Pass 2: Try full page scrape for videos/hashtags (may fail on datacenter IPs)
    const [ogResult, pageResult] = await Promise.all([
      fetchOgMeta(musicUrl),
      fetchFullPageData(musicUrl),
    ]);

    if (!ogResult) {
      console.error("[enricher] OG meta fetch failed — no data available");
      return null;
    }

    return {
      usage_count: ogResult.usage_count,
      videos: pageResult?.videos ?? [],
      hashtags: pageResult?.hashtags ?? [],
    };
  } catch (err) {
    console.error("[enricher] Error:", err);
    return null;
  }
}
