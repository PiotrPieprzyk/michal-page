// Converts src/content/seed.json (the mockup copy) into Sanity documents (seed.ndjson):
// siteSettings, landingPage and privacyPage singletons. Objects in arrays get a _key.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const seed = JSON.parse(fs.readFileSync(path.join(root, "src/content/seed.json"), "utf8"));

// Field name -> Sanity object type name for array members (must match studio/schemas).
const ARRAY_TYPES = {
  nav: "navLink",
  stickyNav: "navLink",
  items: null, // resolved per parent below
  cards: "serviceCard",
  filters: "galleryFilter",
  rows: "priceRow",
  steps: "formStep",
};
const ITEMS_BY_SECTION = { trust: "trustItem", gallery: "galleryItem" };

const IMAGE_FIELDS = new Set(["image", "before", "after"]);

function convert(value, key, sectionName) {
  if (Array.isArray(value)) {
    const type = key === "items" ? ITEMS_BY_SECTION[sectionName] : ARRAY_TYPES[key];
    return value.map((item) =>
      item && typeof item === "object"
        ? { _key: randomUUID().slice(0, 12), ...(type ? { _type: type } : {}), ...convert(item, null, sectionName) }
        : item,
    );
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null) continue;
      if (IMAGE_FIELDS.has(k) && v && typeof v === "object" && "placeholderLabel" in v) {
        out[k] = { _type: "siteImage", alt: v.alt, placeholderLabel: v.placeholderLabel };
        continue;
      }
      out[k] = convert(v, k, sectionName);
    }
    return out;
  }
  return value;
}

const { settings, privacy, ...page } = seed;
const landing = {};
for (const [name, sectionValue] of Object.entries(page)) landing[name] = convert(sectionValue, null, name);

const docs = [
  { _id: "siteSettings", _type: "siteSettings", ...convert(settings, null, "settings") },
  { _id: "landingPage", _type: "landingPage", ...landing },
  { _id: "privacyPage", _type: "privacyPage", ...convert(privacy, null, "privacy") },
];

const out = path.resolve(import.meta.dirname, "..", "seed.ndjson");
fs.writeFileSync(out, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
console.log(`Wrote ${docs.length} documents to ${out}`);
