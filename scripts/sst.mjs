#!/usr/bin/env node
// Runs the SST CLI with secrets from .env (maps CLOUD_FLARE_TOKEN -> CLOUDFLARE_API_TOKEN).
// Locally it also exports the `aws login --profile michal-page` session as env credentials,
// because SST's bundled AWS SDK cannot read that credential type. CI already has env credentials.
// Usage: node scripts/sst.mjs deploy --stage production
import { spawnSync } from "node:child_process";
import { loadEnv } from "./load-env.mjs";

loadEnv();

if (!process.env.AWS_ACCESS_KEY_ID) {
  const profile = process.env.AWS_PROFILE || "michal-page";
  const exp = spawnSync(
    "aws",
    ["configure", "export-credentials", "--profile", profile, "--format", "process"],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  if (exp.status !== 0) {
    console.error(`Could not read AWS credentials. Run: aws login --profile ${profile}\n${exp.stderr ?? ""}`);
    process.exit(1);
  }
  const c = JSON.parse(exp.stdout);
  process.env.AWS_ACCESS_KEY_ID = c.AccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = c.SecretAccessKey;
  if (c.SessionToken) process.env.AWS_SESSION_TOKEN = c.SessionToken;
  process.env.AWS_REGION ||= "eu-central-1";
  delete process.env.AWS_PROFILE;
}
const res = spawnSync("npx", ["sst", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(res.status ?? 1);
