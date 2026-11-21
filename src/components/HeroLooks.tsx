"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mediaSrc, mediaSrcSet } from "@/lib/format";
import type { Media } from "@/lib/types";

export type Look = { media: Media; name: string; href: string; price: string };

/** Pairs of model photos that cross-fade. Every photo is 2:3, shown whole in a 2:3 frame: nothing is cut. */
export function HeroLooks({ pairs }: { pairs: Look[][] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || pairs.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % pairs.length), 5000);
    return () => clearInterval(t);
  }, [paused, pairs.length]);
  const cur = pairs[i];

  return (
    <div className="flex h-full min-h-0 flex-col xl:h-auto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex min-h-0 flex-1 justify-center gap-3 sm:gap-4 xl:flex-none">
        {[0, 1].map((slot) => (
          <div key={slot} className="grid h-full min-w-0 flex-1 justify-items-center overflow-hidden xl:h-[calc(var(--photo-w)*1.5)] xl:w-[var(--photo-w)] items-center xl:flex-none">
            {pairs.map((pair, k) => {
              const l = pair[slot];
              if (!l) return null;
              return (
                <Link key={k} href={l.href} tabIndex={k === i ? 0 : -1} aria-hidden={k !== i}
                  className={`[grid-area:1/1] flex h-full items-center transition-opacity duration-1000 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaSrc(l.media, 800)} srcSet={mediaSrcSet(l.media)} sizes="(min-width: 1280px) 34vw, 46vw"
                    width={l.media.width} height={l.media.height} alt={`Model wearing the ${l.name}`}
                    loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : "auto"}
                    className="block h-auto max-h-full w-auto max-w-full shadow-[0_18px_40px_-24px_rgb(8_38_37/0.5)]" />
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-7 shrink-0 items-center justify-between gap-4 text-xs font-medium text-muted">
        <p className="truncate" aria-live="polite">
          {cur.map((l, k) => (
            <span key={l.href}>{k > 0 && <span className="mx-2 text-marigold">◆</span>}<Link href={l.href} className="text-ink hover:text-peacock">{l.name}</Link> <span className="text-muted">{l.price}</span></span>
          ))}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {pairs.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Show look ${k + 1}`} aria-current={k === i}
              className="grid h-7 w-6 place-items-center"><span className={`block h-[3px] rounded-full transition-all ${k === i ? "w-5 bg-peacock" : "w-2.5 bg-ink/20"}`} /></button>
          ))}
        </div>
      </div>
    </div>
  );
}
