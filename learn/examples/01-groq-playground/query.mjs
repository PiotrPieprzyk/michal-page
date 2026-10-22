// Lab 01: GROQ offline. groq-js is the same query engine Sanity runs, packaged as a library,
// so you can learn the language against a local dataset: no Sanity account, no network.
//
//   cd learn/examples/01-groq-playground
//   npm install
//
//   1. The real query, from src/content/query.ts, against documents built from seed.json:
//        node query.mjs
//      Compare the shape with what fetch.ts expects: { settings, page, privacy }.
//
//   2. Your own queries (quote with ' in bash, with " in PowerShell and escape inner quotes):
//        node query.mjs '*[]._id'                                  # every document id
//        node query.mjs '*[_type == "siteSettings"][0].phone'      # one field
//        node query.mjs '*[_id == "landingPage"][0].services.cards[].title'
//        node query.mjs 'count(*[_type == "landingPage"][0].gallery.items)'
//        node query.mjs '*[_id == "landingPage"][0]{ "eyebrow": hero.eyebrow, "cards": count(services.cards) }'
//
//   3. Drafts and perspectives. The dataset also holds "drafts.landingPage", an unpublished edit
//      (see addDraft below). Run with --perspective:
//        node query.mjs '*[_type == "landingPage"]._id'                         # raw: both documents
//        node query.mjs --perspective published '*[_type == "landingPage"]._id'  # what the site builds from
//        node query.mjs --perspective drafts '*[_type == "landingPage"].hero.eyebrow'
//      fetch.ts asks for `perspective: "published"`. What would the live site show without it?
//
//   4. Break it on purpose: rename a field in the query and run it again. GROQ returns null for
//      missing fields instead of failing. Which line in fetch.ts makes that safe for the site?

import fs from "node:fs";
import path from "node:path";
import { evaluate, parse } from "groq-js";

const root = path.resolve(import.meta.dirname, "..", "..", "..");

// The query the site really uses, read from the source so this lab never drifts from it.
const querySource = fs.readFileSync(path.join(root, "src/content/query.ts"), "utf8");
const LANDING_QUERY = querySource.match(/`([\s\S]*?)`/)[1];

// The same three singletons studio/scripts/build-seed.mjs imports into Sanity (without _key/_type
// on array members, which this lab doesn't need).
const seed = JSON.parse(fs.readFileSync(path.join(root, "src/content/seed.json"), "utf8"));
const { settings, privacy, ...page } = seed;
const dataset = [
  { _id: "siteSettings", _type: "siteSettings", ...settings },
  { _id: "landingPage", _type: "landingPage", ...page },
  { _id: "privacyPage", _type: "privacyPage", ...privacy },
];

// An editor changed the hero eyebrow in the Studio but hasn't pressed "Publish" yet.
function addDraft(docs) {
  const published = docs.find((d) => d._id === "landingPage");
  docs.push({
    ...structuredClone(published),
    _id: "drafts.landingPage",
    hero: { ...published.hero, eyebrow: "DRAFT: not published yet" },
  });
}
addDraft(dataset);

const args = process.argv.slice(2);
let perspective = "raw";
const i = args.indexOf("--perspective");
if (i !== -1) [, perspective] = args.splice(i, 2);
const query = args[0] ?? LANDING_QUERY;

// groq-js has no perspectives, so this mimics what the Sanity API does with them:
// "published" hides drafts.*, "drafts" shows each draft in place of its published document.
function applyPerspective(docs, name) {
  if (name === "raw") return docs;
  const published = docs.filter((d) => !d._id.startsWith("drafts."));
  if (name === "published") return published;
  if (name === "drafts") {
    return published.map((d) => {
      const draft = docs.find((x) => x._id === `drafts.${d._id}`);
      return draft ? { ...draft, _id: d._id } : d;
    });
  }
  throw new Error(`Unknown perspective "${name}" (use raw, published or drafts)`);
}

const tree = parse(query);
const result = await (await evaluate(tree, { dataset: applyPerspective(dataset, perspective) })).get();

console.log(JSON.stringify(result, null, 2));
