#!/usr/bin/env node
/**
 * Creates the Cloudflare Turnstile widget for the quote form and wires it up:
 *   - TURNSTILE_SITE_KEY -> .env (public, baked into the static build) + GitHub variable
 *   - secret key         -> SST secret TurnstileSecret (stage production)
 *
 * Needs a Cloudflare token with "Account › Turnstile › Edit". The DNS token in .env
 * usually lacks it; then create the widget by hand (https://dash.cloudflare.com/?to=/:account/turnstile,
 * hostname michal.piotrpieprzyk.com, mode "Managed") and run:
 *   node scripts/setup-turnstile.mjs <siteKey> <secretKey>
 *
 * Until this runs the form works without Turnstile (honeypot + timing check only).
 */
import { loadEnv } from "./load-env.mjs";
import { run, setEnv, step } from "./lib.mjs";

loadEnv();
const ACCOUNT_ID = process.env.CLOUDFLARE_DEFAULT_ACCOUNT_ID || "10026eb9231f450d9c1bfe0495199ae4";
const DOMAIN = "michal.piotrpieprzyk.com";
const token = process.env.CLOUDFLARE_TURNSTILE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

let [siteKey, secret] = process.argv.slice(2);

if (!siteKey) {
  step("Creating Turnstile widget via the Cloudflare API");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/challenges/widgets`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Wycinka drzew — formularz", domains: [DOMAIN, "localhost"], mode: "managed" }),
  });
  const data = await res.json();
  if (!data.success) {
    console.error("Cloudflare refused:", JSON.stringify(data.errors));
    console.error("Create the widget in the dashboard, then: node scripts/setup-turnstile.mjs <siteKey> <secretKey>");
    process.exit(1);
  }
  siteKey = data.result.sitekey;
  secret = data.result.secret;
}

step("Saving keys");
setEnv("TURNSTILE_SITE_KEY", siteKey);
run("node", ["scripts/sst.mjs", "secret", "set", "TurnstileSecret", secret, "--stage", "production"]);
run("gh", ["variable", "set", "TURNSTILE_SITE_KEY", "--repo", "PiotrPieprzyk/michal-page", "--body", siteKey], {
  allowFail: true,
});
console.log("\n✔ Turnstile configured. Redeploy (npm run deploy) so the site picks up the site key.");
