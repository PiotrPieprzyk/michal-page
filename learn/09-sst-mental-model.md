# Lesson 9: SST mental model

**Why:** all the AWS infrastructure (bucket, Lambdas, CDN, email, alarms, budget, CI role) and the deployment of the site
come from one file, [`sst.config.ts`](../sst.config.ts). If you know Terraform, you already know most of the ideas;
this lesson maps them.

## Learn

**What SST is.** SST is an infrastructure-as-code framework in TypeScript. Under the hood it runs **Pulumi**'s engine,
which uses the same providers as Terraform (bridged). On top of that it adds:

- **components**: high-level building blocks such as `sst.aws.StaticSite` or `sst.aws.Function` that create a dozen
  resources each with good defaults (lesson 10);
- **linking**: resources given to a function become typed objects in its code, with IAM permissions (lesson 10);
- a CLI with **stages**, **secrets** and a **dev mode** with live Lambdas (lessons 11, 13).

It's declarative like Terraform: `run()` describes the desired end state, and the engine diffs it against the stored
state and applies the difference in dependency order.
Docs: [SST docs](https://sst.dev/docs/), [basics](https://sst.dev/docs/basics/).

**Anatomy of [`sst.config.ts`](../sst.config.ts):**

```ts
/// <reference path="./.sst/platform/config.d.ts" />   // types for the globals below (generated)

export default $config({
  app(input) {            // runs first, for every command: app-level settings
    return { name, removal, protect, home, providers };
  },
  async run() {           // describes the resources for the current stage
    const bucket = new sst.aws.Bucket("Uploads", {...});
    ...
    return { site: site.url, ... };   // outputs, printed after deploy
  },
});
```

Globals available in the file: `$config`, `$app` (`$app.stage`, `$app.name`), `$dev`, `$interpolate`, and the
namespaces `sst` (components), `aws`, `cloudflare`, `random` (raw provider resources). No imports needed.
Docs: [config reference](https://sst.dev/docs/reference/config/).

**`app()` settings used here:**

| Setting | Value | Meaning |
|---|---|---|
| `name` | `michal-page` | Prefix of every resource name, and the state key |
| `home` | `aws` | Where SST keeps the state (below) |
| `providers` | `aws` (region), `cloudflare: "6.23.1"`, `random: "4.21.4"` | Providers to install, with pinned versions (like `required_providers`) |
| `removal` | `retain` on production, `remove` elsewhere | What `sst remove` does with data resources such as buckets: keep them or delete them |
| `protect` | `true` on production | `sst remove` refuses to run for that stage (like `prevent_destroy` for the whole app) |

**Stages.** Every command runs against a **stage**: `--stage production`, or your **personal stage** by default (its
name is stored in `.sst/stage`). Each stage is a complete, separate copy of the app with its own state, resources and
secrets. The code branches on `$app.stage` where stages must differ (lesson 13).

**State.** With `home: "aws"`, SST bootstraps (once per account and region, automatically) an S3 bucket `sst-state-<hash>`
for state, an assets bucket for function packages, and an SSM parameter per app+stage holding the passphrase that
encrypts secrets in the state. That solves Terraform's "who creates the state bucket" bootstrap problem for you.
Docs: [state](https://sst.dev/docs/state/), [providers](https://sst.dev/docs/providers/).

**Terraform → SST:**

| Terraform | SST | Notes |
|---|---|---|
| `resource "aws_sns_topic_subscription" "x"` | `new aws.sns.TopicSubscription("X", {...})` | Raw provider resource, same arguments in camelCase |
| a module | a component (`new sst.aws.Bucket("X")`) | Components are classes with sensible defaults |
| reference `aws_x.y.id` | `x.id` (an `Output`) | Creates the dependency, like in Terraform (lesson 10) |
| `data "..."` | `Email.get("Sender", id)`, `aws.getX(...)` | Read existing resources |
| `output` | the object returned from `run()` | Also written to `.sst/outputs.json` |
| `terraform plan` | `sst diff --stage x` | There's no saved plan file: `deploy` computes the diff again |
| `terraform apply` | `sst deploy --stage x` | Also builds and uploads the functions and the site |
| `terraform destroy` | `sst remove --stage x` | Respects `removal` and `protect` |
| workspaces / env dirs | `--stage` | One state per stage |
| `terraform refresh` / drift | `sst refresh` | |
| `force-unlock` | `sst unlock` | After an interrupted deploy |
| `required_providers` | `providers` in `app()` | |
| `random_password` | `random.RandomPassword` | Same provider, same caveat: the value is in the state (encrypted here, lesson 11) |

Docs: [CLI reference](https://sst.dev/docs/reference/cli/), [workflow](https://sst.dev/docs/workflow/).

## Read in the repo

[`sst.config.ts`](../sst.config.ts) top to bottom, just to recognise the structure: `app()`, then in `run()` secrets →
bucket → SES → functions → site → alarms → production-only resources → outputs. `.sst/` is git-ignored (generated
types, logs, local cache); [`sst-env.d.ts`](../sst-env.d.ts) is generated but committed.

## Do

1. [Lab 02](examples/02-sst-hello/sst.config.ts), steps 1, 2 and 5: deploy a bucket + function to a stage named
   `learn`, preview a change with `diff`, and remove it. Costs ~$0.
2. Then, read-only, against production:
   ```
   node scripts/sst.mjs diff --stage production
   ```
   Expect no infrastructure changes. Find the S3 state bucket `sst-state-*` in the console and look for this app's
   state object.

## Check yourself

- You run `sst remove --stage production`. What happens, and which line decides it? And with `--stage learn` in lab 02?
- Where is the Terraform "bootstrap" step in SST, and what does it create?
- Why does `app()` receive `input.stage`, while `run()` reads `$app.stage`?
- `providers.aws` has no version, while `cloudflare` and `random` do. Where does the AWS provider version come from?
  (Hint: it's pinned by the SST version in `package.json`.)

---

Previous: [Lesson 8](08-content-pipeline.md) · Next: [Lesson 10: Components, linking and outputs](10-sst-components-linking.md)
