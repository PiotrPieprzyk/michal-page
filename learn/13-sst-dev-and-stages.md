# Lesson 13: Local dev and stages

**Why:** there are two ways to run this project locally, and one config file produces two quite different apps
(production vs. any other stage). Knowing which `if (isProd)` does what keeps you from breaking production while
experimenting.

## Learn

**Two dev modes:**

| | `npm run dev` | `npm run sst:dev` (`sst dev`) |
|---|---|---|
| What starts | Next.js dev server only | SST deploys your stage's backend, then a **multiplexer** (a terminal UI with tabs) that runs `npm run dev` for the site |
| Content | `seed.json`, or Sanity if `SANITY_PROJECT_ID` is in `.env` | The same |
| Form / upload | Fails: no `NEXT_PUBLIC_UPLOAD_URL` | Works: real Lambda URLs are injected into the Next dev server |
| AWS needed | No | Yes (your personal stage, ~$0) |
| Lambda code runs | n/a | **On your machine**, via Live (below) |

**Live Lambdas.** In `sst dev`, the Lambdas deployed to AWS are stubs. When a request hits a Function URL, the stub
forwards the event (through AWS AppSync Events) to your machine, your local code runs **with the function's real IAM
role**, and the response goes back. You edit `functions/submit.ts`, save, and the next request uses it: no deploy.
Breakpoints work, and `SST_DEV=true` is set in the function. Docs: [Live](https://sst.dev/docs/live/).

**What `sst dev` doesn't deploy.** `StaticSite` has a `dev` block (`command: "npm run dev"`, `url`). In dev mode SST
doesn't build or upload the site; it runs that command with the site's `environment` instead. So no CloudFront in your
personal stage. Docs: [StaticSite: running locally](https://sst.dev/docs/component/aws/static-site/).

**Which stage?** Without `--stage`, commands use your **personal stage**, whose name is stored in `.sst/stage` (it
defaults to your OS user name). Use `sst dev` only in personal stages. Remove a stage you no longer need with
`node scripts/sst.mjs remove --stage <name>`.

**Production vs. every other stage**, all from `isProd = $app.stage === "production"` in [`sst.config.ts`](../sst.config.ts):

| Thing | production | other stages | Why |
|---|---|---|---|
| `removal` / `protect` | `retain` / `true` | `remove` / `false` | Production data and the stage itself are protected |
| `siteUrl`, CORS origins | `https://michal.piotrpieprzyk.com` | `localhost:3000` | Browsers in dev call from localhost |
| Custom domain | yes, via Cloudflare | none | One domain, one owner |
| `Sender` email identity | **created** (`new sst.aws.Email`) | **looked up** (`Email.get`) | SES identities are account-wide; two stages would fight over one |
| `Recipient` verification | created | not created | Same reason |
| Budget, GitHub OIDC role | created | not created | Account-level, one is enough |
| Outputs | include `githubDeployRoleArn` | no | |

Everything else (bucket, functions, alarms, SNS topic, secrets) exists once **per stage**, so a dev stage has its own
bucket and its own secrets, which start at their defaults. All stages read the **same Sanity dataset**, since the Sanity
IDs come from `.env`.

## Read in the repo

Every `isProd` in [`sst.config.ts`](../sst.config.ts), the `dev:` key of the `StaticSite`, the `sst:dev` script in
[`package.json`](../package.json), and `.sst/stage`.

## Do

Costs ~$0 (free tier). Needs `aws login --profile michal-page`.

1. `npm run sst:dev`. Wait for the deploy, then open the site from the multiplexer tab and send the form with a photo.
   Watch the `Submit` invocation appear in the functions tab. The email goes to the `RecipientEmail` default, which is
   already verified.
2. Add `console.info("hello from my laptop")` at the top of `handler` in [`submit.ts`](../functions/submit.ts), save,
   submit again, and find the log line. Remove it.
3. Stop with Ctrl+C. The resources stay; run `node scripts/sst.mjs remove` when you're done with the stage.
4. [Lab 02](examples/02-sst-hello/sst.config.ts), step 4, does the same on the tiny app.

## Check yourself

- You run `sst dev` and submit the form. List where the request goes, hop by hop, and where your code executes.
- Your dev stage's Turnstile check is skipped. Why, and is that a problem?
- What would happen if a non-production stage also did `new sst.aws.Email("Sender", { sender: DOMAIN, ... })`?
- Why must the S3 bucket's CORS list `localhost` in dev, but not in production?

---

Previous: [Lesson 12](12-backend-functions.md) · Next: [Lesson 14: Deploy, CI and monitoring](14-deploy-and-ci.md)
