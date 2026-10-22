# Lesson 6: GROQ and fetching content

**Why:** the whole site's content arrives through one GROQ query, run once per build, and is merged over a local
fallback. Three short files: [`query.ts`](../src/content/query.ts), [`fetch.ts`](../src/content/fetch.ts),
[`tokens.ts`](../src/content/tokens.ts).

## Learn

**GROQ in five minutes.** GROQ (Graph-Relational Object Queries) is Sanity's query language. A query is a pipeline
over *all documents in the dataset*:

```groq
*                                  // every document
*[_type == "landingPage"]          // filter → array
*[_id == "landingPage"][0]         // first element → object (or null)
*[_id == "landingPage"][0].hero    // a field
*[_id == "landingPage"][0]{ hero, services }            // projection: pick fields
*[_id == "landingPage"][0]{ "cards": services.cards[].title }   // rename + flatten an array
count(*[_type == "landingPage"])   // functions
```

Two properties to remember: a missing field is `null`, never an error; and `{ "a": <query>, "b": <query> }` at the top
level runs several queries in **one request**.
Docs: [GROQ](https://www.sanity.io/docs/groq), [how queries work](https://www.sanity.io/docs/how-queries-work),
[functions](https://www.sanity.io/docs/groq-functions).

**The site's query** ([`query.ts`](../src/content/query.ts)) is that last pattern: one request returns
`{ settings, page, privacy }`, each picked by its singleton `_id` (lesson 5). The `/* groq */` comment only enables
syntax highlighting in editors.

**The client** ([`fetch.ts`](../src/content/fetch.ts)): `createClient` from `@sanity/client` with:

| Option | Value | Why |
|---|---|---|
| `projectId`, `dataset` | from `NEXT_PUBLIC_SANITY_*` | Which Content Lake to read |
| `apiVersion` | `"2025-01-01"` | Pins the API's behaviour to a date, so Sanity can change defaults without breaking you. Bump it on purpose |
| `useCdn` | `false` | The API CDN can serve slightly stale results. The build runs seconds after a publish webhook, so it must read fresh data. Browsers reading at runtime would use `true` |
| `perspective` | `"published"` | Never build drafts (lesson 4) |
| no `token` | | The dataset is public (lesson 4) |

Docs: [JS client](https://www.sanity.io/docs/js-client), [API versioning](https://www.sanity.io/docs/api-versioning).

**The merge.** `merge(seed, sanityData)` walks both objects:

- a Sanity value **wins** unless it's empty (`null`, `undefined`, `""`, `[]`), in which case the `seed.json` value stays;
- objects are merged key by key, recursively;
- arrays are **replaced** whole (merging lists item by item would make no sense), and `stripKeys` removes Sanity's
  `_key`/`_type` from their items;
- system fields (`_id`, `_rev`, `_updatedAt`...) are dropped, except `_ref` (image asset references, lesson 7).

That's why the site works with no Sanity at all (`projectId` empty → `seed.json` as is), why a new field doesn't break
the build before an editor fills it in, and why `seed.json` doubles as the **initial content** imported into Sanity
(lesson 8).

**Tokens.** Copy in the CMS contains placeholders like `{telefon}` or `{Termin_oddzwonienia}`. `fill(text, settings)`
in [`tokens.ts`](../src/content/tokens.ts) replaces them with `siteSettings` values at render time; a capitalized token
capitalizes the value. Editors change the phone number once and every sentence follows. `telHref()` turns the display
format into a valid `tel:` link.

## Read in the repo

[`query.ts`](../src/content/query.ts), [`fetch.ts`](../src/content/fetch.ts) (all of it), [`tokens.ts`](../src/content/tokens.ts),
and one use of `fill` in a section, e.g. [`Hero.tsx`](../src/components/sections/Hero.tsx).

## Do

[Lab 01: GROQ playground](examples/01-groq-playground/query.mjs). It runs the real query from `query.ts` offline,
against documents built from `seed.json`, with the [groq-js](https://github.com/sanity-io/groq-js) engine. Steps 1–4
are in its header comment, including drafts vs. published.

```
cd learn/examples/01-groq-playground
npm install
node query.mjs
```

If you have the Sanity project: run the same queries in the Studio's **Vision** tab against the real dataset.

## Check yourself

- An editor clears the *Hero → Wstęp* field and publishes. What does the site show? And if they delete one of the six
  service cards?
- Why does the `merge` skip keys starting with `_`, but keep `_ref`?
- What would change if `useCdn` were `true`? When is `true` the better choice?
- The query fetches `siteSettings` in full but projects `landingPage` to named sections. What would happen with
  `*[_id == "landingPage"][0]` instead?

---

Previous: [Lesson 5](05-sanity-schemas.md) · Next: [Lesson 7: Images](07-sanity-images.md)
