export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");

    // Run daily at 6 AM
    cron.default.schedule("0 6 * * *", async () => {
      console.log("[cron] Starting daily collection...");
      try {
        const { collectTrendingSounds } = await import("@/lib/collector");
        const result = await collectTrendingSounds();
        console.log(
          `[cron] Collection complete: ${result.count} sounds via ${result.source}`
        );
      } catch (err) {
        console.error("[cron] Collection failed:", err);
      }
    });

    console.log("[cron] Scheduled daily collection at 6:00 AM");
  }
}
