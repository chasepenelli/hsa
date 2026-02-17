import { NextResponse } from "next/server";
import { collectTrendingSounds } from "@/lib/collector";

export const dynamic = "force-dynamic";

let isRefreshing = false;

export async function POST() {
  if (isRefreshing) {
    return NextResponse.json(
      { error: "A refresh is already in progress" },
      { status: 429 }
    );
  }

  isRefreshing = true;

  try {
    const result = await collectTrendingSounds();

    if (result.success) {
      return NextResponse.json({
        message: `Collected ${result.count} sounds via ${result.source}`,
        ...result,
      });
    } else {
      return NextResponse.json(
        { error: result.error, ...result },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[api/refresh] Error:", err);
    return NextResponse.json(
      { error: "Refresh failed unexpectedly" },
      { status: 500 }
    );
  } finally {
    isRefreshing = false;
  }
}
