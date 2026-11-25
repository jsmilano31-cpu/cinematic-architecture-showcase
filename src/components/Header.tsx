"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Section, SiteSettings } from "@/content/types";
import { Dialog } from "./Dialog";
import { Picture } from "./Picture";
export function Mark() {
  return (
    <svg
      viewBox="0 0 34 34"
      width="31"
      height="31"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M2 28V12L17 4l15 8v16l-15-8-15 8Zm0-16 15 8 15-8M17 4v16m-8 4V16m16 8v-8" />
    </svg>
  );
}
export function Header({
  settings,
  sections,
}: {
  settings: SiteSettings;
  sections: Section[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("hero");
  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = [...visible.keys()]
          .filter((id) => document.getElementById(id))
          .sort(
            (a, b) =>
              document.getElementById(a)!.offsetTop -
              document.getElementById(b)!.offsetTop,
          )[0];
        if (first) setActive(first);
      },
      { rootMargin: "-5% 0px -55% 0px" },
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [sections]);
  const links = sections.filter((s) => settings.navigation.includes(s.id));
  const nav = (items: Section[]) =>
    items.map((s) => (
      <a
        key={s.id}
        href={"#" + s.id}
        aria-current={active === s.id ? "location" : undefined}
        onClick={() => setOpen(false)}
      >
        {s.label}
      </a>
    ));
  return (
    <>
      <header className={"mast " + (active === "hero" ? "over-hero" : "solid")}>
        <div className="mast-inner">
          <a
            className="brand"
            href="#top"
            aria-label={settings.wordmark + " home"}
          >
            {settings.logo ? <Picture image={settings.logo} /> : <Mark />}
            <span>{settings.wordmark}</span>
          </a>
          <nav aria-label="Main chapters">{nav(links)}</nav>
          {sections.some((s) => s.id === "finale") && (
            <a className="contact-link" href="#finale">
              Get in touch
            </a>
          )}
          <button
            className="menu-button"
            aria-label="Open chapter menu"
            aria-expanded={open}
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              setOpen(true);
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      {open && (
        <Dialog
          className="menu-sheet"
          close={() => setOpen(false)}
          title="Chapter menu"
        >
          <div className="dialog-inner">
            <div className="menu-heading">
              {settings.wordmark}
              <button
                className="circle"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>
            <nav aria-label="All chapters">{nav(sections)}</nav>
          </div>
        </Dialog>
      )}
    </>
  );
}
