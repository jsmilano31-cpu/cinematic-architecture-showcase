"use client";
import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Floor, Room } from "@/content/types";
import { Picture } from "./Picture";
import { Gallery } from "./Gallery";
export function Plans({ floors, rooms }: { floors: Floor[]; rooms: Room[] }) {
  const [level, setLevel] = useState(0),
    [selection, setSelection] = useState<string>(),
    [zoom, setZoom] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]),
    viewport = useRef<HTMLDivElement>(null);
  const currentLevel = Math.min(level, floors.length - 1);
  const floor = floors[currentLevel];
  if (!floor) return <p className="empty">Plan drawings are being prepared.</p>;
  const available = rooms.filter((r) => r.floorId === floor.floorId),
    room = available.find((r) => r.roomId === selection) ?? available[0];
  const changeFloor = (i: number) => {
    setLevel(i);
    setSelection(undefined);
    setZoom(1);
    viewport.current?.scrollTo(0, 0);
  };
  return (
    <div className="plan-explorer">
      <div className="floor-tabs" role="tablist" aria-label="Floors">
        {floors.map((f, i) => (
          <button
            key={f.floorId}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={"tab-" + f.floorId}
            role="tab"
            aria-controls={"panel-" + f.floorId}
            aria-selected={currentLevel === i}
            tabIndex={currentLevel === i ? 0 : -1}
            onClick={() => changeFloor(i)}
            onKeyDown={(e) => {
              const j =
                e.key === "ArrowRight"
                  ? (i + 1) % floors.length
                  : e.key === "ArrowLeft"
                    ? (i + floors.length - 1) % floors.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? floors.length - 1
                        : null;
              if (j !== null) {
                e.preventDefault();
                changeFloor(j);
                tabs.current[j]?.focus();
              }
            }}
          >
            {f.title}
          </button>
        ))}
      </div>
      {floors.map(
        (f, i) =>
          currentLevel !== i && (
            <div
              hidden
              key={f.floorId}
              id={"panel-" + f.floorId}
              role="tabpanel"
              aria-labelledby={"tab-" + f.floorId}
            />
          ),
      )}
      <div
        role="tabpanel"
        id={"panel-" + floor.floorId}
        aria-labelledby={"tab-" + floor.floorId}
        className="plan-layout"
      >
        <div>
          <div className="drawing-frame">
            <div
              className="drawing-scroll"
              ref={viewport}
              tabIndex={zoom > 1 ? 0 : undefined}
              role="region"
              aria-label="Scrollable floor drawing"
            >
              <div
                key={floor.floorId}
                className="drawing"
                style={{
                  width: zoom * 100 + "%",
                  aspectRatio: floor.image.width + "/" + floor.image.height,
                }}
              >
                <Picture image={floor.image} />
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="plan-overlay"
                  aria-hidden="true"
                >
                  {floor.hotspots.map(
                    (s, i) =>
                      s.polygon && (
                        <polygon
                          key={i}
                          points={s.polygon
                            .map((p) => p.x + "," + p.y)
                            .join(" ")}
                          className={s.roomId === room?.roomId ? "chosen" : ""}
                          onClick={() => setSelection(s.roomId)}
                        />
                      ),
                  )}
                </svg>
                {floor.hotspots.map((s, i) => {
                  const r = available.find((x) => x.roomId === s.roomId);
                  return (
                    r && (
                      <button
                        className="hotspot"
                        aria-pressed={s.roomId === room?.roomId}
                        key={i}
                        style={{ left: s.x + "%", top: s.y + "%" }}
                        title={r.title}
                        aria-label={
                          "Select " +
                          r.title +
                          ", room " +
                          String(available.indexOf(r) + 1).padStart(2, "0")
                        }
                        onClick={() => setSelection(s.roomId)}
                      >
                        {String(available.indexOf(r) + 1).padStart(2, "0")}
                      </button>
                    )
                  );
                })}
              </div>
            </div>
            <div className="zoom-bar">
              <span>{floor.title}</span>
              <div>
                <button
                  aria-label="Zoom out plan"
                  disabled={zoom <= 1}
                  onClick={() => setZoom(zoom - 0.5)}
                >
                  <Minus />
                </button>
                <button
                  aria-label="Zoom in plan"
                  disabled={zoom >= 2.5}
                  onClick={() => setZoom(zoom + 0.5)}
                >
                  <Plus />
                </button>
                <button
                  aria-label="Reset plan zoom"
                  disabled={zoom === 1}
                  onClick={() => {
                    setZoom(1);
                    viewport.current?.scrollTo(0, 0);
                  }}
                >
                  <RotateCcw />
                </button>
              </div>
            </div>
          </div>
          <div className="room-list" role="group" aria-label="Rooms">
            {available.map((r, i) => (
              <button
                key={r.roomId}
                aria-pressed={r.roomId === room?.roomId}
                onClick={() => setSelection(r.roomId)}
              >
                <small>{String(i + 1).padStart(2, "0")}</small>
                {r.title}
              </button>
            ))}
          </div>
        </div>
        <div className="room-detail">
          {room?.images.length ? (
            <Gallery key={room.roomId} items={room.images} />
          ) : (
            <div className="room-plan-preview">
              <Picture image={floor.image} />
            </div>
          )}
          <div aria-live="polite" aria-atomic="true">
            <div className="room-meta">
              <span className="eyebrow">{floor.title}</span>
              {room?.areaSqm !== undefined && <span>{room.areaSqm} m²</span>}
            </div>
            <h3>{room?.title || "Select a room"}</h3>
            <p>{room?.description || floor.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
