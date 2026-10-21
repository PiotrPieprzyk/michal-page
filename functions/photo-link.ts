import { createHmac, timingSafeEqual } from "node:crypto";

/** Photo links in the email stay valid this long (uploads expire after 30 days anyway). */
export const LINK_TTL_SECONDS = 30 * 24 * 3600;

function sign(key: string, expires: number): string {
  return createHmac("sha256", process.env.PHOTO_LINK_KEY!).update(`${key}\n${expires}`).digest("base64url");
}

/**
 * A presigned S3 URL dies with the Lambda's temporary credentials (hours), so the
 * email links point to upload-url (GET), which checks this HMAC and redirects to
 * a freshly presigned URL.
 */
export function signedPhotoLink(base: string, key: string): string {
  const expires = Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS;
  const url = new URL(base);
  url.searchParams.set("k", key);
  url.searchParams.set("e", String(expires));
  url.searchParams.set("s", sign(key, expires));
  return url.toString();
}

export function verifyPhotoLink(key: string, expires: number, signature: string): boolean {
  if (!key || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(key, expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
