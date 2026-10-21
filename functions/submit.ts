import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Resource } from "sst";
import { z } from "zod";
import { htmlBody, subject, textBody, type QuoteEmail } from "./email-template";
import { signedPhotoLink } from "./photo-link";

const s3 = new S3Client({});
const ses = new SESv2Client({});

/** SES raw message limit is 40 MB after base64 (+33%); keep attachments well below. */
const MAX_ATTACH_BYTES = 25 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const Body = z.object({
  name: z.string().trim().max(100).default(""),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => /^\d{9,15}$/.test(v.replace(/[\s\-().]/g, "").replace(/^\+/, "").replace(/^00/, "")), "phone"),
  city: z.string().trim().max(100).default(""),
  description: z.string().trim().max(2000).default(""),
  consent: z.literal(true),
  photos: z
    .array(z.object({ key: z.string().regex(/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/[\w.-]+$/), name: z.string().max(200) }))
    .max(5)
    .default([]),
  turnstileToken: z.string().max(4096).default(""),
  website: z.string().max(500).default(""), // honeypot
  elapsedMs: z.number().default(0),
});

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = Resource.TurnstileSecret.value;
  if (!secret || secret === "none") return true; // Turnstile not configured yet
  if (!token) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) console.warn("turnstile rejected", data["error-codes"]);
  return data.success;
}

/** RFC 2047 encoded-word for non-ASCII header values. */
const encodeHeader = (v: string) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v).toString("base64")}?=`);

const wrap76 = (b64: string) => b64.replace(/.{1,76}/g, "$&\r\n");

function mimeFilename(name: string) {
  const ascii = name.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "zdjecie.jpg";
  return `filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function buildRawEmail(opts: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: { name: string; type: string; data: Buffer }[];
}): Buffer {
  const mixed = `mixed_${randomUUID()}`;
  const alt = `alt_${randomUUID()}`;
  const parts: string[] = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(opts.text).toString("base64")),
    `--${alt}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(opts.html).toString("base64")),
    `--${alt}--`,
    "",
  ];
  for (const a of opts.attachments) {
    parts.push(
      `--${mixed}`,
      `Content-Type: ${a.type}; name="${a.name.replace(/[^\x20-\x7e]|"/g, "_")}"`,
      `Content-Disposition: attachment; ${mimeFilename(a.name)}`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(a.data.toString("base64")),
    );
  }
  parts.push(`--${mixed}--`, "");
  return Buffer.from(parts.join("\r\n"));
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method !== "POST") return json(405, { error: "method" });

  let input: z.infer<typeof Body>;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString() : (event.body ?? "");
    const parsed = Body.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return json(400, { error: "invalid", fields: parsed.error.issues.map((i) => i.path.join(".")) });
    }
    input = parsed.data;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  // Bots: honeypot filled or the form "filled" in under 2 s -> pretend success.
  if (input.website || (input.elapsedMs > 0 && input.elapsedMs < 2000)) {
    console.info("spam dropped", { honeypot: Boolean(input.website), elapsedMs: input.elapsedMs });
    return json(200, { ok: true });
  }

  if (!(await verifyTurnstile(input.turnstileToken, event.requestContext.http.sourceIp))) {
    return json(400, { error: "turnstile" });
  }

  // Photos: must exist in our bucket; attach while under the size budget, always link.
  const bucket = Resource.Uploads.name;
  const linkBase = process.env.PHOTO_LINK_BASE!;
  const photos: QuoteEmail["photos"] = [];
  const attachments: { name: string; type: string; data: Buffer }[] = [];
  let attachedBytes = 0;

  for (const p of input.photos) {
    let head;
    try {
      head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: p.key }));
    } catch {
      return json(400, { error: "photo_missing" });
    }
    const size = head.ContentLength ?? 0;
    if (size > MAX_FILE_BYTES) return json(400, { error: "photo_too_large" });

    const name = p.name || p.key.split("/").pop()!;
    let attached = false;
    if (attachedBytes + size <= MAX_ATTACH_BYTES) {
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: p.key }));
      const data = Buffer.from(await obj.Body!.transformToByteArray());
      attachments.push({ name: name.replace(/\.[^.]+$/, "") + extFor(head.ContentType, name), type: head.ContentType ?? "application/octet-stream", data });
      attachedBytes += size;
      attached = true;
    }
    photos.push({ name, link: signedPhotoLink(linkBase, p.key), attached });
  }

  const q: QuoteEmail = {
    name: input.name,
    phone: input.phone,
    city: input.city,
    description: input.description,
    photos,
    submittedAt: new Date(),
    siteUrl: process.env.SITE_URL ?? "",
  };

  const raw = buildRawEmail({
    from: process.env.FROM_ADDRESS!,
    to: Resource.RecipientEmail.value,
    subject: subject(q),
    text: textBody(q),
    html: htmlBody(q),
    attachments,
  });

  await ses.send(
    new SendEmailCommand({
      Content: { Raw: { Data: raw } },
      ConfigurationSetName: Resource.Sender.configSet,
    }),
  );

  console.info("quote sent", { photos: photos.length, attached: attachments.length, bytes: raw.length });
  return json(200, { ok: true });
}

function extFor(type: string | undefined, name: string) {
  const fromName = name.match(/\.[^.]+$/)?.[0];
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/heic") return ".heic";
  if (type === "image/heif") return ".heif";
  return fromName ?? "";
}
