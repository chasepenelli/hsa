interface OEmbedResponse {
  html: string;
  title: string;
  author_name: string;
  thumbnail_url: string;
}

export async function fetchOEmbed(videoUrl: string): Promise<string | null> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        return null;
      }

      const data = (await response.json()) as OEmbedResponse;
      return data.html ?? null;
    } catch {
      if (attempt < maxRetries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }

  return null;
}

export async function fetchOEmbedBatch(
  videoUrls: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in batches of 3 to avoid rate limits
  for (let i = 0; i < videoUrls.length; i += 3) {
    const batch = videoUrls.slice(i, i + 3);
    const promises = batch.map(async (url) => {
      const html = await fetchOEmbed(url);
      if (html) results.set(url, html);
    });
    await Promise.all(promises);

    if (i + 3 < videoUrls.length) {
      await sleep(500);
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
