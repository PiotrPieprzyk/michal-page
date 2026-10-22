# Lesson 14: Deploy, CI and monitoring

**Why:** production is deployed by GitHub Actions on every push to `main` and on every Sanity publish, with no AWS keys
stored anywhere. And because nobody watches a landing page all day, failures and costs report themselves by email.

## Learn

**One deploy command, two places.** Locally: `npm run deploy` = `node scripts/sst.mjs deploy --stage production`
(lesson 11). In CI: [`deploy.yml`](../.github/workflows/deploy.yml) runs `npx sst deploy --stage production`. Both do
the same: update the infrastructure, build the site with the current Sanity content, upload it, invalidate CloudFront.

**The workflow, step by step:**

1. **Triggers**: push to `main`, `repository_dispatch` of type `sanity-publish` (lesson 8), or a manual run.
2. **`concurrency`**: one deploy at a time; a newer trigger cancels the running one. (If a deploy is cancelled
   half-way, the state may stay locked; `sst unlock --stage production` clears it.)
3. **`permissions: id-token: write`** lets the job request an OIDC token from GitHub.
4. `npm ci`, then **`aws-actions/configure-aws-credentials`** exchanges that token for temporary AWS credentials by
   assuming the role in `vars.AWS_DEPLOY_ROLE_ARN`.
5. `npx sst deploy` with the non-AWS config as env vars: Cloudflare token (secret), PostHog key, Sanity IDs, Turnstile
   site key.

**OIDC instead of AWS keys.** The trust relationship lives in [`sst.config.ts`](../sst.config.ts) (production only):

- `aws.iam.OpenIdConnectProvider` registers GitHub's token issuer in the account.
- `aws.iam.Role("GithubDeployRole")` trusts tokens whose `aud` is `sts.amazonaws.com` and whose `sub` matches
  `repo:<owner>@<id>/<repo>@<id>:ref:refs/heads/main`: only workflows on `main` of *this* repo.
- This repo uses GitHub's **immutable subject** format (owner and repo IDs, not just names), so renaming or re-creating
  a repo with the same name can't inherit access. That's also why the workflow has no `environment:` key: it would
  change the `sub` claim, and the role would refuse it.

Docs: [GitHub OIDC with AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

**The bootstrap order.** The role is created by `sst deploy` itself, so the very first deploy must run locally. Then
[`setup-github.mjs`](../scripts/setup-github.mjs) reads the role ARN and stores it, plus the other values, as repo
secrets and variables with `gh`. From then on, CI can deploy.

**The role has `AdministratorAccess`.** SST deploys many kinds of resources (IAM, CloudFront, Lambda, SES, Budgets...),
so a narrow policy is real work to maintain. The risk is contained by the trust policy: only `main` of this repo can
assume it, for at most an hour. Lesson 15 comes back to this.

**Monitoring and cost guard** (all in [`sst.config.ts`](../sst.config.ts)):

- `SnsTopic("Alerts")` + an email `TopicSubscription` to `AlertEmail`. AWS emails a confirmation link first; until it's
  clicked, nothing is delivered.
- One `aws.cloudwatch.MetricAlarm` per Lambda: `Errors > 0` in a 5-minute window → `Alerts`. `treatMissingData:
  "notBreaching"` keeps a quiet function from alarming.
- The `Sender` email identity sends **bounce, complaint, reject and rendering-failure** events to the same topic.
- `aws.budgets.Budget`: $2/month, emails at 50% and 100% actual and 100% forecast. It's a notification, not a cap.

## Read in the repo

[`deploy.yml`](../.github/workflows/deploy.yml) (all of it), the `// --- GitHub Actions deploys via OIDC`, `// ---
Monitoring` and `// --- Cost guard` blocks of [`sst.config.ts`](../sst.config.ts), and
[`scripts/setup-github.mjs`](../scripts/setup-github.mjs).

## Do

1. In GitHub → Actions, open the latest *Deploy* run. Find the `configure-aws-credentials` step's output and the SST
   resource summary.
2. In AWS IAM → Roles → `michal-page-github-deploy` → Trust relationships: match each condition to the explanation above.
3. In CloudWatch → Alarms: find both alarms and their state. In Budgets: find `MonthlyBudget`.
4. Optional: deploy your personal stage (`node scripts/sst.mjs deploy`), confirm the new SNS subscription email (each
   stage has its own topic), break `submit.ts` (throw at the top), deploy again, send the form, and wait for the alarm
   email. Fix it and `remove` the stage.

## Check yourself

- A teammate opens a pull request from a fork that changes `deploy.yml` to print AWS credentials. Can it get any? Why?
- Why can't the very first production deploy happen in CI?
- The budget hits 100%. What stops working? (Trick question.)
- Someone adds `environment: production` to the job for a nicer GitHub UI. What breaks, and how would you fix it on the
  AWS side?

---

Previous: [Lesson 13](13-sst-dev-and-stages.md) · Next: [Lesson 15: Best practices](15-best-practices.md)
