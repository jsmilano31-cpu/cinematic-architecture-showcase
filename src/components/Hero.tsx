"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Media, Picture as ImageData } from "@/content/types";
import { Picture } from "./Picture";
import { Dialog } from "./Dialog";
import { Film } from "./Media";
export const pad = (n: number) => String(n).padStart(2, "0");
export function Hero({
  title,
  subtitle,
  typology,
  year,
  location,
  status,
  demo,
  slides,
  sequence,
  video,
  heroVideo,
  next,
}: {
  title: string;
  subtitle?: string;
  typology?: string;
  year?: string;
  location?: string;
  status?: string;
  demo?: boolean;
  slides: ImageData[];
  sequence?: boolean;
  video?: Media;
  heroVideo?: string;
  next?: string;
}) {
  const [selectedIndex, setIndex] = useState(0),
    [film, setFilm] = useState(false),
    [background, setBackground] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setBackground(
        !query.matches &&
          !(navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection?.saveData,
      );
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const words = title.trim().split(/\s+/);
  const last = words.pop();
  const index = Math.min(selectedIndex, slides.length - 1);
  const image = slides[index];
  const [paused, setPaused] = useState(false);
  return (
    <section id="hero" className="hero" aria-labelledby="project-title">
      <div className="hero-media" key={image.url}>
        <Picture image={image} priority={index === 0} sizes="100vw" />
        {heroVideo && background && index === 0 && !paused && (
          <video
            muted
            playsInline
            autoPlay
            loop
            poster={image.url}
            src={heroVideo}
            onError={() => setPaused(true)}
          />
        )}
      </div>
      <div className="hero-shade" />
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-tag">
            <i />
            {[typology, year].filter(Boolean).join("   /   ") || "Architecture"}
          </div>
          <h1 id="project-title">
            {words.length > 0 && (
              <>
                {words.join(" ")}
                <br />
              </>
            )}
            <em>{last}</em>
          </h1>
          {subtitle && <p>{subtitle}</p>}
          <div className="hero-actions">
            {next && (
              <a className="primary-action" href={"#" + next}>
                Explore the project <ArrowDown size={16} />
              </a>
            )}
            {video && (
              <button
                className="film-action"
                onClick={(event) => {
                  event.currentTarget.focus({ preventScroll: true });
                  setFilm(true);
                }}
              >
                <span>
                  <Play size={12} fill="currentColor" />
                </span>
                Watch film
              </button>
            )}
          </div>
        </div>
        <div className="hero-footer">
          <span className="hero-project-note">
            <span className="small-rule" />
            {[demo ? "Demo project" : location, status]
              .filter(Boolean)
              .join("  /  ")}
          </span>
          {sequence ? (
            <span className="scroll-cue">
              Scroll to explore <ArrowDown size={16} />
            </span>
          ) : (
            <div className="hero-index" aria-live="polite">
              <span className="slide-count">
                {pad(index + 1)} <b>/</b> <small>{pad(slides.length)}</small>
              </span>
              <span className="slide-line" />
              <span className="slide-caption">{image.caption}</span>
            </div>
          )}
          {!sequence && slides.length > 1 && (
            <div className="hero-pager">
              <button
                className="circle"
                aria-label="Previous exterior view"
                onClick={() =>
                  setIndex((index + slides.length - 1) % slides.length)
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="circle"
                aria-label="Next exterior view"
                onClick={() => setIndex((index + 1) % slides.length)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      {heroVideo && background && index === 0 && (
        <button className="hero-pause" onClick={() => setPaused(!paused)}>
          {paused ? "Play background" : "Pause background"}
        </button>
      )}
      {film && video && (
        <Dialog title={video.title} close={() => setFilm(false)}>
          <div className="dialog-inner film-dialog">
            <div className="dialog-bar">
              <h2>{video.title}</h2>
              <button
                aria-label="Close film"
                className="circle"
                onClick={() => setFilm(false)}
              >
                <X />
              </button>
            </div>
            <Film media={video} />
          </div>
        </Dialog>
      )}
    </section>
  );
}
