import "server-only";
import { showcaseQuery } from "./query";
import { createClient, defineQuery } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { cache } from "react";
import { draftMode } from "next/headers";
import { demoProject, demoSettings } from "@/content/demo";
import type {
  Media,
  Picture,
  Project,
  Showcase,
  SiteSettings,
} from "@/content/types";
import { mediaUrl } from "@/lib/media";
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const client =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        apiVersion: "2025-02-19",
        useCdn: true,
        perspective: "published",
      })
    : null;
export const live = client
  ? defineLive({
      client,
      serverToken: process.env.SANITY_API_READ_TOKEN || false,
      browserToken: false,
    })
  : null;
const query = defineQuery(showcaseQuery);
const valid = (p?: Picture): p is Picture =>
  !!p &&
  !!mediaUrl(p.url) &&
  p.width > 0 &&
  p.height > 0 &&
  typeof p.alt === "string";
const images = (items?: Picture[]) => (items ?? []).filter(valid);
function safeMedia(m?: Media) {
  return m && mediaUrl(m.url)
    ? {
        ...m,
        poster: valid(m.poster) ? m.poster : undefined,
        captionsUrl: mediaUrl(m.captionsUrl),
      }
    : undefined;
}
export const getShowcase = cache(async (): Promise<Showcase | null> => {
  if (!live) return { settings: demoSettings, project: demoProject };
  const { isEnabled } = await draftMode();
  const data =
    isEnabled && client && process.env.SANITY_API_READ_TOKEN
      ? await client
          .withConfig({
            token: process.env.SANITY_API_READ_TOKEN,
            useCdn: false,
            perspective: "drafts",
          })
          .fetch(query, {}, { cache: "no-store" })
      : (
          await live.sanityFetch({
            query,
            perspective: "published",
            stega: false,
          })
        ).data;
  const raw = data as { project?: Project; settings?: SiteSettings };
  const p = raw.project;
  if (!p?.title || !valid(p.hero)) return null;
  return {
    settings: {
      ...raw.settings,
      wordmark: raw.settings?.wordmark || p.title,
      logo: valid(raw.settings?.logo) ? raw.settings.logo : undefined,
      navigation: raw.settings?.navigation ?? [],
    },
    project: {
      ...p,
      sections: p.sections ?? [],
      conceptImages: images(p.conceptImages),
      exterior: images(p.exterior),
      interiors: images(p.interiors),
      floors: (p.floors ?? [])
        .filter((f) => valid(f.image))
        .map((f) => ({ ...f, hotspots: f.hotspots ?? [] })),
      rooms: (p.rooms ?? []).map((r) => ({ ...r, images: images(r.images) })),
      heroVideo: mediaUrl(p.heroVideo),
      video: safeMedia(p.video),
      model: safeMedia(p.model),
      materials: (p.materials ?? []).map((m) => ({
        ...m,
        image: valid(m.image) ? m.image : undefined,
      })),
      facts: p.facts ?? [],
      ogImage: valid(p.ogImage) ? p.ogImage : undefined,
      finaleImage: valid(p.finaleImage) ? p.finaleImage : undefined,
    },
  };
});
