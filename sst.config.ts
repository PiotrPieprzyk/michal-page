/// <reference path="./.sst/platform/config.d.ts" />

const DOMAIN = "michal.piotrpieprzyk.com";
const GITHUB_REPO = "PiotrPieprzyk/michal-page";
const DEFAULT_RECIPIENT = "piotr.pieprzyk.pp+michalpage@gmail.com";

export default $config({
  app(input) {
    // CLOUDFLARE_API_TOKEN is read from the env by the provider. Locally it is
    // mapped from CLOUD_FLARE_TOKEN in .env by scripts/sst.mjs.
    return {
      name: "michal-page",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
      providers: {
        aws: { region: "eu-central-1" },
        cloudflare: "6.23.1",
        random: "4.21.4",
      },
    };
  },
  async run() {
    const isProd = $app.stage === "production";
    const siteUrl = isProd ? `https://${DOMAIN}` : "http://localhost:3000";
    const allowedOrigins = isProd
      ? [siteUrl]
      : ["http://localhost:3000", "http://127.0.0.1:3000"];

    // --- Secrets (stored encrypted in SSM; `npx sst secret set <Name> <value>`)
    const turnstileSecret = new sst.Secret("TurnstileSecret", "none");
    const recipientEmail = new sst.Secret("RecipientEmail", DEFAULT_RECIPIENT);
    const alertEmail = new sst.Secret("AlertEmail", DEFAULT_RECIPIENT);

    // Key used to sign long-lived photo links in the notification email.
    const linkKey = new random.RandomPassword("PhotoLinkKey", {
      length: 48,
      special: false,
    });

    // --- Private bucket for customer photos (browser PUTs via presigned URLs)
    const uploads = new sst.aws.Bucket("Uploads", {
      cors: {
        allowOrigins: allowedOrigins,
        allowMethods: ["PUT"],
        allowHeaders: ["*"],
        maxAge: "1 hour",
      },
      lifecycle: [{ id: "expire-uploads", expiresIn: "30 days" }],
    });

    // --- SES identities. They are account-wide, so only production creates them;
    // other stages reuse the production ones.
    const alerts = new sst.aws.SnsTopic("Alerts");
    new aws.sns.TopicSubscription("AlertsEmail", {
      topic: alerts.arn,
      protocol: "email",
      endpoint: alertEmail.value,
    });

    const sender = isProd
      ? new sst.aws.Email("Sender", {
          sender: DOMAIN,
          dns: sst.cloudflare.dns(),
          dmarc: "v=DMARC1; p=quarantine; adkim=r; aspf=r;",
          events: [
            {
              name: "delivery-problems",
              types: ["bounce", "complaint", "reject", "rendering-failure"],
              topic: alerts.arn,
            },
          ],
        })
      : sst.aws.Email.get("Sender", DOMAIN);

    if (isProd) {
      // SES sandbox: the recipient must be a verified identity. AWS sends a
      // confirmation link to this address on first deploy.
      new sst.aws.Email("Recipient", { sender: recipientEmail.value });
    }

    const urlCors = {
      allowOrigins: allowedOrigins,
      allowMethods: ["POST"],
      allowHeaders: ["content-type"],
      maxAge: "1 hour",
    } as const;

    // POST: presigned PUT URLs for the photos. GET ?k=&e=&s=: signed photo link
    // from the email -> redirects to a fresh presigned S3 GET.
    const uploadFn = new sst.aws.Function("UploadUrl", {
      handler: "functions/upload-url.handler",
      runtime: "nodejs24.x",
      architecture: "arm64",
      memory: "256 MB",
      timeout: "10 seconds",
      url: { cors: urlCors },
      link: [uploads],
      environment: { PHOTO_LINK_KEY: linkKey.result },
    });

    const submitFn = new sst.aws.Function("Submit", {
      handler: "functions/submit.handler",
      runtime: "nodejs24.x",
      architecture: "arm64",
      memory: "1024 MB",
      timeout: "30 seconds",
      url: { cors: urlCors },
      link: [uploads, sender, turnstileSecret, recipientEmail],
      environment: {
        PHOTO_LINK_KEY: linkKey.result,
        PHOTO_LINK_BASE: uploadFn.url,
        FROM_ADDRESS: `Formularz wyceny <formularz@${DOMAIN}>`,
        SITE_URL: siteUrl,
      },
    });

    // --- Static Next.js export on S3 + CloudFront
    const site = new sst.aws.StaticSite("Site", {
      build: { command: "npm run build", output: "out" },
      dev: { command: "npm run dev", url: "http://localhost:3000" },
      domain: isProd ? { name: DOMAIN, dns: sst.cloudflare.dns() } : undefined,
      errorPage: "404.html",
      environment: {
        NEXT_PUBLIC_SITE_URL: siteUrl,
        NEXT_PUBLIC_UPLOAD_URL: uploadFn.url,
        NEXT_PUBLIC_SUBMIT_URL: submitFn.url,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? "",
        NEXT_PUBLIC_POSTHOG_KEY: process.env.POSTHOG_PROJECT_TOKEN ?? "",
        NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
        NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID ?? "",
        NEXT_PUBLIC_SANITY_DATASET: process.env.SANITY_DATASET ?? "production",
      },
    });

    // --- Monitoring: any Lambda error -> email
    for (const [name, fn] of [
      ["UploadUrl", uploadFn],
      ["Submit", submitFn],
    ] as const) {
      new aws.cloudwatch.MetricAlarm(`${name}Errors`, {
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensions: { FunctionName: fn.name },
        statistic: "Sum",
        period: 300,
        evaluationPeriods: 1,
        threshold: 0,
        comparisonOperator: "GreaterThanThreshold",
        treatMissingData: "notBreaching",
        alarmActions: [alerts.arn],
        alarmDescription: `Lambda ${name} zgłosiła błąd (stage ${$app.stage})`,
      });
    }

    if (isProd) {
      // --- Cost guard: email at $1 (actual) and $2 (actual + forecast)
      new aws.budgets.Budget("MonthlyBudget", {
        budgetType: "COST",
        limitAmount: "2",
        limitUnit: "USD",
        timeUnit: "MONTHLY",
        notifications: [
          {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            threshold: 50,
            thresholdType: "PERCENTAGE",
            subscriberEmailAddresses: [alertEmail.value],
          },
          {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            threshold: 100,
            thresholdType: "PERCENTAGE",
            subscriberEmailAddresses: [alertEmail.value],
          },
          {
            comparisonOperator: "GREATER_THAN",
            notificationType: "FORECASTED",
            threshold: 100,
            thresholdType: "PERCENTAGE",
            subscriberEmailAddresses: [alertEmail.value],
          },
        ],
      });

      // --- GitHub Actions deploys via OIDC (no long-lived AWS keys)
      const oidc = new aws.iam.OpenIdConnectProvider("GithubOidc", {
        url: "https://token.actions.githubusercontent.com",
        clientIdLists: ["sts.amazonaws.com"],
      });
      const deployRole = new aws.iam.Role("GithubDeployRole", {
        name: "michal-page-github-deploy",
        maxSessionDuration: 3600,
        assumeRolePolicy: oidc.arn.apply((arn) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Federated: arn },
                Action: "sts:AssumeRoleWithWebIdentity",
                Condition: {
                  StringEquals: {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                  },
                  StringLike: {
                    "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:ref:refs/heads/main`,
                  },
                },
              },
            ],
          }),
        ),
      });
      new aws.iam.RolePolicyAttachment("GithubDeployRoleAdmin", {
        role: deployRole.name,
        policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
      });

      return {
        site: site.url,
        uploadUrl: uploadFn.url,
        submitUrl: submitFn.url,
        githubDeployRoleArn: deployRole.arn,
      };
    }

    return {
      site: site.url,
      uploadUrl: uploadFn.url,
      submitUrl: submitFn.url,
    };
  },
});
