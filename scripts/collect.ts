import "dotenv/config";
import { collectTrendingSounds } from "../src/lib/collector";

async function main() {
  console.log("[collect] Starting manual collection...");
  const result = await collectTrendingSounds();

  if (result.success) {
    console.log(
      `[collect] Success! ${result.count} sounds collected via ${result.source}`
    );
  } else {
    console.error(`[collect] Failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[collect] Fatal error:", err);
  process.exit(1);
});
