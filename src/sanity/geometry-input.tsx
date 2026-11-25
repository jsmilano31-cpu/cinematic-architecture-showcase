"use client";
import { useFormValue, useClient, set, type ObjectInputProps } from "sanity";
import { useRef, useState, type PointerEvent } from "react";
import { mediaUrl } from "@/lib/media";
type Drawing = { upload?: { asset?: { _ref?: string } }; url?: string };
export function HotspotInput(props: ObjectInputProps) {
  const floorPath = props.path.slice(0, props.path.lastIndexOf("hotspots"));
  const drawing = useFormValue([...floorPath, "image"]) as Drawing | undefined;
  const client = useClient({ apiVersion: "2025-02-19" });
  const ref = drawing?.upload?.asset?._ref;
  const m = ref?.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
  const cfg = client.config();
  const src = m
    ? "https://cdn.sanity.io/images/" +
      cfg.projectId +
      "/" +
      cfg.dataset +
      "/" +
      m[1] +
      "-" +
      m[2] +
      "." +
      m[3]
    : mediaUrl(drawing?.url);
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number }>();
  function position(clientX: number, clientY: number) {
    const r = box.current!.getBoundingClientRect();
    const pct = (fraction: number) =>
      Math.min(100, Math.max(0, Math.round(fraction * 1000) / 10));
    return {
      x: pct((clientX - r.left) / r.width),
      y: pct((clientY - r.top) / r.height),
    };
  }
  function commit(p: { x: number; y: number }) {
    if (!props.readOnly) props.onChange([set(p.x, ["x"]), set(p.y, ["y"])]);
  }
  function updateDrag(e: PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      setDrag(position(e.clientX, e.clientY));
  }
  return (
    <div>
      {src && (
        <>
          <p>
            Click the drawing, drag the marker, or enter its coordinates below.
          </p>
          <div
            ref={box}
            style={{ position: "relative", width: "100%" }}
            onClick={(e) => commit(position(e.clientX, e.clientY))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Floor plan for hotspot placement"
              style={{ width: "100%", display: "block" }}
            />
            <button
              type="button"
              disabled={props.readOnly}
              aria-label="Position hotspot"
              title="Drag to reposition or use the coordinate fields below"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDrag(position(e.clientX, e.clientY));
              }}
              onPointerMove={updateDrag}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  commit(position(e.clientX, e.clientY));
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                setDrag(undefined);
              }}
              onPointerCancel={() => setDrag(undefined)}
              onKeyDown={(e) => {
                const delta: Record<string, [number, number]> = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                };
                if (!delta[e.key]) return;
                e.preventDefault();
                const [dx, dy] = delta[e.key];
                commit({
                  x: Math.min(
                    100,
                    Math.max(0, Number(props.value?.x ?? 50) + dx),
                  ),
                  y: Math.min(
                    100,
                    Math.max(0, Number(props.value?.y ?? 50) + dy),
                  ),
                });
              }}
              style={{
                position: "absolute",
                touchAction: "none",
                cursor: "grab",
                left: Number(drag?.x ?? props.value?.x ?? 50) + "%",
                top: Number(drag?.y ?? props.value?.y ?? 50) + "%",
                transform: "translate(-50%,-50%)",
                border: "2px solid white",
                borderRadius: "50%",
                width: 24,
                height: 24,
                background: "#914928",
              }}
            />
          </div>
        </>
      )}
      {props.renderDefault(props)}
    </div>
  );
}
