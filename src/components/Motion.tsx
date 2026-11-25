"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const ChapterAnimation = dynamic(() => import("./ChapterAnimation"), {
  ssr: false,
});
export function Motion() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const media = matchMedia(
      "(min-width:1024px) and (prefers-reduced-motion:no-preference) and (pointer:fine)",
    );
    const device = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const update = () =>
      setEnabled(
        media.matches &&
          !device.connection?.saveData &&
          (device.deviceMemory ?? 8) >= 4,
      );
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return enabled ? <ChapterAnimation /> : null;
}
