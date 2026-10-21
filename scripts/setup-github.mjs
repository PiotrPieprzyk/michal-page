#!/usr/bin/env node
/**
 * Stores what the deploy workflow needs in the GitHub repo (via `gh`).
 * Run after the first `npm run deploy` (that creates the OIDC deploy role).
 *
 *   secrets:   CLOUDFLARE_API_TOKEN, POSTHOG_PROJECT_TOKEN
 *   variables: AWS_DEPLOY_ROLE_ARN, SANITY_PROJECT_ID, SANITY_DATASET, TURNSTILE_SITE_KEY
 */
import { loadEnv } from "./load-env.mjs";
import { run, step } from "./lib.mjs";

loadEnv();
const REPO = "PiotrPieprzyk/michal-page";

step("Deploy role");
const roleArn = run("aws", ["iam", "get-role", "--role-name", "michal-page-github-deploy", "--query", "Role.Arn", "--output", "text"], {
  capture: true,
});

const secrets = {
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  POSTHOG_PROJECT_TOKEN: process.env.POSTHOG_PROJECT_TOKEN,
};
const variables = {
  AWS_DEPLOY_ROLE_ARN: roleArn,
  SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
  SANITY_DATASET: process.env.SANITY_DATASET || "production",
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
};

step("GitHub secrets");
for (const [name, value] of Object.entries(secrets)) {
  if (!value) {
    console.log(`skip ${name} (not in .env)`);
    continue;
  }
  run("gh", ["secret", "set", name, "--repo", REPO, "--body", value]);
}

step("GitHub variables");
for (const [name, value] of Object.entries(variables)) {
  if (!value) {
    console.log(`skip ${name} (not set yet)`);
    continue;
  }
  run("gh", ["variable", "set", name, "--repo", REPO, "--body", value]);
}

console.log("\n✔ GitHub configured. Pushing to main (or publishing in Sanity) now deploys the site.");
