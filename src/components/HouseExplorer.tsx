"use client";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./house-explorer.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Box, Focus, Layers3, Maximize2, X } from "lucide-react";
import type { Floor, Media, Room } from "@/content/types";
import { Mark } from "./Header";
import { Picture } from "./Picture";
import { Dialog } from "./Dialog";

const Viewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <p className="house-loading" role="status">
      Opening model…
    </p>
  ),
});
export type ExplorerProps = {
  title: string;
  wordmark: string;
  demo?: boolean;
  media: Media;
  floors: Pick<Floor, "floorId" | "title">[];
  rooms: Room[];
};
class ViewerBoundary extends Component<
  { url: string; fallback: ReactNode; children: ReactNode },
  { failed: boolean; url: string }
> {
  state = { failed: false, url: this.props.url };
  static getDerivedStateFromProps(
    props: { url: string },
    state: { url: string },
  ) {
    return props.url === state.url ? null : { failed: false, url: props.url };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function HouseExplorer({
  title,
  wordmark,
  demo,
  media,
  floors,
  rooms,
  onBack,
}: ExplorerProps & { onBack?: () => void }) {
  const [mode, setMode] = useState<"furnished" | "massing">(
    media.furnishedUrl ? "furnished" : "massing",
  );
  const [floor, setFloor] = useState("exterior"),
    [roomId, setRoom] = useState("");
  const [nodes, setNodes] = useState<string[]>([]),
    [imageOpen, showImage] = useState(false);
  const backRef = useRef<HTMLAnchorElement>(null);
  const url =
    mode === "furnished" && media.furnishedUrl ? media.furnishedUrl : media.url;
  const onNodes = useCallback((list: string[]) => setNodes(list), []);
  const activeFloors =
    mode === "furnished"
      ? floors.filter((f) => nodes.includes("floor_" + f.floorId))
      : [];
  const roomList = rooms.filter(
    (r) => r.floorId === floor && nodes.includes("room_" + r.roomId),
  );
  const room = roomList.find((r) => r.roomId === roomId);
  const reference = room?.images[0];
  const currentFloor = activeFloors.find((f) => f.floorId === floor);
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (
        e.key !== "Escape" ||
        e.defaultPrevented ||
        document.querySelector(".room-image-dialog[open]")
      )
        return;
      e.preventDefault();
      if (onBack) onBack();
      else backRef.current?.click();
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onBack]);
  const fallback = (
    <div className="house-fallback">
      {media.poster && <Picture image={media.poster} />}
      <p role="status">The interactive model is unavailable. {media.caption}</p>
    </div>
  );
  function switchMode(m: typeof mode) {
    if (m !== mode) {
      setNodes([]);
      setFloor("exterior");
      setRoom("");
      setMode(m);
    }
  }
  return (
    <div
      className="house-explorer"
      data-mode={mode}
      data-floor={floor}
      data-room={roomId}
    >
      <header className="house-bar">
        <span className="brand">
          <Mark />
          {wordmark}
        </span>
        <Link
          prefetch={false}
          href="/#experience"
          ref={backRef}
          onClick={(e) => {
            if (
              onBack &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.shiftKey &&
              !e.altKey
            ) {
              e.preventDefault();
              onBack();
            }
          }}
        >
          Back to project <ArrowRight size={17} />
        </Link>
      </header>
      <div className="house-workspace">
        <aside className="house-sidebar" aria-label="Model options">
          <div className="house-title">
            <span className="eyebrow">
              {demo ? "Demo model" : "Architectural model"}
            </span>
            <h1>{title}</h1>
          </div>
          {media.furnishedUrl && (
            <div className="house-switch" role="group" aria-label="Model style">
              <button
                aria-pressed={mode === "furnished"}
                onClick={() => switchMode("furnished")}
              >
                <Box size={16} />
                Furnished
              </button>
              <button
                aria-pressed={mode === "massing"}
                onClick={() => switchMode("massing")}
              >
                <Layers3 size={16} />
                Massing
              </button>
            </div>
          )}
          {activeFloors.length > 0 && (
            <div className="house-levels">
              <h2>View</h2>
              <div role="group" aria-label="Building view">
                {[
                  { floorId: "exterior", title: "Exterior" },
                  ...activeFloors,
                ].map((f) => (
                  <button
                    key={f.floorId}
                    aria-pressed={f.floorId === floor}
                    onClick={() => {
                      setFloor(f.floorId);
                      setRoom("");
                    }}
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {roomList.length > 0 && (
            <label className="house-room-select">
              Room
              <select value={roomId} onChange={(e) => setRoom(e.target.value)}>
                <option value="">Whole floor</option>
                {roomList.map((r) => (
                  <option key={r.roomId} value={r.roomId}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {room && (
            <div className="house-reference">
              <h2>{room.title}</h2>
              {reference && (
                <button
                  className="house-image-button"
                  onClick={() => showImage(true)}
                >
                  <Picture image={reference} sizes="280px" />
                  <span>
                    <Maximize2 size={15} />
                    Open room image
                  </span>
                </button>
              )}
              <p>{room.description}</p>
            </div>
          )}
        </aside>
        <div className="house-stage">
          <div className="house-stage-label">
            <Focus size={15} />
            {room?.title ||
              currentFloor?.title ||
              (mode === "massing" ? "Massing study" : "Exterior")}
          </div>
          <ViewerBoundary url={url} fallback={fallback}>
            <Viewer
              url={url}
              floor={floor}
              room={roomId}
              azimuth={media.azimuth ?? 30}
              onNodes={onNodes}
              onPick={(id) => {
                if (roomList.some((r) => r.roomId === id)) setRoom(id);
              }}
              fallback={fallback}
            />
          </ViewerBoundary>
        </div>
      </div>
      {imageOpen && reference && room && (
        <Dialog
          title={room.title + " image"}
          close={() => showImage(false)}
          className="room-image-dialog"
        >
          <div>
            <header>
              <h2>{room.title}</h2>
              <button
                aria-label="Close room image"
                onClick={() => showImage(false)}
              >
                <X />
              </button>
            </header>
            <Picture image={reference} sizes="(max-width:700px) 100vw, 78vw" />
            {reference.caption && <p>{reference.caption}</p>}
          </div>
        </Dialog>
      )}
    </div>
  );
}
