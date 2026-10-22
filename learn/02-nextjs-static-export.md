# Lesson 2: Static export

**Why:** one line in [`next.config.ts`](../next.config.ts), `output: "export"`, shapes the whole architecture. The
site is plain files on S3, so there is no Next.js server anywhere. That makes hosting nearly free and the site very
hard to break, but it also rules out several Next.js features.

## Learn

**What `next build` does with `output: "export"`.** It renders every route once, at build time, and writes the result
to `out/`: HTML per route, the JS for client components, CSS, fonts and a `404.html`. Server components run during the
build and then disappear; only their HTML stays.
Docs: [static exports](https://nextjs.org/docs/app/guides/static-exports).

**Next.js can run in three ways.** Knowing the other two explains what you gave up:

| Mode | Where pages are rendered | Hosting | Here? |
|---|---|---|---|
| Static export | Once, at build | Any file host (S3 + CloudFront) | ✅ |
| Server (Node / serverless) | Per request, or cached + revalidated (ISR) | A Node server, or Lambdas via OpenNext (`sst.aws.Nextjs`) | ❌ |
| Mixed | Some routes static, some dynamic | A server | ❌ |

[`PLAN.md`](../PLAN.md) explains the choice: no server Lambda, no ISR cache, no DynamoDB, ~$0 hosting. The price is
that content changes need a **rebuild** (lesson 8), which takes 2–3 minutes. That's fine for a landing page.

**What a static export can't do** (the build fails, or the feature silently doesn't work):

- No request-time code: no `cookies()`, `headers()`, Server Actions, Route Handlers that read the request, or
  middleware.
- No ISR or `revalidate`.
- No default image optimizer: `next/image` needs a **custom loader** (lesson 7).
- Dynamic routes (`[slug]`) only with `generateStaticParams()`, which lists every slug at build time.
  Docs: [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params).
- No `rewrites`/`redirects`/`headers` in `next.config` (CloudFront would have to do that).

So the backend (upload, email) lives in separate Lambdas, called from the browser (lessons 3, 12).

**Build-time data.** `getContent()` in [`fetch.ts`](../src/content/fetch.ts) runs during `next build`. Whatever it
returns is frozen into the HTML. Two consequences:

- **Anything that depends on "now" must run in the browser.** Look at `useOpenNow` in
  [`StickyContact.tsx`](../src/components/sections/StickyContact.tsx): the HTML assumes "open", and the browser
  corrects it after hydration, every minute. (`rok_biezacy` in [`tokens.ts`](../src/content/tokens.ts) is the year
  *of the build*, which is fine because the site is rebuilt often enough.)
- `cached ??= load()` makes the build fetch once per process, even though the layout and pages all call `getContent()`.

**`trailingSlash: true`.** Each route is written as `route/index.html` instead of `route.html`. S3 + CloudFront then
serve `/polityka-prywatnosci/` naturally.
Docs: [`trailingSlash`](https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash).

**404 on S3.** `not-found.tsx` becomes `out/404.html`. Serving it for unknown URLs is the host's job. See the comment
on `indexPage: "404.html"` in [`sst.config.ts`](../sst.config.ts): the obvious option, `errorPage`, broke every
unknown URL into a 502, which is the reason for the "Fix 404 page" commit.

**`env` in `next.config.ts`.** Values listed there are inlined into the code at build time, like `NEXT_PUBLIC_*`.
Here they're fallbacks: under SST the `NEXT_PUBLIC_*` names are set by `StaticSite`, while plain `npm run dev` reads the
names from `.env` (`SANITY_PROJECT_ID`). Lesson 3 covers env vars in detail.
Docs: [`env`](https://nextjs.org/docs/app/api-reference/config/next-config-js/env).

## Read in the repo

[`next.config.ts`](../next.config.ts) (all of it), [`src/content/fetch.ts`](../src/content/fetch.ts) (`getContent`
only, the merge is lesson 6), the `StaticSite` block in [`sst.config.ts`](../sst.config.ts), and `useOpenNow` in
[`StickyContact.tsx`](../src/components/sections/StickyContact.tsx).

## Do

```
npm run build      # → out/
npm start          # npx serve out → http://localhost:3000
```

1. Look at `out/`: find `index.html`, `polityka-prywatnosci/index.html`, `404.html` and `_next/static/`.
2. Open `out/index.html` in an editor and search for the phone number. It's literal text.
3. Try to break the rules: add `export const revalidate = 60` to `page.tsx`, or a `src/app/api/hello/route.ts` that
   reads `request.headers`, and run `npm run build`. Read the error, then revert.

## Check yourself

- An editor fixes a typo in Sanity, but nobody publishes and no deploy runs. What does the live site show? And if the
  deploy runs but Sanity is down at that moment?
- Why is the "open now" badge computed in the browser, while the phone number is computed at build time?
- What would you need to change to make `/realizacje/[slug]/` pages, one per CMS entry, work with a static export?

---

Previous: [Lesson 1](01-nextjs-app-router.md) · Next: [Lesson 3: Client islands](03-nextjs-client-islands.md)
