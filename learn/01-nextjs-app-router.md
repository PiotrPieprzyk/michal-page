# Lesson 1: Next.js App Router basics

**Why:** everything in `src/app/` follows Next.js conventions. The file *names* decide what a file does, and
components run on the server unless you opt out. Once you know the conventions, the site is ordinary React.

## Learn

**Files are routes.** In the App Router, a folder under `src/app/` is a URL segment and `page.tsx` makes it a page:

| File | URL / role |
|---|---|
| [`src/app/page.tsx`](../src/app/page.tsx) | `/` |
| [`src/app/polityka-prywatnosci/page.tsx`](../src/app/polityka-prywatnosci/page.tsx) | `/polityka-prywatnosci/` (the trailing slash comes from `trailingSlash: true`, lesson 2) |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | The **root layout**: wraps every page, owns `<html>` and `<body>` |
| [`src/app/not-found.tsx`](../src/app/not-found.tsx) | Rendered for unknown URLs. In a static export it becomes `404.html` |
| [`src/app/globals.css`](../src/app/globals.css) | Imported once in the layout. Tailwind v4 tokens live in its `@theme` block |
| [`icon.svg`](../src/app/icon.svg), `favicon.ico`, `apple-icon.png` in `src/app/` | Picked up by name: Next adds the `<link rel="icon">` tags itself |

Other special files exist (`loading.tsx`, `error.tsx`, `route.ts`, `[slug]/` dynamic segments...). This site doesn't
need them, and some of them don't work with a static export (lesson 2).
Docs: [layouts and pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages),
[project structure](https://nextjs.org/docs/app/getting-started/project-structure),
[`not-found`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).

**Server Components are the default.** A component in the App Router is a React Server Component (RSC) unless its file
starts with `"use client"`. A server component:

- can be `async` and `await` data directly: `const c = await getContent()` in [`page.tsx`](../src/app/page.tsx);
- runs only on the server (here: **only during `next build`**) and ships **no JavaScript** to the browser;
- can't use state, effects or browser APIs.

Most of this site is server components: [`Header`](../src/components/sections/Header.tsx),
[`Hero`](../src/components/sections/Hero.tsx), [`Services`](../src/components/sections/Services.tsx),
[`Pricing`](../src/components/sections/Pricing.tsx), [`Footer`](../src/components/sections/Footer.tsx). They become
plain HTML. Lesson 3 covers the client ones.
Docs: [server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[React: server components](https://react.dev/reference/rsc/server-components).

**Data flows down as props.** `page.tsx` fetches the whole content object once and hands each section its slice plus
`settings`. Sections never import Sanity themselves ([`docs/conventions.md`](../docs/conventions.md), "Content").
That keeps every section testable with `seed.json` and keeps the CMS in one place.

**Metadata.** `export async function generateMetadata()` in a layout or page returns `<title>`, description,
Open Graph tags, canonical URL and so on. Here it's built from CMS fields, so SEO text is editable in Sanity.
[`layout.tsx`](../src/app/layout.tsx) also renders a `LocalBusiness` JSON-LD `<script>`.
Docs: [metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images),
[`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[JSON-LD](https://nextjs.org/docs/app/guides/json-ld).

**Fonts.** `next/font/google` downloads Archivo **at build time** and serves it from the site itself (no request to
Google from the visitor's browser, which also matters for GDPR). The `variable` option exposes it as a CSS variable
used by Tailwind. Docs: [`next/font`](https://nextjs.org/docs/app/api-reference/components/font).

**Small things you'll see:**

- `@/…` imports are an alias for `src/…` (`paths` in [`tsconfig.json`](../tsconfig.json)).
- `next dev --turbopack`: Turbopack is the Rust bundler Next uses in dev.
  Docs: [Turbopack](https://nextjs.org/docs/app/api-reference/turbopack).

## Read in the repo

1. [`src/app/layout.tsx`](../src/app/layout.tsx): font, metadata, JSON-LD, `<Analytics />`.
2. [`src/app/page.tsx`](../src/app/page.tsx): one `getContent()`, then sections in order.
3. [`src/app/polityka-prywatnosci/page.tsx`](../src/app/polityka-prywatnosci/page.tsx): a second route, with its
   own `generateMetadata`.
4. One server section end to end, e.g. [`Hero.tsx`](../src/components/sections/Hero.tsx), and the primitives it uses
   in [`src/components/ui/`](../src/components/ui).

## Do

1. `npm run dev`, open http://localhost:3000 and http://localhost:3000/polityka-prywatnosci/.
2. Open DevTools → Network → JS. Note the size of what loads. Then view the page source: the hero text is already in
   the HTML.
3. Add `src/app/test/page.tsx` that returns `<h1>Test</h1>`, and open `/test/`. Delete it afterwards.
4. Add `console.log("render Hero")` to `Hero`. Where does it print: the browser console or the terminal? Remove it.

## Check yourself

- `getContent()` is called in `generateMetadata`, in `LocalBusinessJsonLd` and in `Home`. Does that mean three
  requests to Sanity? (Look at `cached` in [`fetch.ts`](../src/content/fetch.ts).)
- Why can `Hero` be `async`-free and still show CMS text?
- What would break if you added `useState` to `Footer.tsx` without `"use client"`?

---

Previous: [Lesson 0](00-big-picture.md) · Next: [Lesson 2: Static export](02-nextjs-static-export.md)
