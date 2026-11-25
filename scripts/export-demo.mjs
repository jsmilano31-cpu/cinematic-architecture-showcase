import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { demoProject, demoSettings } from "../src/content/demo.ts";
const path = resolve(process.argv[2] || ".qa/demo.ndjson");
const nestedTypes = {
  hero: "architecturalImage",
  logo: "architecturalImage",
  ogImage: "architecturalImage",
  finaleImage: "architecturalImage",
  image: "architecturalImage",
  poster: "architecturalImage",
  conceptImages: "architecturalImage",
  exterior: "architecturalImage",
  interiors: "architecturalImage",
  images: "architecturalImage",
  sections: "section",
  rooms: "room",
  floors: "floor",
  hotspots: "hotspot",
  polygon: "point",
  facts: "specification",
  materials: "material",
  model: "media",
  video: "media",
};
function convert(value, field = "", key) {
  if (Array.isArray(value))
    return value.map((v, i) => convert(v, field, "item-" + i));
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    [
      ["_type", nestedTypes[field]],
      ["_key", key],
      ...Object.entries(value)
        .filter(([k]) => k !== "areaSqm" || field === "rooms")
        .map(([k, v]) => [k, convert(v, k)]),
    ].filter(([, v]) => v !== undefined),
  );
}
const project = {
  ...convert(demoProject),
  _type: "project",
  _id: "project",
  concept: [
    {
      _key: "concept",
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        { _key: "text", _type: "span", marks: [], text: demoProject.concept },
      ],
    },
  ],
};
const settings = {
  ...convert(demoSettings),
  _type: "siteSettings",
  _id: "siteSettings",
};
mkdirSync(dirname(path), { recursive: true });
writeFileSync(
  path,
  [settings, project].map((doc) => JSON.stringify(doc)).join("\n") + "\n",
);
console.log("Wrote two local demo documents to " + path);
