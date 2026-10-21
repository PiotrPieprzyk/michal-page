const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL;
const SUBMIT_URL = process.env.NEXT_PUBLIC_SUBMIT_URL;

export class UploadAborted extends Error {}

interface Presigned {
  key: string;
  url: string;
  headers: Record<string, string>;
}

/** Asks the upload-url Lambda for a presigned S3 PUT for one file. */
async function presign(name: string, type: string, size: number): Promise<Presigned> {
  if (!UPLOAD_URL) throw new Error("NEXT_PUBLIC_UPLOAD_URL is not set");
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, type, size }),
  });
  if (!res.ok) throw new Error(`presign failed: ${res.status}`);
  return res.json();
}

export interface UploadHandle {
  promise: Promise<string>; // resolves to the S3 key
  abort: () => void;
}

/** Presigns and PUTs the blob straight to S3 with XHR (for progress events). */
export function uploadFile(
  blob: Blob,
  name: string,
  type: string,
  onProgress: (fraction: number) => void,
): UploadHandle {
  let xhr: XMLHttpRequest | null = null;
  let aborted = false;

  const promise = (async () => {
    const target = await presign(name, type, blob.size);
    if (aborted) throw new UploadAborted();
    await new Promise<void>((resolve, reject) => {
      xhr = new XMLHttpRequest();
      xhr.open("PUT", target.url);
      for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => (xhr!.status >= 200 && xhr!.status < 300 ? resolve() : reject(new Error(`S3 ${xhr!.status}`)));
      xhr.onerror = () => reject(new Error("network"));
      xhr.onabort = () => reject(new UploadAborted());
      xhr.send(blob);
    });
    onProgress(1);
    return target.key;
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      xhr?.abort();
    },
  };
}

export interface SubmitPayload {
  name: string;
  phone: string;
  city: string;
  description: string;
  consent: boolean;
  photos: { key: string; name: string }[];
  turnstileToken: string;
  website: string; // honeypot
  elapsedMs: number;
}

export async function submitQuote(payload: SubmitPayload): Promise<void> {
  if (!SUBMIT_URL) throw new Error("NEXT_PUBLIC_SUBMIT_URL is not set");
  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error ?? `submit failed: ${res.status}`) as Error & { code?: string };
    err.code = body?.error;
    throw err;
  }
}
