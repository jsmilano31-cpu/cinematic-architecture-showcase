"use client";
import { Component, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Box, Play } from "lucide-react";
import type { Media } from "@/content/types";
import { embedUrl } from "@/lib/media";
import { Picture } from "./Picture";
const Viewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => <p role="status">Loading viewer…</p>,
});
class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function Film({ media }: { media: Media }) {
  const [failed, setFailed] = useState(false);
  const embed = embedUrl(media.url);
  return (
    <div>
      {failed ? (
        <div className="media-fallback">
          {media.poster && <Picture image={media.poster} />}
          <p role="status">The film is unavailable. {media.caption}</p>
        </div>
      ) : embed ? (
        <div>
          <iframe
            className="film"
            src={embed}
            title={media.title}
            allowFullScreen
            allow="fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <a
            className="player-link"
            href={embed}
            target="_blank"
            rel="noreferrer"
          >
            Open hosted film
          </a>
        </div>
      ) : (
        <video
          className="film"
          controls
          autoPlay
          playsInline
          poster={media.poster?.url}
          src={media.url}
          onError={() => setFailed(true)}
        >
          {media.captionsUrl && (
            <track
              kind="captions"
              src={media.captionsUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      )}
      {media.transcript && (
        <details className="transcript">
          <summary>Film description</summary>
          <p>{media.transcript}</p>
        </details>
      )}
    </div>
  );
}
export function MediaCard({
  media,
  kind,
}: {
  media: Media;
  kind: "video" | "model";
}) {
  const [opened, setOpened] = useState(false);
  const fallback = (
    <div className="media-fallback">
      {media.poster && <Picture image={media.poster} />}
      <p role="status">The interactive model is unavailable. {media.caption}</p>
    </div>
  );
  return (
    <article className="media-card">
      {opened ? (
        kind === "video" ? (
          <Film media={media} />
        ) : (
          <ModelBoundary fallback={fallback}>
            <Viewer media={media} fallback={fallback} />
          </ModelBoundary>
        )
      ) : (
        <button
          className={"media-cover " + kind}
          onClick={() => setOpened(true)}
        >
          {media.poster && <Picture image={media.poster} />}
          <span className="media-trigger">
            {kind === "video" ? <Play size={18} /> : <Box size={18} />}{" "}
            {kind === "video" ? "Watch film" : "View 3D model"}
          </span>
        </button>
      )}
      <h3>{media.title}</h3>
      <p>{media.caption}</p>
    </article>
  );
}
