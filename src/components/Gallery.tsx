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
    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-start">
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
        <div className="mx-auto" style={{ maxWidth: m.height > m.width * 1.6 ? 430 : undefined }}>
          <Photo key={m.url} m={m} alt={`${name}: ${labels[i] ?? "detail"}`} priority want={1200} sizes="(min-width: 1024px) 640px, 94vw" />
        </div>
      </div>
    </div>
  );
}
