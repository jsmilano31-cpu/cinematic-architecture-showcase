export const chapters = [
  "hero",
  "vision",
  "exterior",
  "floorplans",
  "interiors",
  "experience",
  "materials",
  "finale",
] as const;
export type Chapter = (typeof chapters)[number];
export type Picture = {
  url: string;
  portraitUrl?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  credit?: string;
  category?: string;
  roomId?: string;
  focalX?: number;
  focalY?: number;
};
export type Point = { x: number; y: number };
export type Hotspot = Point & { roomId: string; polygon?: Point[] };
export type Floor = {
  floorId: string;
  title: string;
  description?: string;
  image: Picture;
  hotspots: Hotspot[];
};
export type Room = {
  roomId: string;
  floorId: string;
  title: string;
  areaSqm?: number;
  description?: string;
  images: Picture[];
};
export type Media = {
  url: string;
  title: string;
  poster?: Picture;
  caption?: string;
  captionsUrl?: string;
  transcript?: string;
  azimuth?: number;
};
export type Section = {
  id: Chapter;
  label: string;
  title?: string;
  intro?: string;
  visible: boolean;
};
export type SiteSettings = {
  wordmark: string;
  logo?: Picture;
  contactName?: string;
  email?: string;
  footer?: string;
  navigation: Chapter[];
  socials?: { label: string; url: string }[];
  seoTitle?: string;
  seoDescription?: string;
};
export type Project = {
  demo?: boolean;
  title: string;
  slug?: string;
  subtitle?: string;
  typology?: string;
  location?: string;
  year?: string;
  status?: string;
  area?: string;
  hero: Picture;
  heroMode?: "image" | "video";
  heroVideo?: string;
  sections: Section[];
  concept?: string;
  conceptBlocks?: import("@portabletext/react").PortableTextProps["value"];
  conceptImages: Picture[];
  exterior: Picture[];
  interiors: Picture[];
  floors: Floor[];
  rooms: Room[];
  video?: Media;
  model?: Media;
  materials: {
    name: string;
    swatch?: string;
    image?: Picture;
    description?: string;
    category?: string;
  }[];
  facts: { label: string; value: string; unit?: string }[];
  finaleImage?: Picture;
  recap?: string;
  ctaLabel?: string;
  ctaLink?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: Picture;
};
export type Showcase = { settings: SiteSettings; project: Project };
