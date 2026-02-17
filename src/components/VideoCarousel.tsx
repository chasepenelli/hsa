"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoEmbed } from "./VideoEmbed";
import type { ExampleVideo } from "@/lib/types";

export function VideoCarousel({ videos }: { videos: ExampleVideo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No example videos available.
      </p>
    );
  }

  const video = videos[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Video {currentIndex + 1} of {videos.length}
          {video.author_username && (
            <> &middot; @{video.author_username}</>
          )}
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentIndex((i) => Math.min(videos.length - 1, i + 1))
            }
            disabled={currentIndex === videos.length - 1}
          >
            →
          </Button>
        </div>
      </div>
      <VideoEmbed
        oembedHtml={video.oembed_html}
        videoUrl={video.video_url}
      />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{formatCount(video.views)} views</span>
        <span>{formatCount(video.likes)} likes</span>
        <span>{formatCount(video.shares)} shares</span>
        <span>{formatCount(video.comments)} comments</span>
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
