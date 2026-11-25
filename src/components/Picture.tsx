import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import type { Picture as Source } from "@/content/types";
export function Picture({
  image,
  priority = false,
  sizes = "(max-width: 767px) 100vw, 55vw",
  className = "",
}: {
  image: Source;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const element = (
    <Image
      className={className}
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      quality={75}
      unoptimized={image.url.endsWith(".svg")}
      style={{
        objectPosition:
          (image.focalX ?? 50) + "% " + (image.focalY ?? 50) + "%",
      }}
    />
  );
  const portrait = priority && mediaUrl(image.portraitUrl);
  return portrait ? (
    <picture>
      <source
        media="(max-width: 767px) and (orientation: portrait)"
        type={portrait.endsWith(".avif") ? "image/avif" : undefined}
        srcSet={portrait}
      />
      {element}
    </picture>
  ) : (
    element
  );
}
