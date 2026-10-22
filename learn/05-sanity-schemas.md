# Lesson 5: Schemas and the Studio

**Why:** the Studio the editor sees (Polish labels, three fixed entries, tabs per page section, help texts, required
fields) is all defined in TypeScript in [`studio/`](../studio). This lesson is how to read and change it.

## Learn

**Schema types.** `defineType` declares a named type, `defineField` a field, `defineArrayMember` an item type of an array.
They're identity functions that exist for type-checking and autocompletion. Building blocks used here:

| Schema type | Stored as | Example |
|---|---|---|
| `document` | A top-level document with `_id` | `siteSettings`, `landingPage`, `privacyPage` |
| `object` | A nested JSON object (no `_id`) | Each page section, `siteImage` |
| `string` / `text` | String (`text` = multi-line editor) | `str()` / `txt()` helpers |
| `boolean` | Boolean | `bool()` |
| `array` of objects | Array; every item gets a `_key` and a `_type` | `services.cards` (`serviceCard`) |
| `array` of strings | Array of strings, optionally a fixed `list` of options | `openingDays` |
| `image` | `{ asset: { _ref }, hotspot?, crop? }` | `siteImage.image`, `ogImage` (lesson 7) |

Docs: [schema types](https://www.sanity.io/docs/schema-types), [validation](https://www.sanity.io/docs/validation),
[field groups](https://www.sanity.io/docs/field-groups).

**Helpers keep the schema short.** [`helpers.ts`](../studio/schemas/helpers.ts) wraps `defineField` for the patterns used
dozens of times: `str()` and `txt()` (required unless `required: false`; `txt` shows the `{token}` help text by
default), `icon()` (a dropdown that must match `ICON_NAMES` in [`types.ts`](../src/content/types.ts)), `navLinks()`,
`siteImage()`, and `section()`, which makes one page section an `object` field and puts it in the **group** (tab) of
the same name.

**The document mirrors the TypeScript type.** `landingPage` in [`schemas/index.ts`](../studio/schemas/index.ts) has the
same field names and nesting as `LandingContent` in [`types.ts`](../src/content/types.ts) and the same shape as
[`seed.json`](../src/content/seed.json). That's what lets the site use Sanity data without mapping code. The rule from
[`docs/conventions.md`](../docs/conventions.md): **when adding a field, change `types.ts` → `seed.json` →
`studio/schemas/index.ts`**, with the same name and nesting.

**Singletons.** The site has exactly one settings document, one landing page and one privacy page. Sanity has no
built-in "singleton", so [`sanity.config.ts`](../studio/sanity.config.ts) builds one from three parts:

1. **Fixed IDs.** `SINGLETONS` gives each one an `_id` equal to its type (`siteSettings`, ...). The GROQ query
   (lesson 6) selects by those IDs.
2. **Custom structure.** `structureTool({ structure })` replaces the default "list of all documents per type" with three
   list items, each opening `S.document().documentId(id)`, i.e. *that* document.
   Docs: [Structure Builder](https://www.sanity.io/docs/structure-builder-introduction).
3. **No create, no delete.** `schema.templates` removes the singleton types from the "New document" menu, and
   `document.actions` keeps only `publish`, `discardChanges` and `restore` for them (no delete, no duplicate).
   Docs: [document actions](https://www.sanity.io/docs/document-actions).

**Previews** (`preview: { select, prepare }`) decide what a list item or array item shows in the Studio (e.g. a service
card shows its title and photo). They change nothing in the data.

**Plugins.** `structureTool` (the content editor) and `visionTool` (a GROQ playground inside the Studio, lesson 6).
Docs: [Vision](https://www.sanity.io/docs/the-vision-plugin).

## Read in the repo

1. [`studio/schemas/helpers.ts`](../studio/schemas/helpers.ts), all of it.
2. [`studio/schemas/index.ts`](../studio/schemas/index.ts): `siteImageType`, `siteSettings`, then one section of
   `landingPage` (e.g. `services`) next to the `services` part of [`seed.json`](../src/content/seed.json) and
   `ServicesContent` in [`types.ts`](../src/content/types.ts).
3. [`studio/sanity.config.ts`](../studio/sanity.config.ts): the three singleton parts above.

## Do

With the local Studio running (`cd studio && npm run dev`):

1. Add a field end to end, *without publishing*: a `str("whatsapp", "WhatsApp", { group: "company", required: false })`
   in `siteSettings`, a `whatsapp: string` in `SiteSettings` ([`types.ts`](../src/content/types.ts)), and
   `"whatsapp": ""` in the `settings` part of [`seed.json`](../src/content/seed.json). Watch the Studio reload with the
   new field, and `npm run typecheck` in the root pass.
2. Make it required (remove `required: false`) and look at how the Studio reports the empty field.
3. Revert all three files.

## Check yourself

- What stops an editor from creating a second `landingPage`? What stops them from deleting the existing one? Could they
  still do it through the API?
- `icon()` lists 13 names, `ICON_NAMES` in `types.ts` has 15. Which two are missing, and why is that fine?
  (Hint: where are `x` and `alert-circle` used?)
- You rename `hero.lead` to `hero.intro` in the schema only. What does the Studio show for existing content, and what
  does the site render?

---

Previous: [Lesson 4](04-sanity-mental-model.md) · Next: [Lesson 6: GROQ and fetching](06-groq-and-fetching.md)
