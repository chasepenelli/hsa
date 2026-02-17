"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoEmbed } from "./VideoEmbed";
import type { ExampleVideo } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function formatCount(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function VideoCard({ video }: { video: ExampleVideo }) {
  const [expanded, setExpanded] = useState(false);

  const postedAgo = video.create_time
    ? formatDistanceToNow(new Date(video.create_time * 1000), {
        addSuffix: true,
      })
    : null;

  return (
    <Card className="overflow-hidden bg-card/50">
      {/* Thumbnail / Embed toggle */}
      {expanded ? (
        <div className="relative">
          <VideoEmbed oembedHtml={video.oembed_html} videoUrl={video.video_url} />
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
          >
            Close
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="relative block w-full"
        >
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt="Video thumbnail"
              className="aspect-[9/16] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[9/16] w-full items-center justify-center bg-muted/30 text-muted-foreground">
              <svg
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <div className="rounded-full bg-black/60 p-3">
              <svg
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}

      <CardContent className="space-y-2 p-3">
        {/* Author row */}
        <div className="flex items-center gap-2">
          {video.author_avatar_url ? (
            <img
              src={video.author_avatar_url}
              alt={video.author_nickname ?? ""}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
              @
            </div>
          )}
          <span className="truncate text-sm font-medium">
            {video.author_nickname ?? video.author_username ?? "Unknown"}
          </span>
        </div>

        {/* Description snippet */}
        {video.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {video.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatCount(video.views)} views</span>
          <span>{formatCount(video.likes)} likes</span>
          <span>{formatCount(video.shares)} shares</span>
          <span>{formatCount(video.comments)} comments</span>
        </div>

        {/* Posted time */}
        {postedAgo && (
          <p className="text-xs text-muted-foreground/60">Posted {postedAgo}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function VideoGrid({ videos }: { videos: ExampleVideo[] }) {
  if (videos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No example videos available.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
