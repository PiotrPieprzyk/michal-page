import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Resource } from "sst";
import { z } from "zod";
import { verifyPhotoLink } from "./photo-link";

const s3 = new S3Client({});

export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

const Body = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  size: z.number().int().positive().max(MAX_BYTES),
});

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

function safeName(name: string) {
  const base = name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);
  return base || "zdjecie.jpg";
}

/**
 * POST {name,type,size} -> presigned S3 PUT (5 min) for one photo.
 * GET ?k=&e=&s=        -> signed link from the notification email -> 302 to a fresh presigned GET.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;

  if (method === "GET") {
    const q = event.queryStringParameters ?? {};
    const key = q.k ?? "";
    if (!key.startsWith("uploads/") || !verifyPhotoLink(key, Number(q.e), q.s ?? "")) {
      return { statusCode: 403, headers: { "content-type": "text/plain; charset=utf-8" }, body: "Link wygasł lub jest nieprawidłowy." };
    }
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: Resource.Uploads.name, Key: key }), {
      expiresIn: 600,
    });
    return { statusCode: 302, headers: { location: url, "cache-control": "no-store" }, body: "" };
  }

  if (method !== "POST") return json(405, { error: "method" });

  let parsed;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString() : (event.body ?? "");
    parsed = Body.safeParse(JSON.parse(raw));
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (!parsed.success) return json(400, { error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) });

  const { name, type, size } = parsed.data;
  const day = new Date().toISOString().slice(0, 10);
  const key = `uploads/${day}/${randomUUID()}/${safeName(name)}`;

  // Content-Type and Content-Length are signed, so the browser must send exactly this file.
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: Resource.Uploads.name, Key: key, ContentType: type, ContentLength: size }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) },
  );

  return json(200, { key, url, headers: { "content-type": type } });
}
