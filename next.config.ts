import type { NextConfig } from "next";
const hosts = [
  "cdn.sanity.io",
  ...(process.env.NEXT_PUBLIC_MEDIA_HOSTS || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
];
const config: NextConfig = {
  devIndicators: false,
  agentRules: false,
  images: {
    remotePatterns: hosts.map((hostname) => ({ protocol: "https", hostname })),
    qualities: [75, 85],
  },
  experimental: { cpus: 2 },
};
export default config;
