# Plan: landing page for an arborist company ("Wycinka drzew")

## Context
The repo is empty apart from `design-handoff/` (a spec in `HANDOFF.md` plus 14 `.dc.html` mockups, about 130 KB). We need a one-page Polish landing site with these requirements:
- It matches the mockups at 375 px and 1440 px and follows HANDOFF.md exactly.
- Every text and image can be edited in Sanity.
- A quote form sends the fields plus photos by email, handled by an AWS Lambda.
- It's served at `michal.piotrpieprzyk.com` (DNS on Cloudflare).
- It costs about $0–2 a month, because traffic will be low.

## Architecture (lowest cost)

```
Browser ──► CloudFront + S3  (static Next.js 16 export, SST StaticSite)
   │            ▲ rebuilt by GitHub Actions when content is published in Sanity (Sanity webhook → repository_dispatch)
   │
   ├──► cdn.sanity.io  (images: resized, AVIF/WebP, srcset, all on Sanity's CDN)
   ├──► Lambda "upload-url" (Function URL) → presigned S3 PUT → browser uploads each photo straight to S3 (XHR gives a progress bar)
   └──► Lambda "submit" (Function URL) → checks Turnstile and validates input → reads photos from S3 → SES raw email with the photos attached and 7-day links
```

Key decisions:
- **The Next.js site is a static export (`output: 'export'`), not SSR or OpenNext.** That means no server Lambda, no ISR queue and no DynamoDB, so hosting is S3 plus CloudFront: effectively $0 inside CloudFront's always-free 1 TB and 10M requests. The trade-off is that a Sanity edit goes live about 2–3 minutes after publishing, once the rebuild finishes. That's fine for a landing page.
- **Images come from the Sanity image CDN** through a custom `next/image` loader built on `@sanity/image-url`. Static export can't use Next's own image optimizer, so Sanity's CDN does the resizing and AVIF/WebP. The hero image is preloaded with `priority`, and every other image is lazy-loaded.
- **Sanity Studio** lives in `studio/` and is deployed for free to `<name>.sanity.studio` with `sanity deploy`. The Sanity free plan covers this.
- **Photo uploads go straight to S3** (private bucket, CORS set to the site origin, objects deleted after 30 days), never through Lambda. This avoids Lambda's 6 MB payload limit and gives real per-file progress for the `uploading` state.
- **Email goes through SES.** The sender is a domain identity on `michal.piotrpieprzyk.com`, with DKIM records created in Cloudflare by SST. The owner's address is a verified identity, so the SES **sandbox is enough** and no production-access request is needed. Photos are compressed on the device to a 2000 px long edge, so 5 attachments fit easily under the SES 40 MB limit. The email also includes presigned links as a backup.
- **Spam protection:** Cloudflare Turnstile (free, works in DNS-only mode, verified in the Lambda) plus a honeypot field.
- **Domain:** `domain: { name: "michal.piotrpieprzyk.com", dns: sst.cloudflare.dns() }`. SST creates the ACM certificate in us-east-1 and the CNAME in Cloudflare, with the proxy off (CloudFront terminates TLS). This needs a `CLOUDFLARE_API_TOKEN` and no Route 53, which saves $0.50 a month.
- **Region:** `eu-central-1` (Frankfurt), the closest to Poland. Lambdas run Node 22 on arm64.

### Estimated monthly cost
| Item | Cost |
|---|---|
| S3 + CloudFront (static site, uploads) | ~$0.00–0.10 |
| Lambda (2 functions, about 100 calls) | $0 (always-free tier) |
| SES (about 50 emails) | <$0.01 |
| Sanity Free, Cloudflare Free, Turnstile, GitHub Actions | $0 |
| PostHog (under 1M events) | $0 |
| **Total** | **well under $1, with an AWS Budget alert at $2** |

## Analytics and monitoring (recommendation)
- **Analytics: PostHog Cloud EU, in cookieless mode** (`cookieless_mode: 'always'` or `persistence: 'memory'`). It's free up to 1M events, you already know it, and there's no cookie banner under GDPR/RODO. That makes it *less* effort than GA4, which needs a consent banner plus Consent Mode v2 in the EU and gives worse data when visitors decline. Custom events:
  - `call_click`, with a property for where it was clicked: hero, header, sticky_bar, services_cta, pricing, footer
  - `photo_cta_click`
  - `form_started`, `form_upload_error`, `form_submitted`
  - `gallery_filter`, `gallery_slider_used`

  Set up a "call or form" conversion funnel. Session replay stays off by default, because it would need consent.
- **Optional:** Cloudflare Web Analytics, a free cookieless beacon, as a zero-effort backup traffic counter.
- **Monitoring (all free):**
  - a CloudWatch alarm on Lambda `Errors > 0` and on SES bounces, sent by SNS to your email
  - an AWS Budget alert at $1 and $2
  - PostHog exception capture on the front end
  - a weekly test submission is optional

  Uptime monitoring isn't needed for S3 + CloudFront.

## Repo layout
```
/                       Next.js 16 app (App Router, TS, Tailwind v4, Turbopack)
  sst.config.ts         StaticSite, Bucket, 2 × Function, Email, Secrets, alarms, budget
  src/app/              layout.tsx (Archivo via next/font, latin-ext; lang="pl"; JSON-LD; metadata), page.tsx
  src/components/ui/    Button, Section, Eyebrow, Icon (lucide-react), SanityImage, Placeholder (striped + shot label)
  src/components/sections/  Header, Hero, TrustRow, Services, Gallery(+BeforeAfterSlider), Pricing, QuoteForm, Footer, StickyBar, StickyHeader
  src/content/          types.ts (LandingContent), query.ts (GROQ), fetch.ts, seed.json (all copy from the mockups)
  src/lib/              analytics.ts, image-compress.ts, upload.ts, sanity-image.ts
  functions/            upload-url.ts, submit.ts, email-template.ts
  studio/               Sanity Studio (schemas, desk structure, seed import script)
  .github/workflows/deploy.yml   on push to main + repository_dispatch "sanity-publish"; concurrency group with cancel-in-progress
```

## Sanity content model (every text and image editable)
- **`siteSettings` (singleton):** company name, founding year, city, phone (one source; `tel:` links are built from it), email, address, NIP, hours text, closing hour, service radius, callback promise, SEO title and description, OG image, `areaServed` list. Used by JSON-LD and everywhere a `[placeholder]` from HANDOFF section 8 appears.
- **`landingPage` (singleton)** with one object per section:
  - `header`: nav labels
  - `hero`: eyebrow, H1, lead, CTA labels, badge, image
  - `trust`: items, each with an icon and a label
  - `services`: heading, 6 cards, permits note, CTA box
  - `gallery`: heading, filter labels, before/after pairs with category, caption and location, "more" button
  - `pricing`: rows, free rows, VAT note, factors checklist, CTA
  - `form`: all labels, placeholders, limits text, every state message, validation errors, success texts, consent text, privacy link
  - `footer`
  - `stickyBar`: online and offline lines
- **Images** are `image` fields with `hotspot`, a required `alt`, and a `placeholderLabel` (the shot-list text). When no photo is uploaded, the striped placeholder shows that label, as HANDOFF section 7 asks.
- **Icons** are picked from a fixed list of the Lucide names in HANDOFF, so there are no free-form icons.
- `sanity typegen` generates the TS types. The GROQ projection returns exactly the shape of `LandingContent`, so components never depend on Sanity directly.
- A seed script imports `seed.json`, so the Studio starts with all the mockup copy filled in.

## Implementation phases
1. **Scaffold and infra:** `create-next-app` (Next 16, Tailwind v4), `sst init`, StaticSite with the Cloudflare domain, then deploy a hello page to `michal.piotrpieprzyk.com`.
2. **Design system and content extraction:**
   - Tokens from HANDOFF section 2 go into the Tailwind v4 `@theme`: colours, type scale, radii, spacing, section padding, a 1280 px container with 80/16 px gutters.
   - Archivo is loaded with `next/font`.
   - Build the UI primitives.
   - Read **all** mockups once and pull every string into `seed.json`, typed by `types.ts`.
3. **Sanity:** schemas matching `types.ts`, typegen, seed import, GROQ query, build-time fetch, `sanity deploy`.
4. **Sections A:** Header, Hero A, TrustRow, Services, StickyBar (IntersectionObserver on the hero CTA, < 768 px, 200 ms slide, reduced motion, safe-area padding), StickyHeader (≥ 768 px, 72 px).
5. **Sections B:**
   - Gallery: chips with `aria-pressed`, and a slider built on `clip-path` with an invisible stretched `<input type="range">`, a focus ring on the handle, and pointer drag and tap.
   - Pricing: a real `<table>`, 2 columns on mobile and 3 on desktop.
   - Footer: 104 px bottom padding on mobile.
6. **Quote form and backend:**
   - A form state machine covering empty, uploading, ready, sent and error.
   - Validation on blur and on submit, with the `aria-invalid` and `aria-describedby` wiring.
   - Type and size checks on the device (JPG/PNG/HEIC, 10 MB, 5 files).
   - Canvas compression to 2000 px. HEIC is sent as-is when the browser can't decode it.
   - XHR upload with progress, cancel and retry.
   - Turnstile.
   - The `upload-url` and `submit` Lambdas: zod validation, checks that the S3 keys exist, and an SES `SendEmail` raw MIME message with the attachments.
   - Secrets: `TurnstileSecret`, `RecipientEmail`.
7. **SEO, analytics, ops:**
   - Metadata, LocalBusiness JSON-LD and OG image from Sanity.
   - PostHog events.
   - CloudWatch alarms, SNS and the Budget alert.
   - A GitHub Actions deploy job that uses AWS OIDC (no long-lived keys), plus a Sanity webhook (GROQ filter `_type in ["siteSettings","landingPage"]`) that calls GitHub `repository_dispatch` with a fine-grained token.
8. **QA:** visual comparison and the accessibility checklist (see Verification).

## Splitting the work between agents (minimal tokens, consistent result)
Principle: **the orchestrator (main session) never reads the mockups.** Each mockup is read by exactly one worker. Shared decisions live in files: `types.ts`, the tokens in `globals.css`, and the `ui/` primitives. Each worker gets a short brief that names only the files it may read.

| Step | Agent | Model | Reads | Produces |
|---|---|---|---|---|
| A | Foundation (phases 1–2) | Opus | HANDOFF.md and **all** mockups (the only full read) | scaffold, SST, tokens, primitives, `types.ts`, `seed.json`, plus `docs/conventions.md` (≤ 1 page: class naming, how to use primitives, breakpoints) |
| B | Sanity (phase 3) | Sonnet | `types.ts`, `seed.json`, conventions | studio, schemas, query, fetch, seed |
| C1 | Sections A (phase 4) | Sonnet | its HANDOFF sections, `mobile`+`desktop` 01, 02, 06, `types.ts`, `ui/`, conventions | components |
| C2 | Sections B (phase 5) | Sonnet | HANDOFF sections, 03, 04, 07, same shared files | components |
| C3 | Form and Lambdas (phase 6) | Opus (most logic) | HANDOFF sections 3.6 and 4 (form), 05 mockups, same shared files | form, functions, SST resources |
| D | Ops (phase 7) | Sonnet | `sst.config.ts`, `layout.tsx`, conventions | SEO, analytics, CI, alarms |
| E | QA (phase 8) | Opus | screenshots, not source dumps | fix list, which goes back to the owning step's agent via SendMessage (its context is still warm) |

- B, C1, C2 and C3 can run **in parallel**, because they all depend only on step A's outputs (each in its own git worktree, merged by the orchestrator). Running them one after another in a single session also works and costs about the same, because each brief is small.
- Sections take `LandingContent` slices as props, and `seed.json` feeds them until Sanity is wired up. So the section work never waits on Sanity.
- Haiku isn't worth using for this; the steps need design accuracy.

## Verification
- `npm run build` (static export) and `sst dev` run locally; the form reaches the real Lambda and S3 in a dev stage.
- **Visual check:** open each `.dc.html` and the built page in Chrome (claude-in-chrome) at 375 and 1440 px, compare screenshots section by section, and fix any drift. Also check for horizontal scroll at 320, 768 and 1024 px.
- **Accessibility:** go through the HANDOFF section 5 checklist (tap targets ≥ 48 px, labels, aria, focus rings, landmarks, reduced motion, Polish characters at weight 800). Run Lighthouse with accessibility and performance at ≥ 95 or better.
- **Form, end to end:** valid submit with 3 photos sends an email with attachments to the recipient; a 14 MB file gives the error state; an empty phone number gives the validation message; a Turnstile failure is rejected.
- **CMS round trip:** edit the hero H1 in the Studio and publish; the webhook triggers the GitHub Action and the change is live in about 3 minutes.
- **Analytics:** PostHog live events show `call_click` and `form_submitted`, and no cookies are set (checked in DevTools).
- **Cost:** check Cost Explorer after the first week; the budget alert is active.

## Prerequisites from you
An AWS account with SSO, a Cloudflare API token (Zone:DNS:Edit on `piotrpieprzyk.com`), a Sanity account, a PostHog EU project key, a GitHub repo, and the recipient email address. Real company details and photos can come later, because placeholders are editable in Sanity.
