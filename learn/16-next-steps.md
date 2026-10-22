# Lesson 16: Where to go next

Exercises, roughly in order of difficulty. Each one touches several lessons, so it's a good test of whether the pieces
fit together in your head. Do the infrastructure ones on a personal stage first.

1. **A new CMS field, end to end** (lessons 5, 6, 8). Add a WhatsApp number to *Dane firmy*: `types.ts` → `seed.json` →
   schema → a `wa.me` link in the footer, with a `{whatsapp}` token in `tokens.ts`. Deploy the Studio, publish, and
   watch the rebuild.

2. **A CI quality gate** (lesson 14). Add a job before deploy that runs `npm run typecheck` and `npm run build`, and make
   `deploy` depend on it with `needs:`. Then think about where `sst diff` output could be shown for a pull request.

3. **Move `PHOTO_LINK_KEY` out of the env vars** (lessons 10, 11). Wrap the generated value in
   `new sst.Linkable("PhotoLinkKey", { properties: { value: linkKey.result } })`, link it to both functions, and read
   `Resource.PhotoLinkKey.value` in [`photo-link.ts`](../functions/photo-link.ts). Check with `sst diff` that the
   random value itself isn't replaced, or every emailed link breaks.
   Docs: [linking](https://sst.dev/docs/linking/).

4. **Generated types** (lesson 5). Run `npm run typegen` in `studio/`, compare the output with
   [`types.ts`](../src/content/types.ts), and decide whether replacing the hand-written types is worth it.
   Docs: [Sanity TypeGen](https://www.sanity.io/docs/sanity-typegen).

5. **A gallery page per project** (lessons 2, 5, 6). Add a `project` document type (not a singleton) with a `slug`, and
   `src/app/realizacje/[slug]/page.tsx` with `generateStaticParams()` that lists every slug from Sanity. Extend the
   webhook filter so publishing a project rebuilds the site.

6. **A preview stage** (lessons 9, 13). Deploy a `preview` stage of the site that builds with
   `perspective: "drafts"` and a read token stored as an `sst.Secret`, so editors can review drafts before publishing.
   What has to change in `isProd`, in the domain, and in the webhook? Compare with Sanity's live
   [Visual Editing](https://www.sanity.io/docs/visual-editing), which needs a server (Next.js
   [draft mode](https://nextjs.org/docs/app/guides/draft-mode)), and why it doesn't fit a static export.

7. **A narrower CI role** (lessons 14, 15). Replace `AdministratorAccess` with a policy for only the services this app
   uses. Deploy, read the AccessDenied errors, and iterate. Then judge honestly whether the maintenance cost is worth it
   for this project.

8. **The other Next.js mode** (lesson 2). On a personal stage, swap `sst.aws.StaticSite` for
   `sst.aws.Nextjs` (OpenNext on Lambda + CloudFront), remove `output: "export"`, and switch the content fetch to ISR
   with `revalidate`. Compare cost, deploy time and what the webhook would need to do instead.
   Docs: [SST: Next.js on AWS](https://sst.dev/docs/start/aws/nextjs/).

---

Previous: [Lesson 15](15-best-practices.md) · Back to the [index](README.md)
