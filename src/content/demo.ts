import type { Picture, Project, Room, SiteSettings } from "./types";
import geometry from "./plan-geometry.json" with { type: "json" };
const pic = (
  file: string,
  alt: string,
  caption: string,
  category = "Exterior",
  roomId?: string,
): Picture => ({
  url: "/demo/" + file + ".webp",
  portraitUrl: file === "hero" ? "/demo/hero-portrait.avif" : undefined,
  width: file === "hero" ? 1672 : 1536,
  height: file === "hero" ? 941 : 1024,
  alt,
  caption,
  category,
  roomId,
  credit: "Fieldwork · Demo visualization",
});
const hero = pic(
  "hero",
  "A two-storey stone and glass courtyard house amid trees at dusk",
  "Garden elevation at dusk",
);
const exterior1 = pic(
  "exterior-1",
  "Limestone walls framing the sheltered garden court",
  "The planted court",
);
const exterior2 = pic(
  "exterior-2",
  "A sheltered passage where glazing meets warm timber and stone",
  "Between stone and glass",
);
const living = pic(
  "living",
  "A quiet living room opening onto the planted courtyard",
  "Living room",
  "Interior",
  "living",
);
const kitchen = pic(
  "kitchen",
  "Timber cabinetry and a dining table beside the garden",
  "Kitchen & dining",
  "Interior",
  "kitchen",
);
const bedroom = pic(
  "bedroom",
  "A bedroom with soft light and a framed garden view",
  "Primary bedroom",
  "Interior",
  "bedroom",
);
const study = pic(
  "study",
  "Oak joinery and a desk near a window in the upper study",
  "The study",
  "Interior",
  "study",
);
const rooms: Record<string, [string, string, Picture[]]> = {
  living: [
    "Living room",
    "Full-height glazing extends the living space to the edge of the planted court.",
    [living],
  ],
  kitchen: [
    "Kitchen & dining",
    "A continuous oak island anchors the shared dining space beside the garden.",
    [kitchen],
  ],
  courtyard: [
    "Garden court",
    "An open-air room brings daylight and a canopy of leaves into the center of the house.",
    [exterior1],
  ],
  bedroom: [
    "Primary bedroom",
    "A deep window recess gives the sleeping wing a private view across the court.",
    [bedroom],
  ],
  study: [
    "Study",
    "A sheltered workroom overlooks the courtyard from the quiet upper floor.",
    [study],
  ],
  terrace: [
    "Roof terrace",
    "An outdoor landing opens the upper floor to sky and tree canopy.",
    [],
  ],
};
export const demoSettings: SiteSettings = {
  wordmark: "Fieldwork",
  contactName: "Fieldwork Studio",
  email: "studio@example.com",
  footer: "Architectural studies",
  navigation: ["vision", "exterior", "floorplans", "experience"],
};
export const demoProject: Project = {
  demo: true,
  title: "Courtyard House",
  slug: "courtyard-house",
  subtitle:
    "A private residence shaped by light, stone, and the landscape between.",
  typology: "Private residence",
  status: "Concept study",
  year: "2026",
  hero,
  heroMode: "image",
  sequenceManifest: "/demo/sequence/manifest.json",
  sections: [
    { id: "hero", label: "Overview", visible: true },
    {
      id: "vision",
      label: "Vision",
      title: "A house around a garden.",
      intro: "At the center of the house, a garden takes the place of a room.",
      visible: true,
    },
    {
      id: "exterior",
      label: "Architecture",
      title: "Stone, in the landscape.",
      intro:
        "Deep eaves trace the edge of the court. Transparent walls open the living spaces to a quieter, inward landscape.",
      visible: true,
    },
    {
      id: "floorplans",
      label: "Plans",
      title: "Read the plan.",
      intro: "Select a floor, then a room to explore the house from within.",
      visible: true,
    },
    {
      id: "interiors",
      label: "Interiors",
      title: "Rooms in the light.",
      intro:
        "A series of spaces linked by timber, warm stone, and changing views of the court.",
      visible: true,
    },
    {
      id: "experience",
      label: "Experience",
      title: "Inside the project.",
      intro:
        "Watch the visual study or explore the building as a three-dimensional form.",
      visible: true,
    },
    {
      id: "materials",
      label: "Materials",
      title: "The material palette.",
      visible: true,
    },
    {
      id: "finale",
      label: "Contact",
      title: "Continue the conversation.",
      visible: true,
    },
  ],
  concept:
    "Two stone wings gather around an open courtyard. The lower floor follows the garden edge, while the upper rooms step back into the trees. Deep thresholds temper direct light and give each room a different relationship to the same landscape.",
  conceptImages: [exterior1],
  exterior: [hero, exterior1, exterior2],
  interiors: [living, kitchen, bedroom, study],
  floors: Object.entries(geometry).map(([floorId, spots]) => ({
    floorId,
    title: floorId === "ground" ? "Ground floor" : "Upper floor",
    image: {
      url: "/demo/" + floorId + ".svg",
      width: 1000,
      height: 660,
      alt:
        "Schematic " +
        floorId +
        " floor plan showing rooms arranged around the court.",
    },
    hotspots: spots,
  })),
  rooms: Object.entries(geometry).flatMap(([floorId, spots]) =>
    spots.map(({ roomId, areaSqm }): Room => ({
      roomId,
      floorId,
      areaSqm,
      title: rooms[roomId][0],
      description: rooms[roomId][1],
      images: rooms[roomId][2],
    })),
  ),
  video: {
    url: "/demo/film.mp4",
    title: "Architectural film",
    poster: hero,
    caption: "A silent sequence of views through the house.",
    transcript:
      "The film moves from the exterior and courtyard to the living, dining and private spaces. Still views are available in Architecture and Interiors.",
  },
  model: {
    url: "/demo/massing.glb",
    furnishedUrl: "/demo/furnished.glb",
    title: "House in 3D",
    poster: hero,
    azimuth: 18,
    caption: "Orbit the furnished house, lift away a floor or switch to the massing study.",
  },
  materials: [
    {
      name: "Honed limestone",
      swatch: "#b7ab92",
      category: "Envelope",
      description: "Pale horizontal courses catch the changing light.",
    },
    {
      name: "Smoked oak",
      swatch: "#78583d",
      category: "Joinery",
      description: "Warm oak lines the sheltered interior surfaces.",
    },
    {
      name: "Clear glass",
      swatch: "#91a397",
      category: "Openings",
      description: "Full-height panes connect the rooms to the garden.",
    },
  ],
  facts: [
    { label: "Typology", value: "Private residence" },
    { label: "Levels", value: "Two" },
    { label: "Design stage", value: "Concept study" },
  ],
  finaleImage: exterior2,
  recap:
    "A courtyard, two wings, and a sequence of rooms that follow the light.",
  ctaLabel: "Discuss the project",
  ctaLink: "mailto:studio@example.com",
  seoTitle: "Courtyard House — Fieldwork",
  seoDescription:
    "An interactive architectural concept study with floor plans, interior views, film, and a three-dimensional massing model.",
};
