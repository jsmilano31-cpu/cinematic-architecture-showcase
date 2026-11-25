import { Fragment } from "react";
import { FilmScroll } from "@/components/FilmScroll";
import { PortableText } from "@portabletext/react";
import { VisualEditing } from "next-sanity/visual-editing";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Header, Mark } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Gallery } from "@/components/Gallery";
import { Plans } from "@/components/Plans";
import { ModelEntry } from "@/components/ModelEntry";
import { MediaCard } from "@/components/Media";
import { Picture } from "@/components/Picture";
import { Motion } from "@/components/Motion";
import { DraftRefresh } from "@/components/DraftRefresh";
import type { Section } from "@/content/types";
import { getShowcase, live } from "@/sanity/server";
import { contactUrl } from "@/lib/media";
export async function generateMetadata(): Promise<Metadata> {
  const data = await getShowcase();
  if (!data) return { title: "Project unavailable" };
  const { project: p, settings: s } = data;
  const title = p.seoTitle || s.seoTitle || p.title + " — " + s.wordmark,
    description = p.seoDescription || s.seoDescription || p.subtitle,
    images = [(p.ogImage ?? p.hero).url];
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    title,
    description,
    alternates: { canonical: "/" },
    robots: { index: false, follow: false },
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
function Heading({ s }: { s: Section }) {
  return (
    <header className="chapter-heading" data-reveal>
      <div className="eyebrow kicker">
        <i />
        {s.label}
      </div>
      <h2>{s.title || s.label}</h2>
      {s.intro && <p>{s.intro}</p>}
    </header>
  );
}
export default async function Page() {
  const data = await getShowcase();
  if (!data) notFound();
  const { project: p, settings: s } = data;
  const sections = p.sections.filter(
    (c) => c.visible !== false && (c.id !== "experience" || p.video || p.model),
  );
  const slides = [
    p.hero,
    ...p.exterior.filter((x) => x.url !== p.hero.url),
  ].slice(0, 3);
  const draft = live && (await draftMode()).isEnabled;
  const contact =
    contactUrl(p.ctaLink) ||
    contactUrl(s.email ? "mailto:" + s.email : undefined);
  const renderSection = (c: Section, i: number) => {
    switch (c.id) {
      case "hero":
        return (
          <Hero
            key={c.id}
            title={p.title}
            subtitle={p.subtitle}
            year={p.year}
            typology={p.typology}
            location={p.location}
            status={p.status}
            demo={p.demo}
            slides={slides}
            sequence={!!p.sequenceManifest}
            video={p.video}
            heroVideo={
              !p.sequenceManifest && p.heroMode === "video"
                ? p.heroVideo
                : undefined
            }
            next={
              sections.find((s) => s.id === "vision")?.id ?? sections[i + 1]?.id
            }
          />
        );
      case "vision":
        return (
          <section id={c.id} key={c.id} className="chapter vision">
            <div className="vision-copy">
              <Heading s={c} />
              <div className="body-copy">
                {p.conceptBlocks ? (
                  <PortableText value={p.conceptBlocks} />
                ) : (
                  <p>{p.concept}</p>
                )}
              </div>
            </div>
            <div className="vision-photos">
              {p.conceptImages.map((img, i) => (
                <figure key={i}>
                  <Picture image={img} />
                  <figcaption>{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      case "exterior":
        return (
          <section id={c.id} key={c.id} className="chapter exterior">
            <Heading s={c} />
            <Gallery items={p.exterior} exterior />
          </section>
        );
      case "floorplans":
        return (
          <section id={c.id} key={c.id} className="chapter plans">
            <Heading s={c} />
            <Plans floors={p.floors} rooms={p.rooms} />
          </section>
        );
      case "interiors":
        return (
          <section id={c.id} key={c.id} className="chapter interiors">
            <Heading s={c} />
            <Gallery items={p.interiors} />
          </section>
        );
      case "experience":
        return (
          <section id={c.id} key={c.id} className="chapter experience">
            <Heading s={c} />
            <div className="media-grid">
              {p.video && <MediaCard media={p.video} />}
              {p.model && (
                <ModelEntry
                  media={p.model}
                  title={p.title}
                  wordmark={s.wordmark}
                  demo={p.demo}
                  floors={p.floors.map(({ floorId, title }) => ({
                    floorId,
                    title,
                  }))}
                  rooms={p.rooms}
                />
              )}
            </div>
          </section>
        );
      case "materials":
        return (
          <section id={c.id} key={c.id} className="chapter materials">
            <Heading s={c} />
            <div className="material-grid">
              {p.materials.map((m, i) => (
                <article key={i}>
                  <div className="swatch" style={{ backgroundColor: m.swatch }}>
                    {m.image && <Picture image={m.image} />}
                  </div>
                  <small className="eyebrow">{m.category}</small>
                  <h3>{m.name}</h3>
                  <p>{m.description}</p>
                </article>
              ))}
            </div>
            <dl className="facts">
              {[
                ...p.facts,
                ...(p.area
                  ? [
                      {
                        label: "Architectural area",
                        value: p.area,
                        unit: "",
                      },
                    ]
                  : []),
              ].map((f, i) => (
                <div key={i}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.value} {f.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      case "finale":
        return (
          <section id={c.id} key={c.id} className="finale">
            {p.finaleImage && <Picture image={p.finaleImage} sizes="100vw" />}
            <div className="finale-copy">
              <Heading s={c} />
              <p>{p.recap}</p>
              {contact && (
                <a className="primary-action" href={contact}>
                  {p.ctaLabel || "Contact the studio"}
                </a>
              )}
            </div>
          </section>
        );
    }
  };
  const stills = {
    vision: p.conceptImages[0],
    exterior: p.exterior.at(-1),
    floorplans: p.conceptImages[0],
    interiors: p.interiors[0],
    experience: p.video?.poster,
    materials: p.interiors.at(-1),
    finale: p.finaleImage,
  };
  return (
    <div className="project-viewport">
      <div id="top">
        <a className="skip" href="#main">
          Skip to project
        </a>
        <Header settings={s} sections={sections} />
        <main
          id="main"
          className={p.sequenceManifest ? "film-story" : undefined}
        >
          {p.sequenceManifest && (
            <FilmScroll
              url={p.sequenceManifest}
              chapterOrder={sections.map((s) => s.id).join("/")}
            />
          )}
          {sections.map((c, i) => {
            const chapter = renderSection(c, i);
            if (!p.sequenceManifest) return chapter;
            if (c.id === "hero")
              return (
                <div key={c.id} className="film-opening" data-film-window>
                  {chapter}
                </div>
              );
            const interlude = i > 0 && sections[i - 1].id !== "hero";
            const still = stills[c.id] ?? p.hero;
            return (
              <Fragment key={c.id}>
                {interlude && (
                  <div
                    className="film-interlude"
                    data-film-window
                    aria-hidden="true"
                  >
                    <Picture image={still} sizes="100vw" />
                  </div>
                )}
                {chapter}
              </Fragment>
            );
          })}
        </main>
        <footer className="footer">
          <a className="brand" href="#top">
            <Mark />
            {s.wordmark}
          </a>
          <span>
            {p.demo ? "Demo project · " : ""}
            {s.footer}
          </span>
          {s.socials?.map(
            (link) =>
              contactUrl(link.url) && (
                <a key={link.url} href={link.url}>
                  {link.label}
                </a>
              ),
          )}
          <a className="back" href="#top">
            Back to top <ArrowUp size={14} />
          </a>
        </footer>
        <Motion />
        {live && <live.SanityLive includeDrafts={false} />}{" "}
        {draft && (
          <>
            <DraftRefresh />
            <VisualEditing />
          </>
        )}
      </div>
    </div>
  );
}
