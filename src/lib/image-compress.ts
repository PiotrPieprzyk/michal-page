/** Upload limits shown to the user (HANDOFF §3.6). Enforced again in functions/upload-url.ts. */
export const MAX_FILES = 5;
export const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 2000;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];
const ACCEPTED_EXT = /\.(jpe?g|png|heic|heif|webp)$/i;

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) || (!file.type && ACCEPTED_EXT.test(file.name)) || ACCEPTED_EXT.test(file.name);
}

/** MIME type to sign the upload with (some browsers report HEIC with an empty type). */
export function mimeOf(file: Blob & { name?: string }): string {
  if (file.type) return file.type;
  const name = file.name ?? "";
  if (/\.heic$/i.test(name)) return "image/heic";
  if (/\.heif$/i.test(name)) return "image/heif";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "image/jpeg";
}

/**
 * Shrinks a phone photo to a 2000px long edge as JPEG (q 0.85), applying EXIF
 * orientation. If the browser can't decode the file (HEIC outside Safari), the
 * original is returned and sent as-is.
 */
export async function compressImage(file: File): Promise<{ blob: Blob; name: string; type: string }> {
  const original = { blob: file as Blob, name: file.name, type: mimeOf(file) };
  if (typeof createImageBitmap !== "function") return original;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return original;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    // Small JPEGs are already fine.
    if (scale === 1 && file.type === "image/jpeg" && file.size < 1.5 * 1024 * 1024) return original;

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return original;
    return { blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

/** "3,2 MB" / "850 KB" (Polish decimal comma). */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toLocaleString("pl-PL", { maximumFractionDigits: mb >= 10 ? 0 : 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
