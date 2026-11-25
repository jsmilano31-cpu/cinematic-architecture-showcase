import { defineField as field, defineType as type } from "sanity";
import { chapters } from "@/content/types";
import { mediaUrl, contactUrl } from "@/lib/media";
import { HotspotInput } from "./geometry-input";
const required = <T>(r: { required(): T }) => r.required();
const string = (name: string, title?: string, req = false) =>
  field({
    name,
    title,
    type: "string",
    validation: req ? required : undefined,
  });
const text = (name: string) => field({ name, type: "text", rows: 3 });
const obj = (name: string, type: string, req = false) =>
  field({ name, type, validation: req ? required : undefined });
const array = (name: string, t: string) =>
  field({ name, type: "array", of: [{ type: t }] });
const url = (name: string) =>
  field({
    name,
    type: "string",
    validation: (r) =>
      r.custom(
        (v) =>
          !v ||
          !!mediaUrl(v) ||
          "Use a trusted HTTPS media host or a local /demo/ file.",
      ),
  });
const pct = (name: string, req = true) =>
  field({
    name,
    type: "number",
    validation: (r) => (req ? r.required().min(0).max(100) : r.min(0).max(100)),
  });
const object = (name: string, fields: ReturnType<typeof field>[]) =>
  type({ name, type: "object", fields });
const select = (name: string, values: readonly string[]) =>
  field({
    name,
    type: "string",
    options: { list: [...values] },
    validation: required,
  });
const art = type({
  name: "architecturalImage",
  title: "Architectural image",
  type: "object",
  fields: [
    field({ name: "upload", type: "image", options: { hotspot: true } }),
    url("url"),
    url("portraitUrl"),
    field({
      name: "width",
      type: "number",
      description: "Intrinsic width for a URL image.",
    }),
    field({
      name: "height",
      type: "number",
      description: "Intrinsic height for a URL image.",
    }),
    string("alt", "Alternative text", true),
    string("caption"),
    string("credit"),
    field({
      name: "category",
      type: "string",
      options: { list: ["Exterior", "Interior", "Detail"] },
    }),
    string("roomId", "Linked room ID"),
  ],
  preview: { select: { title: "caption", subtitle: "alt", media: "upload" } },
  validation: (r) =>
    r.custom((v) => {
      const p = v as
        | {
            upload?: { asset?: unknown };
            url?: string;
            width?: number;
            height?: number;
          }
        | undefined;
      return (
        !p ||
        !!p.upload?.asset ||
        !!(
          mediaUrl(p.url) &&
          p.width &&
          p.width > 0 &&
          p.height &&
          p.height > 0
        ) ||
        "Upload an image or supply a trusted URL and positive dimensions."
      );
    }),
});
const point = object("point", [pct("x"), pct("y")]);
const hotspot = type({
  name: "hotspot",
  type: "object",
  components: { input: HotspotInput },
  fields: [
    string("roomId", "Room ID", true),
    pct("x"),
    pct("y"),
    field({
      name: "polygon",
      type: "array",
      of: [{ type: "point" }],
      validation: (r) => r.min(3),
    }),
  ],
  preview: { select: { title: "roomId" } },
});
const floor = object("floor", [
  string("floorId", "Stable floor ID", true),
  string("title", "Floor name", true),
  text("description"),
  obj("image", "architecturalImage", true),
  array("hotspots", "hotspot"),
]);
const room = object("room", [
  string("roomId", "Stable room ID", true),
  string("floorId", "Floor ID", true),
  string("title", "Room name", true),
  field({ name: "areaSqm", type: "number", validation: (r) => r.min(0) }),
  text("description"),
  array("images", "architecturalImage"),
]);
const media = type({
  name: "media",
  type: "object",
  fields: [
    string("title", "Title", true),
    url("url"),
    field({ name: "file", type: "file" }),
    obj("poster", "architecturalImage"),
    text("caption"),
    url("captionsUrl"),
    text("transcript"),
    field({
      name: "azimuth",
      type: "number",
      description: "Initial model camera angle in degrees.",
    }),
  ],
  validation: (r) =>
    r.custom((v) => {
      const m = v as { url?: string; file?: { asset?: unknown } } | undefined;
      return !m || !!(m.url || m.file?.asset) || "Choose a media URL or file.";
    }),
});
const section = object("section", [
  select("id", chapters),
  string("label", "Navigation label", true),
  string("title"),
  text("intro"),
  field({ name: "visible", type: "boolean", initialValue: true }),
]);
const material = object("material", [
  string("name", "Name", true),
  field({
    name: "swatch",
    type: "string",
    validation: (r) => r.regex(/^#[0-9a-f]{6}$/i),
  }),
  obj("image", "architecturalImage"),
  text("description"),
  string("category"),
]);
const fact = object("specification", [
  string("label", "Label", true),
  string("value", "Value", true),
  string("unit"),
]);
const external = field({
  name: "ctaLink",
  type: "string",
  validation: (r) =>
    r.custom((v) => !v || !!contactUrl(v) || "Enter a mailto or HTTPS link."),
});
const project = type({
  name: "project",
  type: "document",
  title: "Project",
  fields: [
    field({
      name: "demo",
      title: "Label this project DEMO",
      type: "boolean",
      initialValue: true,
    }),
    string("title", "Project title", true),
    string("slug"),
    text("subtitle"),
    ...["typology", "location", "year", "status", "area"].map((n) => string(n)),
    obj("hero", "architecturalImage", true),
    select("heroMode", ["image", "video"]),
    url("heroVideo"),
    field({
      name: "sections",
      type: "array",
      of: [{ type: "section" }],
      validation: (r) => r.required().min(1),
    }),
    field({ name: "concept", type: "array", of: [{ type: "block" }] }),
    array("conceptImages", "architecturalImage"),
    array("exterior", "architecturalImage"),
    array("interiors", "architecturalImage"),
    array("floors", "floor"),
    array("rooms", "room"),
    obj("video", "media"),
    obj("model", "media"),
    array("materials", "material"),
    array("facts", "specification"),
    obj("finaleImage", "architecturalImage"),
    text("recap"),
    string("ctaLabel"),
    external,
    string("seoTitle"),
    text("seoDescription"),
    obj("ogImage", "architecturalImage"),
  ],
  validation: (r) =>
    r.custom((v) => {
      const p = v as
        | {
            floors?: { floorId: string; hotspots?: { roomId: string }[] }[];
            rooms?: { roomId: string; floorId: string }[];
            sections?: { id: string }[];
          }
        | undefined;
      if (!p) return true;
      const floors = p.floors ?? [],
        rooms = p.rooms ?? [],
        sections = p.sections ?? [];
      const unique = (ids: string[]) => new Set(ids).size === ids.length;
      if (
        !unique(floors.map((f) => f.floorId)) ||
        !unique(rooms.map((r) => r.roomId)) ||
        !unique(sections.map((s) => s.id))
      )
        return "Floor, room and chapter IDs must each be unique.";
      if (rooms.some((r) => !floors.some((f) => f.floorId === r.floorId)))
        return "Each room must belong to an existing floor.";
      if (
        floors.some((f) =>
          f.hotspots?.some(
            (s) =>
              !rooms.some(
                (r) => r.roomId === s.roomId && r.floorId === f.floorId,
              ),
          ),
        )
      )
        return "Each hotspot must link to a room on its floor.";
      return true;
    }),
});
const settings = type({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    string("wordmark", "Wordmark", true),
    obj("logo", "architecturalImage"),
    string("contactName"),
    field({ name: "email", type: "string", validation: (r) => r.email() }),
    string("footer"),
    field({
      name: "navigation",
      type: "array",
      of: [{ type: "string" }],
      options: { list: [...chapters] },
    }),
    field({
      name: "socials",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            string("label"),
            field({
              name: "url",
              type: "url",
              validation: (r) => r.uri({ scheme: ["https"] }),
            }),
          ],
        },
      ],
    }),
    string("seoTitle"),
    text("seoDescription"),
  ],
});
export const schemaTypes = [
  settings,
  project,
  section,
  art,
  floor,
  room,
  hotspot,
  point,
  material,
  fact,
  media,
];
