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
  return (
    <div id="top">
      <a className="skip" href="#main">
        Skip to project
      </a>
      <Header settings={s} sections={sections} />
      <main id="main">
        {sections.map((c, i) => {
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
                  video={p.video}
                  heroVideo={p.heroMode === "video" ? p.heroVideo : undefined}
                  next={sections[i + 1]?.id}
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
                    {p.video && <MediaCard media={p.video} kind="video" />}
                    {p.model && <MediaCard media={p.model} kind="model" />}
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
                        <div
                          className="swatch"
                          style={{ backgroundColor: m.swatch }}
                        >
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
                  {p.finaleImage && (
                    <Picture image={p.finaleImage} sizes="100vw" />
                  )}
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
  );
}
