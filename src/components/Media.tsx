"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import type { Media } from "@/content/types";
import { embedUrl } from "@/lib/media";
import { Picture } from "./Picture";
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
export function MediaCard({ media }: { media: Media }) {
  const [opened, setOpened] = useState(false);
  return (
    <article className="media-card">
      {opened ? (
        <Film media={media} />
      ) : (
        <button className="media-cover video" onClick={() => setOpened(true)}>
          {media.poster && <Picture image={media.poster} />}
          <span className="media-trigger">
            <Play size={18} />
            Watch film
          </span>
        </button>
      )}
      <h3>{media.title}</h3>
      <p>{media.caption}</p>
    </article>
  );
}
