const approvedHosts = new Set([
  "cdn.sanity.io",
  ...(process.env.NEXT_PUBLIC_MEDIA_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
]);
export function mediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  if (
    /^\/demo\/[a-z0-9-]+\.(?:webp|png|jpe?g|avif|svg|mp4|webm|vtt|glb|gltf)$/i.test(
      value,
    )
  )
    return value;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      approvedHosts.has(url.hostname)
    )
      return url.href;
  } catch {}
}
// Only embed canonical player URLs from providers explicitly enabled in the media allowlist.
export function embedUrl(value: string): string | undefined {
  const trusted = mediaUrl(value);
  if (!trusted?.startsWith("https://")) return;
  const url = new URL(trusted);
  if (
    url.hostname === "www.youtube-nocookie.com" &&
    /^\/embed\/[a-zA-Z0-9_-]{11}$/.test(url.pathname)
  )
    return url.origin + url.pathname;
  if (
    url.hostname === "player.vimeo.com" &&
    /^\/video\/\d+$/.test(url.pathname)
  )
    return url.origin + url.pathname;
}
export function contactUrl(value?: string) {
  if (!value) return;
  if (/^mailto:[^\s?]+@[^\s?]+$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.href;
  } catch {}
}
