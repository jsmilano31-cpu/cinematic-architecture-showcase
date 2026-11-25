"use client";
import { useEffect, useRef } from "react";
import {
  filmPosition,
  parseManifest,
  type FilmManifest,
  type FilmWindow,
} from "@/lib/film-sequence";
import { createFramePlayer } from "@/lib/frame-player";

export function FilmScroll({
  url,
  chapterOrder,
}: {
  url: string;
  chapterOrder: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!,
      main = canvas.closest("main")!;
    const windows = [
      ...main.querySelectorAll<HTMLElement>("[data-film-window]"),
    ];
    if (!windows.length) return;
    const opening = main.querySelector<HTMLElement>(".film-opening");
    const copy = opening?.querySelector<HTMLElement>(".hero-inner");
    const actions = copy?.querySelector<HTMLElement>(".hero-actions");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const portrait = matchMedia("(orientation:portrait)");
    const network = (
      navigator as Navigator & {
        connection?: EventTarget & { saveData?: boolean };
      }
    ).connection;
    const manifestRequest = new AbortController();
    const base = new URL(url, location.href).href;
    let disposed = false,
      failed = false,
      enabled = false,
      measured: FilmWindow[] = [],
      raf = 0;
    let manifest: FilmManifest | undefined,
      fetching = false,
      player: ReturnType<typeof createFramePlayer> | undefined;
    const measure = () => {
      const y = scrollY;
      measured = windows.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          start: Math.max(0, y + r.top - (el === opening ? 0 : innerHeight)),
          end: y + r.bottom,
        };
      });
      schedule();
    };
    function clearPlayer() {
      player?.dispose();
      player = undefined;
      delete main.dataset.filmDrawn;
      delete canvas.dataset.frame;
    }
    function resetCopy() {
      copy?.style.removeProperty("opacity");
      opening?.style.removeProperty("--film-shade");
      if (actions) actions.inert = false;
    }
    function fallback() {
      failed = true;
      clearPlayer();
      resetCopy();
      main.dataset.filmState = "failed";
    }
    async function readManifest() {
      fetching = true;
      try {
        const res = await fetch(base, { signal: manifestRequest.signal });
        if (!res.ok) throw Error();
        manifest = parseManifest(await res.json());
        if (!disposed) schedule();
      } catch {
        if (!disposed) fallback();
      }
    }
    function update() {
      raf = 0;
      if (disposed || !enabled || failed) return;
      const pos = filmPosition(measured, scrollY);
      if (opening && copy) {
        const progress = Math.max(
          0,
          -opening.getBoundingClientRect().top / Math.max(1, innerHeight),
        );
        const opacity = Math.max(0, 1 - progress / 0.72);
        // Keep the focused control visible until the visitor tabs or clicks away.
        const focused = copy.contains(document.activeElement);
        copy.style.opacity = String(focused ? 1 : opacity);
        opening.style.setProperty(
          "--film-shade",
          String(focused ? 1 : 0.16 + 0.84 * opacity),
        );
        if (actions) actions.inert = !focused && opacity === 0;
      }
      if (scrollY <= 1) {
        delete main.dataset.filmDrawn;
        return;
      }
      if (!pos.visible) return;
      if (!manifest) {
        if (!fetching) void readManifest();
        return;
      }
      if (!player) {
        const variant = portrait.matches ? "portrait" : "landscape";
        canvas.dataset.variant = variant;
        try {
          player = createFramePlayer(
            canvas,
            manifest[variant],
            manifest.count,
            base,
            (index) => {
              canvas.dataset.frame = String(index);
              if (scrollY > 1) main.dataset.filmDrawn = "true";
            },
            fallback,
          );
        } catch {
          fallback();
          return;
        }
      }
      const frame = Math.round(pos.progress * (manifest.count - 1));
      if (canvas.dataset.frame !== undefined) main.dataset.filmDrawn = "true";
      player.seek(frame);
    }
    function schedule() {
      if (!disposed && !raf) raf = requestAnimationFrame(update);
    }
    function preference() {
      enabled = !reduce.matches && !network?.saveData;
      clearPlayer();
      resetCopy();
      main.dataset.filmState = enabled && !failed ? "scroll" : "stills";
      measure();
    }
    function rotate() {
      clearPlayer();
      measure();
    }
    preference();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    for (const child of main.children) observer.observe(child);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    main.addEventListener("focusin", schedule);
    main.addEventListener("focusout", schedule);
    portrait.addEventListener("change", rotate);
    reduce.addEventListener("change", preference);
    network?.addEventListener("change", preference);
    return () => {
      disposed = true;
      manifestRequest.abort();
      cancelAnimationFrame(raf);
      observer.disconnect();
      clearPlayer();
      resetCopy();
      delete main.dataset.filmState;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      main.removeEventListener("focusin", schedule);
      main.removeEventListener("focusout", schedule);
      portrait.removeEventListener("change", rotate);
      reduce.removeEventListener("change", preference);
      network?.removeEventListener("change", preference);
    };
  }, [url, chapterOrder]);
  return <canvas className="film-screen" ref={ref} aria-hidden="true" />;
}
