"use client";

import { useEffect, useRef } from "react";

export function VideoEmbed({
  oembedHtml,
  videoUrl,
}: {
  oembedHtml: string | null;
  videoUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!oembedHtml || !containerRef.current) return;

    containerRef.current.innerHTML = oembedHtml;

    // Load TikTok embed script if not already loaded
    const existingScript = document.querySelector(
      'script[src*="tiktok.com/embed"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Re-trigger embed rendering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).tiktokEmbed?.lib?.render?.();
    }
  }, [oembedHtml]);

  if (!oembedHtml) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-8 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        Watch on TikTok →
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="[&>blockquote]:!m-0 [&>blockquote]:!max-w-none"
    />
  );
}
