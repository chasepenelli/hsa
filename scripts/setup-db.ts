import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { SCHEMA_SQL } from "../src/lib/db";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("[setup] Creating tables...");

  // Split by statement and run individually since Supabase
  // rpc may not handle multi-statement well. Use the SQL editor
  // in Supabase dashboard for the most reliable setup.
  console.log("\nRun this SQL in your Supabase SQL Editor:\n");
  console.log(SCHEMA_SQL);
  console.log("\n[setup] Copy the SQL above into https://supabase.com/dashboard → SQL Editor");
}

main();
