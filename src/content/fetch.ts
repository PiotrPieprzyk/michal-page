import { createClient } from "@sanity/client";
import seed from "./seed.json";
import { LANDING_QUERY } from "./query";
import type { LandingContent } from "./types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

type Plain = Record<string, unknown>;

const isObject = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

const isEmpty = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

/** Sanity values win; empty/missing fields fall back to the seed. Arrays are replaced, not merged. */
function merge<T>(base: T, override: unknown): T {
  if (isEmpty(override)) return base;
  if (isObject(base) && isObject(override)) {
    const out: Plain = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (key.startsWith("_") && key !== "_ref") continue;
      out[key] = key in base ? merge((base as Plain)[key], value) : value;
    }
    return out as T;
  }
  if (Array.isArray(override)) return stripKeys(override) as T;
  return override as T;
}

function stripKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripKeys);
  if (isObject(value)) {
    const out: Plain = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_key" || k === "_type") continue;
      out[k] = stripKeys(v);
    }
    return out;
  }
  return value;
}

let cached: Promise<LandingContent> | undefined;

/** Build-time content fetch (static export). Falls back to seed.json without Sanity. */
export function getContent(): Promise<LandingContent> {
  cached ??= load();
  return cached;
}

async function load(): Promise<LandingContent> {
  const base = seed as unknown as LandingContent;
  if (!projectId) return base;

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    perspective: "published",
  });
  const data = await client.fetch<{ settings?: Plain; page?: Plain; privacy?: Plain }>(LANDING_QUERY);

  return merge(base, { settings: data.settings, privacy: data.privacy, ...(data.page ?? {}) });
}

export const sanityConfig = { projectId, dataset };
