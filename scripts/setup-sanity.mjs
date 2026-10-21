#!/usr/bin/env node
/**
 * One-time Sanity setup. Safe to re-run (skips what already exists).
 *
 *   node scripts/setup-sanity.mjs            # create project, import mockup copy, deploy Studio, webhook
 *   node scripts/setup-sanity.mjs --reseed   # overwrite content in Sanity with src/content/seed.json
 *
 * Steps:
 *  1. `sanity login` (opens the browser) if you aren't logged in
 *  2. creates the project + public "production" dataset (free plan) -> SANITY_PROJECT_ID in .env
 *  3. imports the mockup copy (siteSettings, landingPage, privacyPage)
 *  4. deploys the Studio to https://<host>.sanity.studio
 *  5. creates the publish webhook -> GitHub repository_dispatch "sanity-publish" (needs a GitHub token)
 *  6. stores SANITY_PROJECT_ID / SANITY_DATASET as GitHub Actions variables (needs `gh`)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnv } from "./load-env.mjs";
import { ask, ENV_FILE, ROOT, run, setEnv, step } from "./lib.mjs";

loadEnv();
const STUDIO = path.join(ROOT, "studio");
const STUDIO_ENV = path.join(STUDIO, ".env");
const DATASET = process.env.SANITY_DATASET || "production";
const REPO = "PiotrPieprzyk/michal-page";
const reseed = process.argv.includes("--reseed");
const sanity = (args, opts = {}) => run("npx", ["sanity", ...args], { cwd: STUDIO, ...opts });

function sanityToken() {
  if (process.env.SANITY_AUTH_TOKEN) return process.env.SANITY_AUTH_TOKEN;
  const candidates = [
    path.join(os.homedir(), ".config", "sanity", "config.json"),
    process.env.XDG_CONFIG_HOME && path.join(process.env.XDG_CONFIG_HOME, "sanity", "config.json"),
    process.env.APPDATA && path.join(process.env.APPDATA, "sanity", "config.json"),
  ].filter(Boolean);
  for (const file of candidates) {
    try {
      const token = JSON.parse(fs.readFileSync(file, "utf8")).authToken;
      if (token) return token;
    } catch {}
  }
  return "";
}

step("0. Studio dependencies");
if (!fs.existsSync(path.join(STUDIO, "node_modules"))) run("npm", ["install"], { cwd: STUDIO });

step("1. Sanity login");
if (!sanityToken()) sanity(["login"]);
else console.log("Already logged in.");

step("2. Project + dataset");
let projectId = process.env.SANITY_PROJECT_ID;
if (!projectId) {
  const out = sanity(
    ["projects", "create", "Wycinka drzew", "--dataset", DATASET, "--dataset-visibility", "public", "--json", "-y"],
    { capture: true },
  );
  try {
    const parsed = JSON.parse(out.slice(out.indexOf("{")));
    projectId = parsed.projectId ?? parsed.id;
  } catch {
    projectId = out.match(/\b([a-z0-9]{8})\b/)?.[1];
  }
  if (!projectId) {
    console.error("Could not read the project id from:\n" + out);
    projectId = await ask("Paste the new Sanity project id");
  }
  console.log(`Created project ${projectId}`);
} else {
  console.log(`Using existing project ${projectId}`);
}
setEnv("SANITY_PROJECT_ID", projectId);
setEnv("SANITY_DATASET", DATASET);

const host = process.env.SANITY_STUDIO_HOST || (await ask("Studio hostname (<name>.sanity.studio)", "wycinka-michal"));
setEnv("SANITY_STUDIO_HOST", host);
fs.writeFileSync(
  STUDIO_ENV,
  `SANITY_STUDIO_PROJECT_ID=${projectId}\nSANITY_STUDIO_DATASET=${DATASET}\nSANITY_STUDIO_HOST=${host}\n`,
);
const studioEnv = { SANITY_STUDIO_PROJECT_ID: projectId, SANITY_STUDIO_DATASET: DATASET, SANITY_STUDIO_HOST: host };

// Make sure the dataset exists (projects create may skip it on some CLI versions).
sanity(["datasets", "create", DATASET, "--visibility", "public", "-p", projectId], { env: studioEnv, allowFail: true });

step("3. Import the mockup copy");
run("node", ["scripts/build-seed.mjs"], { cwd: STUDIO });
sanity(["datasets", "import", "seed.ndjson", "--dataset", DATASET, "-p", projectId, reseed ? "--replace" : "--missing"], {
  env: studioEnv,
});

step("4. CORS for local Studio / dev");
sanity(["cors", "add", "http://localhost:3333", "--credentials", "-p", projectId], { env: studioEnv, allowFail: true });
sanity(["cors", "add", "http://localhost:3000", "--no-credentials", "-p", projectId], { env: studioEnv, allowFail: true });

step("5. Deploy the Studio");
sanity(["deploy", "-y"], { env: studioEnv });
console.log(`Studio: https://${host}.sanity.studio`);

step("6. Publish webhook -> GitHub Actions rebuild");
const token = sanityToken();
let ghToken = process.env.GITHUB_DISPATCH_TOKEN;
if (!ghToken) {
  console.log(
    [
      "Create a fine-grained GitHub token: https://github.com/settings/personal-access-tokens/new",
      `  Repository access: only ${REPO}`,
      "  Permissions: Contents = Read and write (needed for repository_dispatch)",
      "  Expiration: as long as you like (renew it here later)",
    ].join("\n"),
  );
  ghToken = await ask("Paste the token (or leave empty to skip the webhook)");
}
if (ghToken && token) {
  setEnv("GITHUB_DISPATCH_TOKEN", ghToken);
  const api = `https://api.sanity.io/v2021-10-04/hooks/projects/${projectId}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const existing = await (await fetch(api, { headers })).json().catch(() => []);
  const name = "Rebuild site (GitHub Actions)";
  const current = Array.isArray(existing) ? existing.find((h) => h.name === name) : undefined;
  if (current) {
    await fetch(`${api}/${current.id}`, { method: "DELETE", headers });
  }
  const res = await fetch(api, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "document",
      name,
      description: "Publishing site content triggers the deploy workflow (repository_dispatch: sanity-publish).",
      url: `https://api.github.com/repos/${REPO}/dispatches`,
      httpMethod: "POST",
      apiVersion: "v2025-01-01",
      dataset: DATASET,
      rule: {
        on: ["create", "update", "delete"],
        filter: '_type in ["siteSettings","landingPage","privacyPage"]',
        projection: '{"event_type": "sanity-publish"}',
      },
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      includeDrafts: false,
      isDisabled: false,
    }),
  });
  if (res.ok) console.log("Webhook created.");
  else console.error(`Webhook failed (${res.status}): ${await res.text()}\nCreate it by hand in https://www.sanity.io/manage/project/${projectId}/api#webhooks`);
} else {
  console.log("Skipped. Re-run with GITHUB_DISPATCH_TOKEN set to add it later.");
}

step("7. GitHub Actions variables");
if (run("gh", ["--version"], { capture: true, allowFail: true })) {
  run("gh", ["variable", "set", "SANITY_PROJECT_ID", "--repo", REPO, "--body", projectId], { allowFail: true });
  run("gh", ["variable", "set", "SANITY_DATASET", "--repo", REPO, "--body", DATASET], { allowFail: true });
} else {
  console.log(`Set repo variables SANITY_PROJECT_ID=${projectId} and SANITY_DATASET=${DATASET} in GitHub.`);
}

console.log(`
✔ Sanity is ready.
  Studio:   https://${host}.sanity.studio
  .env:     ${ENV_FILE} (SANITY_PROJECT_ID, SANITY_DATASET)
  Next:     npm run deploy   (the site now reads content from Sanity)
`);
