"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { ListingStudio } from "./ListingStudio";
import { uploadPhoto } from "./upload";

type Stage = "upload" | "read" | "write" | "ready" | "error";
type Item = {
  id: string;
  previews: string[];
  stage: Stage;
  pct: number;
  started: number;
  readAt?: number;
  ms?: number;
  ai?: boolean;
  product?: Product;
  error?: string;
  extra: number; // photos still uploading onto this piece
  open: boolean;
};

/** Three photo cards with an arrow: fans out when files are over the drop zone. */
function Stack({ lifted, busy, small }: { lifted?: boolean; busy?: boolean; small?: boolean }) {
  const card = "absolute inset-0 rounded-xl border border-line bg-white shadow-[0_6px_16px_-8px_rgb(8_38_37/0.35)] transition duration-500 ease-[cubic-bezier(.2,.8,.2,1)]";
  return (
    <span className={`relative inline-block shrink-0 align-middle ${small ? "h-14 w-12" : "h-[84px] w-[70px]"}`} aria-hidden>
      <span className={`${card} bg-tint`} style={{ transform: lifted ? "rotate(-16deg) translate(-14px,4px)" : "rotate(-8deg) translate(-5px,2px)" }} />
      <span className={`${card} bg-mist`} style={{ transform: lifted ? "rotate(14deg) translate(14px,4px)" : "rotate(7deg) translate(5px,2px)" }} />
      <span className={`${card} grid place-items-center overflow-hidden !border-peacock/20 bg-gradient-to-br from-white to-mist`} style={{ transform: lifted ? "translateY(-10px) scale(1.06)" : "none" }}>
        <span className={`grid place-items-center rounded-full ${small ? "h-8 w-8" : "h-10 w-10"} ${lifted ? "bg-marigold text-ink" : "bg-peacock text-cream"} ${busy ? "pulse-ring" : ""} transition-colors duration-300`}>
          <svg width={small ? 16 : 20} height={small ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" className={lifted ? "" : "drop-bob"} />
          </svg>
        </span>
      </span>
    </span>
  );
}

function GroupToggle({ group, setGroup, full }: { group: boolean; setGroup: (v: boolean) => void; full?: boolean }) {
  return (
    <div className={`mt-3 rounded-full bg-tint p-0.5 text-xs font-medium ${full ? "flex" : "inline-flex"}`} role="radiogroup" aria-label="When you add several photos">
      {[[false, "Each photo is a piece"], [true, "All photos, one piece"]].map(([v, l]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={group === v} onClick={() => setGroup(v as boolean)}
          className={`min-h-8 rounded-full px-3 transition ${full ? "flex-1" : ""} ${group === v ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"}`}>{l as string}</button>
      ))}
    </div>
  );
}

function StageList({ it, aiOn, now }: { it: Item; aiOn: boolean; now: number }) {
  const order: Stage[] = ["upload", "read", "write", "ready"];
  const at = order.indexOf(it.stage);
  const rows = [
    { k: "upload", t: "Uploading the photo", d: it.stage === "upload" ? `${it.pct}%` : "Done" },
    { k: "read", t: aiOn ? "Reading the weave" : "Making web sizes", d: aiOn ? "Colour, motifs, border and pallu" : "Sharp on every screen" },
    { k: "write", t: aiOn ? "Writing the listing" : "Preparing the draft", d: aiOn ? "Title, category, occasions, description" : "Ready for your details" },
    { k: "ready", t: "Ready for your review", d: "Check it, set the price, publish" },
  ];
  return (
    <ol className="grid gap-2">
      {rows.map((r, i) => {
        const done = i < at, active = i === at;
        return (
          <li key={r.k} className={`flex items-start gap-2.5 transition-opacity duration-500 ${i > at ? "opacity-40" : ""}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold transition-colors duration-500 ${
              done ? "bg-peacock text-white" : active ? "pulse-ring bg-marigold text-ink" : "bg-line text-muted"}`}>
              {done ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden><path className="draw-check" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              ) : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className={`text-sm ${active ? "font-semibold text-ink" : "font-medium"}`}>{r.t}<span className="hidden font-normal text-muted sm:inline"> · {r.d}</span></span>
                {active && r.k !== "upload" && <span className="text-xs tabular-nums text-muted">{((now - (it.readAt ?? it.started)) / 1000).toFixed(1)}s</span>}
              </span>
              {active && r.k === "upload" && (
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line">
                  <span className="progress-stripes block h-full rounded-full bg-peacock transition-[width] duration-300" style={{ width: `${Math.max(4, it.pct)}%` }} />
                </span>
              )}
              {active && (r.k === "read" || r.k === "write") && (
                <span className="mt-1.5 block">
                  {[60].map((w, k) => <span key={k} className="shimmer block h-1.5 rounded" style={{ width: `${w}%` }} />)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function QuickAdd({ aiOn }: { aiOn: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [group, setGroup] = useState(false);
  const [over, setOver] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [winDrag, setWinDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const patch = (id: string, p: Partial<Item> | ((i: Item) => Partial<Item>)) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...(typeof p === "function" ? p(x) : p) } : x)));

  const busy = items.some((i) => i.stage !== "ready" && i.stage !== "error");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [busy]);
  // "Reading" becomes "Writing" after a moment: the server does both in one go, this just shows where it is.
  useEffect(() => {
    for (const it of items) if (it.stage === "read" && it.readAt && now - it.readAt > 2200) patch(it.id, { stage: "write" });
  }, [now, items]);

  const handle = useCallback(async (list: File[]) => {
    const files = list.filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const groups = group ? [files] : files.map((f) => [f]);
    const fresh: Item[] = groups.map((g) => ({
      id: Math.random().toString(36).slice(2), previews: g.map((f) => URL.createObjectURL(f)),
      stage: "upload", pct: 0, started: Date.now(), extra: g.length - 1, open: true,
    }));
    setItems((xs) => [...fresh.map((x) => x), ...xs.map((x) => (x.stage === "ready" ? { ...x, open: false } : x))]);
    let next = 0;
    const worker = async () => {
      while (next < groups.length) {
        const k = next++;
        const g = groups[k], it = fresh[k];
        try {
          const r = await uploadPhoto(g[0], {
            onProgress: (pct) => patch(it.id, { pct }),
            onSent: () => patch(it.id, { stage: "read", readAt: Date.now() }),
          });
          patch(it.id, { stage: "ready", product: r.product, ms: r.ms, ai: r.ai });
          for (const extra of g.slice(1)) {
            const r2 = await uploadPhoto(extra, { code: r.product.code });
            patch(it.id, (x) => ({ product: r2.product, extra: x.extra - 1 }));
          }
        } catch (e) {
          patch(it.id, { stage: "error", error: (e as Error).message });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }, [group]);

  // Files dragged onto the window (not while a piece is open for editing, which has its own photo drop).
  useEffect(() => {
    const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes("Files");
    const enter = (e: DragEvent) => { if (hasFiles(e) && !document.querySelector('[role="dialog"]')) setWinDrag(true); };
    const end = () => setWinDrag(false);
    window.addEventListener("dragenter", enter);
    window.addEventListener("drop", end);
    window.addEventListener("dragend", end);
    return () => { window.removeEventListener("dragenter", enter); window.removeEventListener("drop", end); window.removeEventListener("dragend", end); };
  }, []);

  // Photos shared into the Studio app (Android share sheet) wait in the service worker's cache: pick them up once.
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current || !("caches" in window)) return;
    picked.current = true;
    (async () => {
      try {
        const cache = await caches.open("zl-shared");
        const keys = await cache.keys();
        if (!keys.length) return;
        const files: File[] = [];
        for (const k of keys) {
          const r = await cache.match(k);
          if (r) files.push(new File([await r.blob()], decodeURIComponent(r.headers.get("x-name") || "photo.jpg"), { type: r.headers.get("content-type") || "image/jpeg" }));
          await cache.delete(k);
        }
        const url = new URL(window.location.href);
        if (url.searchParams.has("shared")) { url.searchParams.delete("shared"); history.replaceState(null, "", url.pathname + url.search + url.hash); }
        document.getElementById("add")?.scrollIntoView({ behavior: "smooth", block: "start" });
        handle(files);
      } catch {}
    })();
  }, [handle]);

  // Paste a photo straight from WhatsApp Web or the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.some((f) => f.type.startsWith("image/"))) { e.preventDefault(); handle(files); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handle]);

  return (
    <section id="add" className="scroll-mt-24">
      {/* Desktop: drag photos anywhere on the page and a full-window target appears. */}
      {winDrag && (
        <div className="drop-veil fixed inset-0 z-[60] hidden p-6 sm:block"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
          onDragLeave={(e) => { if (e.relatedTarget === null) setWinDrag(false); }}
          onDrop={(e) => { e.preventDefault(); setWinDrag(false); setOver(false); handle([...e.dataTransfer.files]); }}>
          <div className="pointer-events-none grid h-full place-items-center rounded-3xl border-2 border-dashed border-marigold bg-white/80">
            <div className="text-center">
              <Stack lifted />
              <p className="display mt-5 text-[2rem] leading-tight">Drop to add {group ? "one piece" : "your pieces"}</p>
              <p className="mt-1.5 text-sm text-muted">{aiOn ? "AI writes each listing while the photos upload." : "Each photo becomes a draft you can finish."}</p>
            </div>
          </div>
        </div>
      )}

      <div
        data-over={over}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); setWinDrag(false); handle([...e.dataTransfer.files]); }}
        className={`drop-zone @container group/drop relative rounded-2xl border-2 border-dashed transition duration-300 ${over ? "border-marigold bg-marigold/[0.07] shadow-[0_18px_40px_-24px_rgb(233_162_59/0.6)]" : "border-peacock/25 bg-white hover:border-peacock/50 hover:bg-mist/60"}`}
      >
        {/* Desktop and tablet */}
        <div className="hidden items-center gap-6 px-6 py-6 @2xl:flex @4xl:gap-7 @4xl:px-7">
          <button type="button" onClick={() => input.current?.click()} aria-label="Choose photos" className="shrink-0"><Stack lifted={over} busy={busy} /></button>
          <div className="min-w-0 flex-1">
            <p className="display text-[1.5rem] leading-tight">
              {over ? "Drop to upload" : busy ? <>Working on it. <em className="text-amber">Add more any time.</em></> : <>Drag photos here. <em className="text-amber">{aiOn ? "We write the listing." : "We make the draft."}</em></>}
            </p>
            <p className="mt-1 text-sm text-muted">
              Or <button type="button" onClick={() => input.current?.click()} className="font-semibold text-peacock underline decoration-peacock/30 underline-offset-4 hover:decoration-peacock">browse your computer</button>, or paste from WhatsApp with <kbd className="rounded border border-line bg-tint px-1.5 py-px font-sans text-xs">⌘ V</kbd>
            </p>
            <GroupToggle group={group} setGroup={setGroup} />
          </div>
          <button type="button" onClick={() => input.current?.click()} className="btn btn-primary hidden shrink-0 @4xl:inline-flex">Choose photos</button>
        </div>

        {/* Phone */}
        <div className="p-4 @md:p-5 @2xl:hidden">
          <div className="flex items-center gap-3.5">
            <Stack small busy={busy} />
            <div className="min-w-0">
              <p className="display text-[1.3rem] leading-tight">{busy ? "Working on it…" : "Add a new piece"}</p>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{aiOn ? "Snap or pick photos. AI writes the listing." : "Snap or pick photos to start a draft."}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => camera.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-deep text-sm font-semibold text-cream active:scale-[0.98]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.5" /></svg>
              Take photo
            </button>
            <button type="button" onClick={() => input.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-ink active:scale-[0.98]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="4" width="16" height="16" rx="2.5" /><circle cx="9.5" cy="9.5" r="1.5" /><path d="m20 15-4.5-4.5L6 20" /></svg>
              Gallery
            </button>
          </div>
          <GroupToggle group={group} setGroup={setGroup} full />
        </div>

        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { handle([...(e.target.files ?? [])]); e.target.value = ""; }} />
        <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handle([...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>

      {items.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {items.map((it) => (
            <li key={it.id} className="pop-in overflow-hidden rounded-2xl border border-line bg-[#fbfbf8] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_24px_-18px_rgb(8_38_37/0.25)]">
              {it.stage !== "ready" ? (
                <div className="grid grid-cols-[88px_1fr] gap-4 p-4 sm:grid-cols-[120px_1fr] sm:gap-5" aria-live="polite">
                  <div className="relative self-start overflow-hidden rounded-xl bg-tint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.previews[0]} alt="" className={`block h-auto w-full transition duration-700 ${it.stage === "error" ? "grayscale" : it.stage === "upload" ? "opacity-70 blur-[1px]" : ""}`} />
                    {it.stage !== "error" && <span aria-hidden className="ai-scan absolute inset-0" />}
                    {it.previews.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-deep/85 px-2 py-0.5 text-xs font-semibold text-cream">+{it.previews.length - 1} photos</span>}
                  </div>
                  {it.stage === "error" ? (
                    <div role="alert" className="self-center">
                      <p className="font-semibold">That one didn&apos;t go through</p>
                      <p className="mt-1 text-rose">{it.error}</p>
                      <button type="button" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} className="btn btn-ghost mt-3 !min-h-10 text-sm">Dismiss</button>
                    </div>
                  ) : (
                    <div className="self-center">
                      <p className="flex items-baseline justify-between gap-3"><span className="font-semibold">Creating your listing</span><span className="text-xs tabular-nums text-muted">{((now - it.started) / 1000).toFixed(1)}s</span></p>
                      <div className="mt-3"><StageList it={it} aiOn={aiOn} now={now} /></div>
                    </div>
                  )}
                </div>
              ) : it.product && (
                <div>
                  <button type="button" onClick={() => patch(it.id, (x) => ({ open: !x.open }))} aria-expanded={it.open}
                    className="flex w-full items-center gap-3 border-b border-line bg-white px-4 py-2.5 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.previews[0]} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{it.product.name}</span>
                      <span className="flex flex-wrap gap-x-3 text-xs text-muted">
                        <span>Code {it.product.code}</span>
                        <span className="text-peacock">{it.ai ? "Written by AI" : "Ready to fill in"} in {((it.ms ?? 0) / 1000).toFixed(1)}s</span>
                        {it.extra > 0 && <span className="text-amber">Adding {it.extra} more {it.extra === 1 ? "photo" : "photos"}…</span>}
                        <span className={it.product.status === "live" ? "font-semibold text-[#17613a]" : ""}>{it.product.status === "live" ? "● Live" : "Draft"}</span>
                      </span>
                    </span>
                    <span aria-hidden className={`text-xl text-muted transition ${it.open ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {it.open && (
                    <div className="p-3 sm:p-4">
                      <ListingStudio key={it.product.code} product={it.product} reveal
                        onSaved={(np) => patch(it.id, { product: np })} />
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
