"use client";

import { Badge } from "@/components/ui/badge";

const config = {
  rising: { label: "Rising", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  falling: { label: "Falling", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  stable: { label: "Stable", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  new: { label: "New", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export function TrajectoryBadge({
  trajectory,
}: {
  trajectory: "rising" | "falling" | "stable" | "new";
}) {
  const { label, className } = config[trajectory] ?? config.new;

  return (
    <Badge variant="outline" className={className}>
      {trajectory === "rising" && "↑ "}
      {trajectory === "falling" && "↓ "}
      {trajectory === "stable" && "→ "}
      {trajectory === "new" && "★ "}
      {label}
    </Badge>
  );
}
