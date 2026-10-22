# Lesson 12: The backend functions

**Why:** the only server-side code at runtime is two small Lambdas in [`functions/`](../functions). They're ordinary
TypeScript, but they encode several security and AWS-limit decisions worth knowing.

## Learn

**Function URLs instead of API Gateway.** `url: { cors }` gives each Lambda its own HTTPS endpoint, free, with CORS
handled by AWS. The event format is the same as API Gateway HTTP API v2, hence `APIGatewayProxyEventV2`. One function can
serve several methods by switching on `event.requestContext.http.method`.
Docs: [Lambda function URLs](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html).

**[`upload-url.ts`](../functions/upload-url.ts), POST: presigned upload.**

- Lambda request payloads are limited to 6 MB, and photos are up to 10 MB. So the Lambda never sees the photo: it
  validates `{name, type, size}` with zod and returns a **presigned S3 PUT URL**, valid 5 minutes.
- `ContentType` and `ContentLength` are part of the signature (`signableHeaders`), so the browser can only upload
  *exactly* the declared type and size. Size checking is enforced by S3 itself.
- The key `uploads/<date>/<uuid>/<safe-name>` is unguessable and sanitized.
- The bucket only accepts browser PUTs from the site's origin (CORS in `sst.config.ts`) and deletes objects after 30
  days (lifecycle).

Docs: [presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html).

**[`upload-url.ts`](../functions/upload-url.ts), GET: long-lived photo links.** The email should link to the photos
for weeks, but a presigned URL created by a Lambda dies with the Lambda's temporary credentials (hours). So the email
contains links back to this function with `?k=<key>&e=<expiry>&s=<signature>`. The function checks an HMAC
([`photo-link.ts`](../functions/photo-link.ts): SHA-256 over `key\nexpiry`, compared with `timingSafeEqual`) and
redirects to a **fresh** 10-minute presigned GET.

**[`submit.ts`](../functions/submit.ts): validate, filter, send.**

1. **zod** parses the body. The phone rule matches `isValidPhone` in `QuoteForm.tsx`; photo keys must match the exact
   `uploads/...` pattern, so a caller can't make the function read arbitrary objects.
2. **Bots**: a filled honeypot or `elapsedMs < 2000` returns a *fake* success (`200 {ok: true}`), so bots learn nothing.
3. **Turnstile**: the token is verified server-side against Cloudflare's `siteverify`, skipped while the secret is
   `"none"`. Docs: [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
4. **Photos**: `HeadObject` proves each one exists and checks the size; photos are attached while the total stays under
   25 MB (SES's raw message limit is 40 MB after base64's +33%), and every photo also gets a signed link.
5. **Email**: SES `SendEmail` with a hand-built raw MIME message (`multipart/mixed` → `multipart/alternative` text +
   HTML, then attachments). Non-ASCII headers and file names are encoded (RFC 2047/2231): this is a Polish site.
   `ConfigurationSetName: Resource.Sender.configSet` routes bounces and complaints to the alerts topic (lesson 14).

**SES sandbox.** A new SES account can only send *to verified addresses*. That's fine here, because the only recipient
is the owner, whose address is verified as an identity (`new sst.aws.Email("Recipient", ...)` on production). Changing
the recipient means verifying the new address too.
Docs: [SES production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html).

**Limits live in two places.** 5 files, 10 MB, JPG/PNG/HEIC/WebP appear in
[`image-compress.ts`](../src/lib/image-compress.ts) (UX) and in `functions/*` (enforcement).
[`docs/conventions.md`](../docs/conventions.md) asks you to keep them in sync.

## Read in the repo

[`functions/upload-url.ts`](../functions/upload-url.ts), [`functions/photo-link.ts`](../functions/photo-link.ts),
[`functions/submit.ts`](../functions/submit.ts), [`functions/email-template.ts`](../functions/email-template.ts) (skim),
and the browser side again in [`src/lib/upload.ts`](../src/lib/upload.ts).

## Do

With `npm run sst:dev` running (lesson 13), take the `UploadUrl` URL from the output and call it (bash syntax):

```
curl -i -X POST "$UPLOAD_URL" -H 'content-type: application/json' -d '{"name":"a.jpg","type":"image/jpeg","size":1000}'
curl -i -X POST "$UPLOAD_URL" -H 'content-type: application/json' -d '{"name":"a.gif","type":"image/gif","size":1000}'
```

The first returns a presigned URL, the second a 400. Then try to PUT a 2000-byte file to the first URL and read S3's
error. Calls run on your machine in dev mode: the logs appear in the `sst dev` terminal.

## Check yourself

- Why does the bot branch return 200 instead of 400?
- An attacker sends `photos: [{ key: "../../secret.txt" }]`. Which line stops it? And `uploads/2026-01-01/<valid uuid>/x.jpg`
  that doesn't exist?
- Why does the email contain signed links to the Lambda instead of presigned S3 URLs?
- What happens to a quote with five 10 MB photos?

---

Previous: [Lesson 11](11-sst-secrets-config.md) · Next: [Lesson 13: Local dev and stages](13-sst-dev-and-stages.md)
