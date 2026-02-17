import { NextResponse } from "next/server";
import { collectTrendingSounds } from "@/lib/collector";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await collectTrendingSounds();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/cron] Error:", err);
    return NextResponse.json(
      { error: "Cron collection failed" },
      { status: 500 }
    );
  }
}
