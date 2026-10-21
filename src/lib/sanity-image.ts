import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageValue } from "@/content/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null;

export function hasImage(value?: SanityImageValue | null): value is SanityImageValue & { asset: { _ref: string } } {
  return Boolean(builder && value?.asset?._ref);
}

/** Base CDN URL (crop applied); width/format are added by the next/image loader. */
export function imageBaseUrl(value: SanityImageValue): string {
  return builder!.image(value).url();
}

export function imageUrl(value: SanityImageValue, width: number, height?: number): string {
  let b = builder!.image(value).width(width).auto("format").quality(80);
  if (height) b = b.height(height).fit("crop");
  return b.url();
}

/** Intrinsic dimensions encoded in the asset id: image-<hash>-<w>x<h>-<ext>. */
export function imageDimensions(value: SanityImageValue): { width: number; height: number } {
  const m = value.asset?._ref.match(/-(\d+)x(\d+)-/);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1600, height: 1000 };
}

/** Hotspot -> CSS object-position, so `object-cover` keeps the subject in frame. */
export function objectPosition(value: SanityImageValue): string | undefined {
  const h = value.hotspot;
  return h ? `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` : undefined;
}
