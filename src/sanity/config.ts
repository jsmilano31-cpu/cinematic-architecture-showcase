"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { schemaTypes } from "./schema";
export default defineConfig({
  name: "fieldwork",
  title: "Architectural showcase",
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "unconfigured",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Showcase")
          .items(
            ["project", "siteSettings"].map((id, i) =>
              S.listItem()
                .title(i ? "Site settings" : "Project")
                .id(id)
                .child(S.document().schemaType(id).documentId(id)),
            ),
          ),
    }),
    presentationTool({
      previewUrl: {
        initial: "/",
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
    }),
  ],
  schema: { types: schemaTypes },
  document: {
    newDocumentOptions: () => [],
    actions: (prev) =>
      prev.filter((a) => a.action !== "duplicate" && a.action !== "delete"),
  },
});
