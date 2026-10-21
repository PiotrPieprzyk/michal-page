import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes, SINGLETONS } from "./schemas";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

const singletonIds = new Set(SINGLETONS.map((s) => s.id));

export default defineConfig({
  name: "default",
  title: "Wycinka drzew — treści strony",
  projectId,
  dataset,
  plugins: [
    structureTool({
      title: "Treści",
      structure: (S) =>
        S.list()
          .title("Treści strony")
          .items(
            SINGLETONS.map((s) =>
              S.listItem()
                .title(s.title)
                .id(s.id)
                .child(S.document().schemaType(s.type).documentId(s.id).title(s.title)),
            ),
          ),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from the "new document" menu.
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.some((s) => s.type === schemaType)),
  },
  document: {
    actions: (input, context) =>
      singletonIds.has(context.documentId ?? "")
        ? input.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : input,
  },
});
