# Lesson 4: Sanity mental model

**Why:** Sanity is two things that are easy to mix up: a hosted **database for content** and an **editing app** that
you configure in code. This repo contains the second one (`studio/`) and reads from the first one at build time.

## Learn

**The pieces:**

| Piece | What it is | Here |
|---|---|---|
| **Project** | Your account's container, with an 8-character **project ID** | Created by [`setup-sanity.mjs`](../scripts/setup-sanity.mjs) on the free plan |
| **Dataset** | A separate collection of documents inside a project (like a database) | `production`, **public** |
| **Content Lake** | Sanity's hosted document store and its APIs (query, mutate, assets, CDN) | Where the content lives; nothing to host |
| **Document** | A JSON object with `_id`, `_type`, `_rev`, `_createdAt`, `_updatedAt` + your fields | `siteSettings`, `landingPage`, `privacyPage` |
| **Studio** | A React single-page app for editing documents, configured by your schemas | [`studio/`](../studio), deployed to `https://<host>.sanity.studio` |
| **Asset** | An uploaded file or image, referenced from documents | Photos, served from `cdn.sanity.io` (lesson 7) |

Docs: [Content Lake](https://www.sanity.io/docs/content-lake), [datasets](https://www.sanity.io/docs/datasets),
[Studio](https://www.sanity.io/docs/sanity-studio).

**Schemas live in the Studio, not in the database.** The Content Lake is schemaless: it stores whatever JSON you send.
The schema in [`studio/schemas/`](../studio/schemas) only tells the *Studio* which fields to show and how to validate
them. Consequences:

- Changing a schema doesn't migrate data. Old documents keep old fields until someone edits them or you run a migration.
- The site's TypeScript types ([`types.ts`](../src/content/types.ts)) are a *third* description of the same shape, kept in
  sync by convention (lesson 5). `npm run typegen` in `studio/` can generate types from schema + queries, but the
  repo doesn't use it.

**Drafts and publishing.** Editing in the Studio writes to a **draft** document with the ID `drafts.<id>`. **Publish**
copies it to `<id>`. Queries choose what they see with a **perspective**: `published` (no drafts) or `drafts`
(drafts layered over published). The site asks for `published`, so half-finished edits never reach a build.
Docs: [drafts](https://www.sanity.io/docs/drafts), [perspectives](https://www.sanity.io/docs/perspectives).

**Public dataset = no token needed to read.** Anyone who knows the project ID can query a public dataset (that's why
[`fetch.ts`](../src/content/fetch.ts) creates the client without a token, and why the project ID can be a
`NEXT_PUBLIC_*` value). Writes always need a token. Don't put anything private in a public dataset.

**The Studio is its own app.** [`studio/`](../studio) has its own `package.json`, `node_modules` and `tsconfig.json`, and
the root [`tsconfig.json`](../tsconfig.json) excludes it. Two config files:

- [`sanity.config.ts`](../studio/sanity.config.ts): what the Studio *is*: project, dataset, plugins (structure, Vision),
  schema, document actions.
- [`sanity.cli.ts`](../studio/sanity.cli.ts): what the *CLI* uses: project/dataset for `sanity dataset import` etc., the
  `studioHost` for `sanity deploy`, and `autoUpdates`.

Both read `SANITY_STUDIO_*` variables from `studio/.env` (written by the setup script). Only variables with that prefix
reach the Studio's browser bundle. Docs: [Studio environment variables](https://www.sanity.io/docs/environment-variables).

**Hosting the Studio.** `sanity deploy` builds the Studio and uploads it to Sanity's free hosting at
`<studioHost>.sanity.studio`. It talks to the Content Lake from the editor's browser, which is why the project's **CORS
origins** list `http://localhost:3333` (local Studio) in [`setup-sanity.mjs`](../scripts/setup-sanity.mjs).
Docs: [deployment](https://www.sanity.io/docs/deployment), [CORS](https://www.sanity.io/docs/cors).

## Read in the repo

[`studio/package.json`](../studio/package.json) (scripts), [`sanity.config.ts`](../studio/sanity.config.ts),
[`sanity.cli.ts`](../studio/sanity.cli.ts), then steps 1–5 of [`setup-sanity.mjs`](../scripts/setup-sanity.mjs).

## Do

Needs the Sanity project from the README's first-time setup (free).

```
cd studio
npm install
npm run dev          # http://localhost:3333
```

1. Log in, open *Strona główna*, change a text, and **don't** publish. Look at the document's status. Then open the
   **Vision** tab and run `*[_type == "landingPage"]._id`. Do you see one ID or two? Switch the perspective dropdown.
2. Discard the change.
3. `npx sanity dataset list` and `npx sanity documents get siteSettings` from `studio/`.

## Check yourself

- You add a required field to a schema and deploy the Studio. What happens to the existing published document? What
  does the site build get for that field? (Lesson 6 has the full answer.)
- Why is it safe to put `SANITY_PROJECT_ID` in a `NEXT_PUBLIC_*` variable, but it would not be safe to put a Sanity
  token there?
- What's the difference between `sanity deploy` and publishing a document?

---

Previous: [Lesson 3](03-nextjs-client-islands.md) · Next: [Lesson 5: Schemas and the Studio](05-sanity-schemas.md)
