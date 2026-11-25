"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Box } from "lucide-react";
import { HouseExplorer, type ExplorerProps } from "./HouseExplorer";
import { Picture } from "./Picture";

export function ModelEntry(props: ExplorerProps) {
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const entry = useRef<HTMLAnchorElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef(0);
  const visible = phase !== "closed";
  const close = useCallback(() => {
    if (location.pathname === "/model") history.back();
  }, []);
  useEffect(() => {
    function sync() {
      if (location.pathname === "/model" && history.state?.houseExplorer) {
        scroll.current = window.scrollY;
        setPhase("open");
      } else setPhase((p) => (p === "closed" ? "closed" : "closing"));
    }
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const el = dialog.current!;
    const top = document.getElementById("top");
    const overflow = document.body.style.overflow;
    const previousTitle = document.title;
    document.title = props.title + " | House explorer";
    const opener = entry.current;
    document.body.style.overflow = "hidden";
    top?.classList.add("house-away");
    el.showModal();
    el.querySelector<HTMLAnchorElement>(".house-bar a")?.focus({
      preventScroll: true,
    });
    return () => {
      el.close();
      top?.classList.remove("house-away");
      document.body.style.overflow = overflow;
      document.title = previousTitle;
      window.scrollTo({ top: scroll.current, behavior: "instant" });
      opener?.focus({ preventScroll: true });
    };
  }, [visible, props.title]);
  useEffect(() => {
    if (phase !== "closing") return;
    const top = document.getElementById("top");
    top?.classList.add("house-return");
    const id = setTimeout(
      () => setPhase("closed"),
      matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 420,
    );
    return () => {
      clearTimeout(id);
      top?.classList.remove("house-return");
    };
  }, [phase]);
  function open(e: MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    scroll.current = window.scrollY;
    document.querySelectorAll("video").forEach((v) => v.pause());
    history.pushState({ houseExplorer: true }, "", "/model");
    setPhase("open");
  }
  return (
    <article className="media-card">
      <a
        id="open-house-model"
        className="media-cover"
        href="/model"
        ref={entry}
        onClick={open}
        aria-label="View 3D model"
      >
        {props.media.poster && <Picture image={props.media.poster} />}
        <span className="media-trigger">
          <Box size={18} />
          View 3D model
        </span>
      </a>
      <h3>{props.media.title}</h3>
      <p>{props.media.caption}</p>
      {visible &&
        createPortal(
          <dialog
            ref={dialog}
            className={
              "house-dialog " + (phase === "closing" ? "is-closing" : "")
            }
            aria-label="House explorer"
            onCancel={(e) => {
              if (e.currentTarget !== e.target) return;
              e.preventDefault();
              close();
            }}
          >
            <HouseExplorer {...props} onBack={close} />
          </dialog>,
          document.body,
        )}
    </article>
  );
}
