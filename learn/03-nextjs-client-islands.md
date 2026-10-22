# Lesson 3: Client islands and the browser side

**Why:** a few parts of the page must react to the visitor: the form, the mobile menu, the gallery filter and slider,
the sticky bar, analytics. These are **client components**. The rest of the page is static HTML. Knowing where the
line is, and what crosses it, is the core Next.js skill.

## Learn

**`"use client"` marks a boundary, not a single component.** The directive at the top of a file says "this module and
everything it imports run in the browser too". The component is still rendered to HTML at build time (so the form is
in `index.html`), and then React **hydrates** it in the browser: it attaches state and event handlers.
Docs: [`use client`](https://nextjs.org/docs/app/api-reference/directives/use-client),
[server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components).

The client files here, and why each one needs the browser:

| File | Needs |
|---|---|
| [`QuoteForm.tsx`](../src/components/sections/QuoteForm.tsx) | State, file input, `fetch`, XHR progress, Turnstile widget |
| [`Gallery.tsx`](../src/components/sections/Gallery.tsx), [`BeforeAfterSlider.tsx`](../src/components/sections/BeforeAfterSlider.tsx) | Filter state, pointer dragging |
| [`MobileMenu.tsx`](../src/components/sections/MobileMenu.tsx) | Open/close state, focus handling |
| [`StickyContact.tsx`](../src/components/sections/StickyContact.tsx) | `IntersectionObserver`, the current time (lesson 2) |
| [`Analytics.tsx`](../src/components/Analytics.tsx) + [`analytics.ts`](../src/lib/analytics.ts) | PostHog, a document click listener |

**Props crossing the boundary must be serializable.** A server component (`Header`) can render a client component
(`MobileMenu`) and pass it props, but only plain data: strings, arrays, objects. No functions or class instances. That's
one more reason the content is a plain JSON-like `LandingContent` object.

**Keep the client part small.** `Analytics.tsx` shows a neat trick: server components can't attach `onClick`, so they
add `data-call="hero"` attributes, and one client component listens for clicks on the whole document. The sections stay
server components and ship no JS ([`docs/conventions.md`](../docs/conventions.md), "Analytics").

**Environment variables in the browser.** Only variables named `NEXT_PUBLIC_*` are available in client code, and they're
**replaced with their literal values at build time**. There's no runtime config on a static host. So:

- `NEXT_PUBLIC_UPLOAD_URL` and `NEXT_PUBLIC_SUBMIT_URL` ([`upload.ts`](../src/lib/upload.ts)) are the Lambda URLs that
  SST passes into the build via `StaticSite.environment` (lesson 10).
- Without them (plain `npm run dev`) the form shows the page but `presign()` throws "NEXT_PUBLIC_UPLOAD_URL is not set".
- Anything `NEXT_PUBLIC_*` is **public**: it ends up in a JS file anyone can download. The Turnstile *site* key and
  PostHog *project* key are designed to be public; their secret counterparts never go near the build.

Docs: [environment variables](https://nextjs.org/docs/app/guides/environment-variables).

**The upload flow from the browser** ([`QuoteForm.tsx`](../src/components/sections/QuoteForm.tsx) →
[`image-compress.ts`](../src/lib/image-compress.ts) → [`upload.ts`](../src/lib/upload.ts)):

1. Validate type and size locally (the same limits are enforced again in the Lambdas, lesson 12).
2. Compress to a 2000 px long edge JPEG in a `<canvas>`, unless the browser can't decode the file (HEIC outside Safari).
3. `presign()`: POST `{name, type, size}` → `{key, url, headers}`.
4. PUT the blob to S3 with `XMLHttpRequest`, because `fetch` has no upload progress events.
5. Uploads run one at a time through a promise queue (`queue.current = queue.current.then(...)`).
6. Submit sends only the S3 `key`s, never the files.

**Spam protection on the client side:** a hidden honeypot input (`website`), `elapsedMs` since the first interaction,
and the Turnstile widget, which produces a token the Lambda verifies. The client part alone proves nothing; it only
collects the signals.

## Read in the repo

1. [`Analytics.tsx`](../src/components/Analytics.tsx) and [`analytics.ts`](../src/lib/analytics.ts): the smallest
   client component.
2. [`Header.tsx`](../src/components/sections/Header.tsx) → [`MobileMenu.tsx`](../src/components/sections/MobileMenu.tsx):
   a server component rendering a client one.
3. [`upload.ts`](../src/lib/upload.ts), then `startUpload` and `onSubmit` in
   [`QuoteForm.tsx`](../src/components/sections/QuoteForm.tsx).

## Do

1. `npm run build`, then search `out/_next/static/chunks/` (with your editor's search) for the `SANITY_PROJECT_ID`
   value from your `.env`. It's there as a literal string: `next.config.ts` turned it into
   `NEXT_PUBLIC_SANITY_PROJECT_ID`, and the build inlined it. Then search for `process.env.NEXT_PUBLIC`: nothing left.
2. In `npm run dev`, open React DevTools (browser extension) and find which components show up as client components.
3. Add `"use client"` to `Footer.tsx`, run `npm run build`, and compare the size of the JS chunks with before. Revert.

## Check yourself

- `QuoteForm` is a client component, but its labels are in the HTML of `out/index.html`. How?
- You rotate the Turnstile **site** key. What must happen before visitors get the new one?
- Why does the browser upload to S3 directly instead of sending the photos to `Submit`?

---

Previous: [Lesson 2](02-nextjs-static-export.md) · Next: [Lesson 4: Sanity mental model](04-sanity-mental-model.md)
