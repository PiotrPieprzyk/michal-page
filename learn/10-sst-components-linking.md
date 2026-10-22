# Lesson 10: Components, linking and outputs

**Why:** [`sst.config.ts`](../sst.config.ts) is about 250 lines, but it creates dozens of AWS and Cloudflare
resources. Components hide most of them, linking wires them into the Lambda code, and outputs carry values between
them.

## Learn

**Components used here:**

| Component | Creates (roughly) | Docs |
|---|---|---|
| `sst.aws.StaticSite("Site")` | Runs the build, an S3 bucket for `out/`, a CloudFront distribution with a router, an ACM certificate (us-east-1) and DNS records for the domain, and CloudFront invalidation on each deploy | [StaticSite](https://sst.dev/docs/component/aws/static-site/) |
| `sst.aws.Function("Submit")` | Bundles `functions/submit.ts` with esbuild, the Lambda, an IAM role, a log group and a **Function URL** with CORS | [Function](https://sst.dev/docs/component/aws/function/) |
| `sst.aws.Bucket("Uploads")` | A private S3 bucket, CORS rules, lifecycle (delete after 30 days) | [Bucket](https://sst.dev/docs/component/aws/bucket/) |
| `sst.aws.Email("Sender")` | An SES domain identity with DKIM/DMARC records in Cloudflare, a configuration set, event destinations to SNS | [Email](https://sst.dev/docs/component/aws/email/) |
| `sst.aws.SnsTopic("Alerts")` | An SNS topic | [SnsTopic](https://sst.dev/docs/component/aws/sns-topic/) |
| `sst.Secret("TurnstileSecret")` | An encrypted value per stage (lesson 11) | [Secret](https://sst.dev/docs/component/secret/) |

`sst.cloudflare.dns()` is a DNS **adapter**: wherever a component needs DNS records (the site domain, SES DKIM), they're
created in Cloudflare instead of Route 53. Docs: [custom domains](https://sst.dev/docs/custom-domains/),
[Cloudflare DNS](https://sst.dev/docs/component/cloudflare/dns/).

**Raw resources** fill the gaps: `aws.sns.TopicSubscription`, `aws.cloudwatch.MetricAlarm`, `aws.budgets.Budget`,
`aws.iam.OpenIdConnectProvider`/`Role`/`RolePolicyAttachment`, `random.RandomPassword`. They are plain Pulumi resources,
with the same arguments as the Terraform ones. Docs: [Pulumi AWS provider](https://www.pulumi.com/registry/packages/aws/).

**Referencing existing resources.** SES identities are account-wide, so only production creates `Sender`; other stages
call `sst.aws.Email.get("Sender", DOMAIN)`, which looks up the existing identity without managing it (like a Terraform
data source). Docs: [sharing across stages](https://sst.dev/docs/share-across-stages/).

**Linking.** `link: [uploads, sender, turnstileSecret, recipientEmail]` on the `Submit` function does two things:

1. **Permissions**: the function's IAM role gets what it needs on each linked resource (S3 actions on that bucket,
   SES send for that identity). No hand-written IAM policy.
2. **Values in code**: inside the function, `import { Resource } from "sst"` gives typed access:
   `Resource.Uploads.name`, `Resource.Sender.configSet`, `Resource.TurnstileSecret.value`. The values are encrypted
   into the function bundle at deploy time.

[`sst-env.d.ts`](../sst-env.d.ts) is the generated type declaration that makes `Resource.Uploads` type-check. It
lists every linkable resource in the app. Docs: [linking](https://sst.dev/docs/linking/),
[SDK](https://sst.dev/docs/reference/sdk/).

**`link` vs. `environment`.** Both reach the function. `environment` is a plain Lambda env var: visible in the AWS
console, not typed, no permissions. Here `environment` carries non-secret config (`FROM_ADDRESS`, `SITE_URL`,
`PHOTO_LINK_BASE`) **and** `PHOTO_LINK_KEY`, the HMAC key. Keep that in mind for lesson 15.

**Outputs.** `uploadFn.url` isn't a string when `run()` executes: the function doesn't exist yet. It's an
`Output<string>`, a promise-like value that resolves during deploy. Passing an Output into another resource's arguments
(e.g. `PHOTO_LINK_BASE: uploadFn.url`, or the site's `NEXT_PUBLIC_UPLOAD_URL`) creates a **dependency edge**, exactly
like a reference in Terraform. To transform one, use `.apply()`, as in the OIDC role's `assumeRolePolicy`:
`oidc.arn.apply((arn) => JSON.stringify({...}))`, or ``$interpolate`https://${output}/x` `` for strings.
Docs: [Pulumi inputs and outputs](https://www.pulumi.com/docs/iac/concepts/inputs-outputs/).

**How the Lambda URLs end up in the browser bundle:** `StaticSite.environment` sets env vars for the **build
command**. So SST must create both functions first, wait for their URLs, then run `npm run build` with
`NEXT_PUBLIC_UPLOAD_URL=https://...lambda-url...`, which Next inlines into the JS (lesson 3). The dependency graph does
the ordering for you.

## Read in the repo

[`sst.config.ts`](../sst.config.ts) again, this time slowly: every `link`, every `environment`, every Output passed
between resources. Then [`sst-env.d.ts`](../sst-env.d.ts) and the `Resource.*` uses in
[`functions/submit.ts`](../functions/submit.ts) and [`functions/upload-url.ts`](../functions/upload-url.ts).

## Do

[Lab 02](examples/02-sst-hello/sst.config.ts), steps 1–2 (if not done yet). Then, in its `hello.ts`, use a resource you
didn't link (e.g. remove `bucket` from `link` in the config) and deploy: what fails first, the types or the S3 call? Undo
it and `remove` the stage.

## Check yourself

- Draw the dependency chain from `uploads` (the bucket) to the HTML file of the site. Which edges are `link`, which are
  Outputs in `environment`?
- Why can't `run()` do `console.log(uploadFn.url)` and print the URL?
- The `Submit` function never calls `s3:PutObject`. Does linking the bucket still grant it? What would least privilege
  look like here?
- Non-production stages use `Email.get`. What happens on `sst remove --stage dev` to the SES identity?

---

Previous: [Lesson 9](09-sst-mental-model.md) · Next: [Lesson 11: Secrets and configuration](11-sst-secrets-config.md)
