"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { Picture as Source } from "@/content/types";
import { Picture } from "./Picture";
import { Dialog } from "./Dialog";
export function Gallery({
  items,
  exterior = false,
}: {
  items: Source[];
  exterior?: boolean;
}) {
  const [selected, setActive] = useState<number | null>(null);
  const active =
    selected === null ? null : Math.min(selected, items.length - 1);
  const row = useRef<HTMLDivElement>(null);
  const swipe = useRef<number | null>(null);
  const [position, setPosition] = useState(0);
  const step = (i: number, dir: number) =>
    (i + dir + items.length) % items.length;
  const scrollTo = (i: number) => {
    const item = row.current?.children[i] as HTMLElement | undefined;
    if (row.current && item)
      row.current.scrollTo({
        left:
          item.getBoundingClientRect().left -
          row.current.getBoundingClientRect().left +
          row.current.scrollLeft,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  if (!items.length)
    return <p className="empty">Images for this chapter are being prepared.</p>;
  return (
    <>
      <div
        className={"gallery " + (exterior ? "exterior-grid" : "interior-grid")}
        ref={row}
        onScroll={() => {
          const el = row.current;
          if (el) {
            const first = el.children[0] as HTMLElement;
            setPosition(
              Math.min(
                items.length - 1,
                Math.round(el.scrollLeft / (first.offsetWidth + 16)),
              ),
            );
          }
        }}
      >
        {items.map((item, i) => (
          <figure key={item.url + i}>
            <button
              className="image-button"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                setActive(i);
              }}
              aria-label={
                "Open image " + (i + 1) + ", " + (item.caption || item.alt)
              }
            >
              <Picture
                image={item}
                sizes={
                  exterior
                    ? "(max-width: 767px) 86vw, 58vw"
                    : "(max-width: 767px) 86vw, 50vw"
                }
              />
              <span className="expand">
                <Expand size={15} />
              </span>
            </button>
            <figcaption>
              <span>{item.caption || item.alt}</span>
              <small>{String(i + 1).padStart(2, "0")}</small>
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length > 1 && (
        <div className="gallery-mobile-controls">
          <button
            aria-label="Previous gallery image"
            disabled={!position}
            className="circle"
            onClick={() => scrollTo(position - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            {position + 1} / {items.length}
          </span>
          <button
            aria-label="Next gallery image"
            className="circle"
            disabled={position === items.length - 1}
            onClick={() => scrollTo(position + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
      {active !== null && (
        <Dialog
          title="Image gallery"
          className="lightbox"
          close={() => setActive(null)}
          onKey={(key) =>
            setActive(step(active, key === "ArrowRight" ? 1 : -1))
          }
        >
          <div className="dialog-inner">
            <div className="dialog-bar">
              <span className="eyebrow" aria-live="polite">
                Image {active + 1} of {items.length}
              </span>
              <button
                className="circle"
                aria-label="Close gallery"
                onClick={() => setActive(null)}
              >
                <X />
              </button>
            </div>
            <div
              className="lightbox-image"
              onTouchStart={(e) => {
                swipe.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (swipe.current !== null) {
                  const delta = e.changedTouches[0].clientX - swipe.current;
                  if (Math.abs(delta) > 55)
                    setActive(step(active, delta < 0 ? 1 : -1));
                  swipe.current = null;
                }
              }}
            >
              <Picture image={items[active]} sizes="95vw" />
            </div>
            <div className="lightbox-bottom">
              <p aria-live="polite">
                {items[active].caption || items[active].alt}
              </p>
              {items.length > 1 && (
                <div className="pager">
                  <button
                    className="circle"
                    aria-label="Previous image"
                    onClick={() => setActive(step(active, -1))}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    className="circle"
                    aria-label="Next image"
                    onClick={() => setActive(step(active, 1))}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
