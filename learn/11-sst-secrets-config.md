# Lesson 11: Secrets and configuration

**Why:** configuration in this repo comes from five different places, chosen by *who needs the value* and *how secret it
is*. Mixing them up is the most common way to leak a token or to wonder why a change didn't apply.

## Learn

**The five places:**

| Where | Example | Who reads it | Secret? |
|---|---|---|---|
| **`.env`** (local, git-ignored) | `CLOUD_FLARE_TOKEN`, `SANITY_PROJECT_ID`, `POSTHOG_PROJECT_TOKEN`, `TURNSTILE_SITE_KEY` | The SST CLI and the setup scripts on your machine | Some are |
| **GitHub secrets / variables** | `secrets.CLOUDFLARE_API_TOKEN`, `vars.AWS_DEPLOY_ROLE_ARN` | [`deploy.yml`](../.github/workflows/deploy.yml), passed as env to `sst deploy` | Secrets are |
| **`sst.Secret`** | `TurnstileSecret`, `RecipientEmail`, `AlertEmail` | Linked Lambdas (`Resource.X.value`) and the config itself (`.value`) | Yes |
| **Lambda `environment`** | `FROM_ADDRESS`, `SITE_URL`, `PHOTO_LINK_KEY` | The Lambda, as `process.env` | Should not be (see below) |
| **Build-time `NEXT_PUBLIC_*`** | Lambda URLs, Sanity IDs, PostHog key, Turnstile site key | The browser | **Never**: they're public |

**`sst.Secret`.** `new sst.Secret("TurnstileSecret", "none")` declares a secret with a default value. You set the real
value per stage with the CLI:

```
node scripts/sst.mjs secret set TurnstileSecret <value> --stage production
node scripts/sst.mjs secret list --stage production
```

Secrets are encrypted and stored in the SST state bucket in your account, with the key in SSM. (The comment in
`sst.config.ts` says "stored encrypted in SSM"; per the docs, only the passphrase is in SSM.) A secret reaches a function
**when it is deployed**, so after `secret set` you run `sst deploy` again (in `sst dev` it redeploys for you). Defaults
are handy: `"none"` makes `verifyTurnstile()` skip the check until Turnstile is set up, and the email defaults let a new
stage work immediately. Docs: [Secret](https://sst.dev/docs/component/secret/),
[environment variables](https://sst.dev/docs/environment-variables/).

**Config-time env vars.** `sst.config.ts` runs in Node on your machine (or in CI), so `process.env.TURNSTILE_SITE_KEY`
there reads your shell or `.env` (SST loads `.env` automatically). That's how public values from `.env` reach the build
via `StaticSite.environment`. In CI the same names come from the `env:` block of the workflow.

**[`scripts/sst.mjs`](../scripts/sst.mjs): why `npm run deploy` doesn't call `sst` directly.** It wraps the SST CLI
for two local problems:

1. **AWS credentials.** You log in with `aws login --profile michal-page`, which creates a credential type that SST's
   bundled AWS SDK can't read. The script runs `aws configure export-credentials` and puts the temporary keys into
   `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN`, then removes `AWS_PROFILE` so nothing else interferes.
   In CI those env vars already exist (OIDC), so the step is skipped.
2. **Variable names.** [`load-env.mjs`](../scripts/load-env.mjs) loads `.env` and maps `CLOUD_FLARE_TOKEN` to
   `CLOUDFLARE_API_TOKEN`, the name the Cloudflare provider reads.

Docs: [IAM credentials](https://sst.dev/docs/iam-credentials/).

**Generated secrets.** `random.RandomPassword("PhotoLinkKey")` creates the HMAC key for photo links once and keeps it
stable across deploys (it's in the state, which SST encrypts). It's passed via `environment`, so it's readable in plain
text by anyone who can view the Lambda's configuration in the console. Linking it instead isn't possible directly, since
a `RandomPassword` isn't linkable, but it could be wrapped (see lesson 16).

## Read in the repo

The `// --- Secrets` block and every `.value` in [`sst.config.ts`](../sst.config.ts),
[`scripts/sst.mjs`](../scripts/sst.mjs), [`scripts/load-env.mjs`](../scripts/load-env.mjs), the *Secrets & config* table
in the [README](../README.md#secrets--config), and the `env:` block of [`deploy.yml`](../.github/workflows/deploy.yml).

## Do

1. [Lab 02](examples/02-sst-hello/sst.config.ts), step 3: set a secret, see that nothing changes, deploy, see it change.
2. Read-only on production: `node scripts/sst.mjs secret list --stage production`. Which secrets still have their
   default value?
3. In the AWS console, open the `Submit` Lambda → Configuration → Environment variables. Which of the values above do
   you see in plain text? Where is `TurnstileSecret`?

## Check yourself

- You change `RecipientEmail` with `secret set`. List every step until a quote reaches the new address. (Hint: SES
  sandbox, [README](../README.md#secrets--config).)
- Why is `TURNSTILE_SITE_KEY` in `.env` and GitHub *variables*, while the Turnstile secret key is an `sst.Secret`?
- What does `scripts/sst.mjs` do in CI? Why does CI call `npx sst deploy` directly instead?

---

Previous: [Lesson 10](10-sst-components-linking.md) · Next: [Lesson 12: The backend functions](12-backend-functions.md)
