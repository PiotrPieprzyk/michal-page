#!/usr/bin/env node
// Runs the SST CLI with secrets from .env (maps CLOUD_FLARE_TOKEN -> CLOUDFLARE_API_TOKEN).
// Usage: node scripts/sst.mjs deploy --stage production
import { spawnSync } from "node:child_process";
import { loadEnv } from "./load-env.mjs";

loadEnv();
const res = spawnSync("npx", ["sst", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(res.status ?? 1);
