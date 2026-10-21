// Loads .env into process.env (tolerates stray quotes/backticks around values).
import fs from "node:fs";
import path from "node:path";

export function loadEnv(file = path.resolve(import.meta.dirname, "..", ".env")) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^[`"']+|[`"']+$/g, "");
    out[m[1]] = value;
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
  // SST / Pulumi expect CLOUDFLARE_API_TOKEN
  if (!process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUD_FLARE_TOKEN) {
    process.env.CLOUDFLARE_API_TOKEN = process.env.CLOUD_FLARE_TOKEN;
  }
  return out;
}
