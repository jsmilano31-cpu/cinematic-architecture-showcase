import type { FrameTrack } from "./film-sequence";

// At most three requests and ten decoded frames, including during long reverse scrubs.
export function createFramePlayer(
  canvas: HTMLCanvasElement,
  track: FrameTrack,
  count: number,
  base: string,
  onDraw: (index: number) => void,
  onFailure: () => void,
) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw Error("Canvas unavailable");
  const cache = new Map<number, HTMLImageElement>();
  const pending = new Map<number, AbortController>();
  let target = -1,
    direction = 1,
    drawn = -1,
    dead = false;
  function paint() {
    if (dead || !cache.size) return;
    const closest = [...cache.keys()].reduce((a, b) =>
      Math.abs(a - target) <= Math.abs(b - target) ? a : b,
    );
    if (
      closest === drawn ||
      (drawn >= 0 && Math.abs(closest - target) > Math.abs(drawn - target))
    )
      return;
    if (canvas.width !== track.width || canvas.height !== track.height) {
      canvas.width = track.width;
      canvas.height = track.height;
    }
    ctx!.drawImage(cache.get(closest)!, 0, 0, canvas.width, canvas.height);
    drawn = closest;
    onDraw(closest);
  }
  async function load(index: number) {
    const controller = new AbortController();
    pending.set(index, controller);
    let blobUrl: string | undefined;
    try {
      const file = track.pattern.replace(
        "{frame}",
        String(index).padStart(3, "0"),
      );
      const response = await fetch(new URL(file, base), {
        signal: controller.signal,
        credentials: "same-origin",
      });
      if (!response.ok) throw Error("Frame unavailable");
      blobUrl = URL.createObjectURL(await response.blob());
      const image = new Image();
      image.src = blobUrl;
      await image.decode();
      if (dead || controller.signal.aborted) return;
      cache.set(index, image);
      if (cache.size > 10) {
        const farthest = [...cache.keys()].sort(
          (a, b) => Math.abs(b - target) - Math.abs(a - target),
        )[0];
        cache.delete(farthest);
      }
      paint();
    } catch {
      if (!dead && !controller.signal.aborted) onFailure();
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      pending.delete(index);
      if (!dead) pump();
    }
  }
  function pump() {
    if (dead || target < 0) return;
    for (const offset of [0, direction, 2 * direction, -direction]) {
      const i = target + offset;
      if (pending.size >= 3) break;
      if (i >= 0 && i < count && !cache.has(i) && !pending.has(i)) void load(i);
    }
  }
  return {
    seek(index: number) {
      if (dead || index === target) return;
      direction = index < target ? -1 : 1;
      target = index;
      for (const [i, c] of pending) if (Math.abs(i - target) > 8) c.abort();
      paint();
      pump();
    },
    dispose() {
      dead = true;
      for (const c of pending.values()) c.abort();
      cache.clear();
    },
  };
}
