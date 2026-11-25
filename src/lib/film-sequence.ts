import { mediaUrl } from "./media";
export function manifestUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  if (/^\/demo\/(?:[a-z0-9-]+\/)+manifest\.json$/.test(value)) return value;
  const trusted = mediaUrl(value);
  if (
    trusted?.startsWith("https://") &&
    new URL(trusted).pathname.endsWith(".json")
  )
    return trusted;
}
export type FrameTrack = { width: number; height: number; pattern: string };
export type FilmManifest = {
  fps: number;
  count: number;
  landscape: FrameTrack;
  portrait: FrameTrack;
};
export function parseManifest(data: unknown): FilmManifest {
  const m = data as FilmManifest | null;
  function valid(t: FrameTrack | undefined) {
    return (
      t &&
      Number.isInteger(t.width) &&
      t.width > 0 &&
      t.width <= 4096 &&
      Number.isInteger(t.height) &&
      t.height > 0 &&
      t.height <= 4096 &&
      /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]*\{frame\}\.(webp|avif|jpg)$/.test(
        t.pattern,
      )
    );
  }
  if (
    !m ||
    !Number.isInteger(m.count) ||
    m.count < 2 ||
    m.count > 10000 ||
    !Number.isFinite(m.fps) ||
    m.fps <= 0 ||
    !valid(m.landscape) ||
    !valid(m.portrait)
  )
    throw Error("Invalid film manifest");
  return m;
}
export type FilmWindow = { start: number; end: number };
export function filmPosition(windows: FilmWindow[], scroll: number) {
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    if (scroll < w.start)
      return { progress: i / windows.length, visible: false };
    if (scroll <= w.end)
      return {
        progress:
          (i + Math.min(1, (scroll - w.start) / Math.max(1, w.end - w.start))) /
          windows.length,
        visible: true,
      };
  }
  return { progress: 1, visible: false };
}
