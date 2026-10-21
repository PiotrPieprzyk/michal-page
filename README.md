# Wycinka drzew — landing page

One-page Polish site for an arborist company, served at **https://michal.piotrpieprzyk.com**.
Spec: `design-handoff/HANDOFF.md` · Plan: `PLAN.md` · Code conventions: `docs/conventions.md`.

```
Browser ──► CloudFront + S3 (static Next.js export, SST StaticSite)
   ├──► cdn.sanity.io (images, AVIF/WebP, srcset)
   ├──► Lambda UploadUrl (POST → presigned S3 PUT; GET → signed photo link from the email)
   └──► Lambda Submit (honeypot + Turnstile + zod → reads photos from S3 → SES raw email with attachments)
Sanity publish ──webhook──► GitHub repository_dispatch ──► Actions: sst deploy (≈ 2–3 min)
```

## Day-to-day

| Task | Command |
|---|---|
| Local dev (seed or Sanity content, no backend) | `npm run dev` → http://localhost:3000 |
| Local dev with real Lambdas (dev stage) | `npm run sst:dev` |
| Static build | `npm run build` (→ `out/`) |
| Deploy production | `npm run deploy` |
| Edit content | https://&lt;studio-host&gt;.sanity.studio (or `cd studio && npm run dev`) |
| Set an SST secret | `node scripts/sst.mjs secret set <Name> <value> --stage production` |

`scripts/sst.mjs` loads `.env` and maps `CLOUD_FLARE_TOKEN` → `CLOUDFLARE_API_TOKEN` before calling the SST CLI.

## First-time setup (in this order)

1. **Deploy production**: `npm run deploy`
   - Creates the site, the bucket, both Lambdas, SES (domain DKIM in Cloudflare), alarms, the $2 budget and the GitHub OIDC role.
   - **Check your inbox** (`piotr.pieprzyk.pp+michalpage@gmail.com`) and click:
     - the **Amazon SES verification** link: without it no quote email can be delivered (SES sandbox);
     - **two "AWS Notification – Subscription Confirmation"** links (alarms topic + budget alerts).
2. **Sanity**: `node scripts/setup-sanity.mjs`
   - Logs you in (browser), creates the free project + public dataset, imports all mockup copy, deploys the Studio.
   - Creates the publish webhook (asks for a fine-grained GitHub token, *Contents: read & write* on this repo only).
   - Then `npm run deploy` again so the site reads from Sanity.
3. **Turnstile (spam protection)**: `node scripts/setup-turnstile.mjs`
   - The current Cloudflare token only has DNS rights, so this will probably ask you to create the widget in the dashboard (Turnstile → Add widget, hostname `michal.piotrpieprzyk.com`, mode *Managed*) and run `node scripts/setup-turnstile.mjs <siteKey> <secretKey>`.
   - Until then the form is protected by a honeypot field and a timing check only.
4. **GitHub Actions**: `node scripts/setup-github.mjs` (stores the role ARN, Cloudflare token, PostHog key and Sanity ids in the repo), then push `main`.
5. **PostHog**: in project settings, create the funnel `call_click OR form_submitted`. Events sent: `call_click {location}`, `photo_cta_click`, `form_started`, `form_upload_error`, `form_submitted`, `gallery_filter`, `gallery_slider_used`. No cookies, no localStorage (`persistence: "memory"`).

## Secrets & config

| Name | Where | Notes |
|---|---|---|
| `CLOUD_FLARE_TOKEN` | `.env` | Zone DNS edit on piotrpieprzyk.com |
| `POSTHOG_PROJECT_TOKEN` | `.env` | public key, EU cloud |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | `.env` (written by setup-sanity) | |
| `TURNSTILE_SITE_KEY` | `.env` (written by setup-turnstile) | public |
| `TurnstileSecret` | SST secret | default `none` = Turnstile disabled |
| `RecipientEmail` | SST secret | default `piotr.pieprzyk.pp+michalpage@gmail.com`; a new address must be verified in SES too |
| `AlertEmail` | SST secret | alarms + budget emails |

`.env` is git-ignored. Never commit it — the GitHub repo is public.

## Before launch (HANDOFF §8)

Fill in every `[placeholder]` in Sanity → *Dane firmy i SEO* (name, year, city, phone, e-mail, address, NIP, hours, radius) and the prices in *Strona główna → Cennik*. Upload real photos (no stock / AI); until then the striped placeholders show which shot is needed. Confirm the claims listed in HANDOFF §8 and review the privacy-policy template.
