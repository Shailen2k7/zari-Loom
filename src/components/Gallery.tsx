"use client";
import { useState } from "react";
import { mediaSrc } from "@/lib/format";
import type { Media } from "@/lib/types";
import { Photo } from "./Photo";

/** Full-image gallery: the main photo is shown whole; thumbnails keep their own shape too. */
export function Gallery({ media, name }: { media: Media[]; name: string }) {
  const [i, setI] = useState(0);
  const labels = ["Full view", "Back and dupatta", "Dupatta detail", "Weave detail", "Detail", "Detail"];
  const m = media[i] ?? media[0];
  if (!m) return null;
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-start lg:sticky lg:top-28 lg:self-start">
      {media.length > 1 && (
        <ul className="no-scrollbar flex gap-2.5 overflow-x-auto md:w-20 md:shrink-0 md:flex-col md:overflow-visible">
          {media.map((t, k) => (
            <li key={t.url} className="w-16 shrink-0 md:w-full">
              <button type="button" onClick={() => setI(k)} aria-label={`Show photo ${k + 1}: ${labels[k] ?? "Detail"}`} aria-current={k === i}
                className={`block w-full rounded-[4px] border-2 p-0.5 ${k === i ? "border-peacock" : "border-transparent hover:border-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaSrc(t, 200)} width={t.width} height={t.height} alt="" loading="lazy" className="photo" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="min-w-0 flex-1">
        {/* Desktop: a stage the height of the screen, photo whole on a soft blurred copy of itself. Phone: the photo at its own shape. */}
        <div className="relative overflow-hidden rounded-[4px] bg-tint lg:h-[min(calc(100svh-9rem),880px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaSrc(m, 200)} alt="" aria-hidden className="fit-fill hidden lg:block" />
          <Photo key={m.url} m={m} alt={`${name}: ${labels[i] ?? "detail"}`} priority want={1200} sizes="(min-width: 1024px) 640px, 94vw"
            className="fade-in relative !rounded-none lg:!absolute lg:inset-0 lg:!h-full lg:!w-full lg:object-contain !bg-transparent" />
        </div>
      </div>
    </div>
  );
}
