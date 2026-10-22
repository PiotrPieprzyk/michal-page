# Lesson 15: Best practices, and where this repo applies them

**Why:** each practice below is linked to the place where this repo follows it, or to the reason it doesn't. Use it as a
review checklist for your next project on the same stack.

## Next.js

| # | Practice | In this repo |
|---|---|---|
| 1 | **Pick the rendering mode from requirements, not habit.** Static is the cheapest and most robust when content changes rarely. | `output: "export"` ([lesson 2](02-nextjs-static-export.md)); [`PLAN.md`](../PLAN.md) records why |
| 2 | **Server components by default, small client islands.** | 6 client files; analytics by event delegation ([lesson 3](03-nextjs-client-islands.md)) |
| 3 | **Nothing secret in `NEXT_PUBLIC_*`.** | Only URLs, IDs and public keys |
| 4 | **Time-dependent UI runs in the browser on a static site.** | `useOpenNow` in [`StickyContact.tsx`](../src/components/sections/StickyContact.tsx) |
| 5 | **Images: correct `sizes`, lazy below the fold, preload the LCP image.** | [`Photo.tsx`](../src/components/ui/Photo.tsx), `preload` on the hero ([lesson 7](07-sanity-images.md)) |
| 6 | **Metadata and structured data from the same content source.** | `generateMetadata` + JSON-LD in [`layout.tsx`](../src/app/layout.tsx) |
| 7 | **Self-host fonts.** | `next/font/google` |

## Sanity

| # | Practice | In this repo |
|---|---|---|
| 8 | **Model content for the page, with editor-friendly labels and help.** | Polish titles, groups per section, `TOKENS_HELP`, shot-list placeholders |
| 9 | **Pin `apiVersion`.** | `"2025-01-01"` in [`fetch.ts`](../src/content/fetch.ts) |
| 10 | **Build from `published`, never drafts.** | `perspective: "published"`, webhook `includeDrafts: false` |
| 11 | **Fetch only what you need, in as few requests as possible.** | One query with projections ([lesson 6](06-groq-and-fetching.md)) |
| 12 | **Lock down singletons.** | Fixed IDs, custom structure, filtered templates and actions ([lesson 5](05-sanity-schemas.md)) |
| 13 | **Generate types from schema and queries.** | **Not done**: `types.ts` is hand-written and kept in sync by convention. `npm run typegen` exists in `studio/` |
| 14 | **Degrade gracefully when the CMS is empty or down.** | `seed.json` fallback + merge; but a Sanity outage during a build fails that deploy (the live site is unaffected) |
| 15 | **Public dataset only for public content.** | Yes: everything in it is on the website anyway |

## SST and AWS

| # | Practice | In this repo |
|---|---|---|
| 16 | **All infrastructure in code; no console changes.** | Everything in [`sst.config.ts`](../sst.config.ts), including alarms, budget and the CI role |
| 17 | **Pin versions.** | Exact versions in `package.json` (`sst`, AWS SDK) and in `providers` |
| 18 | **Separate stages; protect production.** | `removal: "retain"` + `protect: true` on production ([lesson 9](09-sst-mental-model.md)) |
| 19 | **Use linking instead of hand-written IAM and env vars.** | `link` for bucket, email and secrets ([lesson 10](10-sst-components-linking.md)) |
| 20 | **Secrets out of code, env vars and the browser.** | `sst.Secret` for Turnstile and emails. **Exception:** `PHOTO_LINK_KEY` is a plain Lambda env var ([lesson 11](11-sst-secrets-config.md)) |
| 21 | **Least privilege.** | Linking scopes the Lambdas. **Exception:** the CI role has `AdministratorAccess`, mitigated by a tight trust policy ([lesson 14](14-deploy-and-ci.md)) |
| 22 | **No long-lived CI credentials.** | GitHub OIDC with the immutable subject format |
| 23 | **Validate at every trust boundary.** | zod in both Lambdas; signed content type and length; key regex ([lesson 12](12-backend-functions.md)) |
| 24 | **Don't proxy large files through Lambda.** | Presigned S3 PUT from the browser |
| 25 | **Expire what you don't need.** | 30-day lifecycle on uploads, 5-minute upload URLs, 10-minute download URLs |
| 26 | **Alarms and a budget from day one.** | Error alarms, SES events, $2 budget |
| 27 | **Repeatable setup.** | Idempotent `scripts/setup-*.mjs`, documented order in the [README](../README.md#first-time-setup-in-this-order) |
| 28 | **Tests in CI before deploy.** | **Not done**: CI deploys without `typecheck`, `lint` or `sst diff` review. See [lesson 16](16-next-steps.md) |

Further reading:
[SST: workflow](https://sst.dev/docs/workflow/),
[SST: policy packs](https://sst.dev/docs/policy-packs/),
[Next.js: static exports](https://nextjs.org/docs/app/guides/static-exports),
[Sanity Learn](https://www.sanity.io/learn).

---

Previous: [Lesson 14](14-deploy-and-ci.md) · Next: [Lesson 16: Where to go next](16-next-steps.md)
