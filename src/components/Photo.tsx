import { mediaSrc, mediaSrcSet } from "@/lib/format";
import type { Media } from "@/lib/types";

/** A product photo, always shown whole at its natural shape. Never cropped. */
/**
 * `fit`: sits inside a fixed-shape `.cell` so cards line up in a grid. The whole photo is still shown
 * (scaled to fit, never cut), resting on the bottom edge so captions align.
 */
export function Photo({ m, alt, sizes, priority = false, want = 800, className = "", fit = false }: {
  m: Media; alt: string; sizes: string; priority?: boolean; want?: number; className?: string; fit?: boolean;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaSrc(m, want)}
      srcSet={mediaSrcSet(m)}
      sizes={sizes}
      width={m.width}
      height={m.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`${fit ? "fit" : "photo"} ${className}`}
    />
  );
  if (!fit) return img;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaSrc(m, 200)} alt="" aria-hidden loading="lazy" decoding="async" className="fit-fill" />
      {img}
    </>
  );
}
