/// <reference path="./.sst/platform/config.d.ts" />

// Lab 02: the smallest app with the same moving parts as ../../../sst.config.ts:
// a Bucket, a Function with a URL, `link`, a Secret and a raw Pulumi resource.
// It deploys to YOUR OWN stage and costs ~$0 (free tier). Remove it when you're done.
//
//   cd learn/examples/02-sst-hello
//   npm install
//   aws login --profile michal-page            # if the session expired
//
//   1. Deploy. ../../../scripts/sst.mjs adds the AWS credentials, like `npm run deploy` does:
//        node ../../../scripts/sst.mjs deploy --stage learn
//      Open the `hello` URL it prints a few times. Each call writes one object to the bucket.
//      Look at .sst/outputs.json and at sst-env.d.ts (generated, it types `Resource`).
//
//   2. Preview a change (like `terraform plan`): change `memory` below to "256 MB", then
//        node ../../../scripts/sst.mjs diff --stage learn
//
//   3. Secret: node ../../../scripts/sst.mjs secret set Greeting "Cześć" --stage learn
//      Call the URL again: unchanged. Secrets reach a function at deploy time, so deploy again.
//
//   4. Live: node ../../../scripts/sst.mjs dev --stage learn
//      Edit hello.ts and call the URL: the request now runs on YOUR machine, with the
//      function's real IAM permissions. Stop with Ctrl+C.
//
//   5. Clean up:
//        node ../../../scripts/sst.mjs remove --stage learn
//      `removal` is "remove" for this stage, so the bucket (and its objects) go too.
//      Then try it with --stage production in your head: what would `protect` do?

export default $config({
  app(input) {
    return {
      name: "learn-sst-hello",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
      providers: { aws: { region: "eu-central-1" } },
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("Notes");
    const greeting = new sst.Secret("Greeting", "Hello");

    const hello = new sst.aws.Function("Hello", {
      handler: "hello.handler",
      runtime: "nodejs24.x",
      architecture: "arm64",
      memory: "128 MB",
      url: true,
      link: [bucket, greeting],
    });

    // Not every AWS resource has an SST component: the full Pulumi AWS provider is under `aws.*`.
    new aws.cloudwatch.LogGroup("Extra", { retentionInDays: 1 });

    return {
      hello: hello.url,
      bucket: bucket.name,
      // Outputs are values that only exist after deploy; .apply transforms them.
      bucketConsole: bucket.name.apply(
        (name) => `https://console.aws.amazon.com/s3/buckets/${name}?region=eu-central-1`,
      ),
    };
  },
});
