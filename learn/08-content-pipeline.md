# Lesson 8: The content pipeline: publish → rebuild

**Why:** with a static site, "publish in the CMS" has to mean "rebuild and redeploy the site". This lesson connects
Sanity to GitHub Actions, and covers how the first content got into Sanity.

## Learn

**Seeding: `seed.json` → Sanity.** The mockup copy lives in [`seed.json`](../src/content/seed.json).
[`build-seed.mjs`](../studio/scripts/build-seed.mjs) turns it into three documents in **NDJSON** (one JSON document per
line), which the CLI imports:

- `_id` and `_type` are set to the singleton IDs;
- every object inside an array gets a random `_key` (Sanity needs it to track array items across edits) and the
  `_type` of its schema member (`serviceCard`, `priceRow`...), from the `ARRAY_TYPES` map, which must match the schema;
- image slots get `_type: "siteImage"` with only `alt` and `placeholderLabel`, because there are no photos yet.

`sanity dataset import seed.ndjson --missing` creates documents that don't exist yet; `--replace` overwrites them
(`node scripts/setup-sanity.mjs --reseed`). Docs: [importing data](https://www.sanity.io/docs/importing-data).

**The setup script** ([`scripts/setup-sanity.mjs`](../scripts/setup-sanity.mjs)) is idempotent: it skips what exists.
In order: login → create project + public dataset → write `studio/.env` → import seed → add CORS origins → `sanity
deploy` → create the webhook → set GitHub variables.

**The webhook.** Sanity webhooks are **GROQ-powered**: a `filter` decides which documents trigger them and a `projection`
shapes the HTTP body. This one:

```js
rule: {
  on: ["create", "update", "delete"],
  filter: '_type in ["siteSettings","landingPage","privacyPage"]',
  projection: '{"event_type": "sanity-publish"}',
},
url: "https://api.github.com/repos/<owner>/<repo>/dispatches",
headers: { Authorization: "Bearer <fine-grained GitHub token>", ... },
includeDrafts: false,
```

The projection produces exactly the body GitHub's
[repository_dispatch API](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) expects, so
no glue service is needed. `includeDrafts: false` means editing a draft does nothing; only publishing fires.
Docs: [webhooks](https://www.sanity.io/docs/webhooks).

**The GitHub side.** [`deploy.yml`](../.github/workflows/deploy.yml) listens for `repository_dispatch` with
`types: [sanity-publish]` (besides pushes to `main` and manual runs). `concurrency` with `cancel-in-progress: true`
means an editor who publishes five times in a minute gets one build of the latest content, not five queued ones.
Docs: [events that trigger workflows](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows),
[concurrency](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs).

**The token.** The webhook holds a fine-grained GitHub token with *Contents: read & write* on this one repo (the
permission `repository_dispatch` requires). It's stored in Sanity's webhook settings and in your local `.env`, never in
the repo. When it expires, publishing silently stops deploying: the webhook's delivery log in sanity.io/manage shows
the 401s.

## Read in the repo

[`studio/scripts/build-seed.mjs`](../studio/scripts/build-seed.mjs), [`scripts/setup-sanity.mjs`](../scripts/setup-sanity.mjs)
(steps 3 and 6 especially), the `on:` and `concurrency:` blocks of [`deploy.yml`](../.github/workflows/deploy.yml).

## Do

1. `cd studio && node scripts/build-seed.mjs`, then open `studio/seed.ndjson` (git-ignored). Find a `_key` and a
   `siteImage`.
2. In sanity.io/manage → your project → API → Webhooks, open *Rebuild site (GitHub Actions)* and look at the attempt
   log.
3. Publish a small, harmless change in the Studio and watch the run start under the repo's **Actions** tab. Time it
   until the change is live.

## Check yourself

- An editor publishes, then publishes again 30 seconds later. How many deploys finish? Which content is live?
- Why does every array item need a `_key`, while the top-level documents don't?
- The webhook fires on `delete` too. Which document deletions are still possible, given lesson 5's restrictions?
- What would be the effect of `includeDrafts: true`?

---

Previous: [Lesson 7](07-sanity-images.md) · Next: [Lesson 9: SST mental model](09-sst-mental-model.md)
