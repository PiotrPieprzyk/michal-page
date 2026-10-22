import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";

const s3 = new S3Client({});

// `Resource.Notes.name` and `Resource.Greeting.value` exist because sst.config.ts links them.
// Remove one from `link` and deploy: the type check fails and so does the S3 call (no IAM permission).
export async function handler() {
  await s3.send(
    new PutObjectCommand({
      Bucket: Resource.Notes.name,
      Key: `visits/${Date.now()}.txt`,
      Body: new Date().toISOString(),
    }),
  );
  const list = await s3.send(new ListObjectsV2Command({ Bucket: Resource.Notes.name, Prefix: "visits/" }));

  return {
    statusCode: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: `${Resource.Greeting.value}! Visits stored in ${Resource.Notes.name}: ${list.KeyCount ?? 0}\n`,
  };
}
