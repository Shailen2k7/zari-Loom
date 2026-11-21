"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { PieceEditor } from "./PieceEditor";

type Item = {
  id: string;
  previews: string[];
  state: "working" | "ready" | "error";
  started: number;
  ms?: number;
  ai?: boolean;
  product?: Product;
  error?: string;
  extra: number; // photos still uploading onto this piece
};

/** Shrink big phone photos in the browser before upload: much faster on mobile data. Never crops. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2_500_000) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.9));
  } catch {
    return file;
  }
}

async function send(file: File, code?: string) {
  const body = new FormData();
  body.append("file", await shrink(file), file.name.replace(/\.\w+$/, "") + ".jpg");
  if (code) body.append("code", code);
  const res = await fetch("/api/admin/quick-add", { method: "POST", body });
  const json = await res.json().catch(() => ({ error: "The server did not answer. Try again." }));
  if (!res.ok) throw new Error(json.error || "Upload failed.");
  return json as { product: Product; ai?: boolean; aiEnabled?: boolean; ms: number };
}

export function QuickAdd({ aiOn, big = true }: { aiOn: boolean; big?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [group, setGroup] = useState(false);
  const [over, setOver] = useState(false);
  const [now, setNow] = useState(Date.now());
  const input = useRef<HTMLInputElement>(null);
  const patch = (id: string, p: Partial<Item> | ((i: Item) => Partial<Item>)) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...(typeof p === "function" ? p(x) : p) } : x)));

  const working = items.some((i) => i.state === "working");
  useEffect(() => {
    if (!working) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [working]);

  const handle = useCallback(async (list: File[]) => {
    const files = list.filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const groups = group ? [files] : files.map((f) => [f]);
    const fresh: Item[] = groups.map((g) => ({
      id: Math.random().toString(36).slice(2), previews: g.map((f) => URL.createObjectURL(f)),
      state: "working", started: Date.now(), extra: g.length - 1,
    }));
    setItems((xs) => [...fresh, ...xs]);
    // Up to three pieces at once.
    let next = 0;
    const worker = async () => {
      while (next < groups.length) {
        const k = next++;
        const g = groups[k], it = fresh[k];
        try {
          const r = await send(g[0]);
          patch(it.id, { state: "ready", product: r.product, ms: r.ms, ai: r.ai });
          for (const extra of g.slice(1)) {
            const r2 = await send(extra, r.product.code);
            patch(it.id, (x) => ({ product: r2.product, extra: x.extra - 1 }));
          }
        } catch (e) {
          patch(it.id, { state: "error", error: (e as Error).message });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }, [group]);

  // Paste a photo straight from WhatsApp Web or the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.some((f) => f.type.startsWith("image/"))) { e.preventDefault(); handle(files); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handle]);

  return (
    <section id="add" className="scroll-mt-24">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle([...e.dataTransfer.files]); }}
        className={`on-dark relative overflow-hidden rounded-2xl bg-deep text-cream transition ${over ? "ring-4 ring-marigold" : ""}`}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #e9a23b 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <button type="button" onClick={() => input.current?.click()}
          className={`relative flex w-full flex-col items-center justify-center gap-3 px-6 text-center ${big ? "py-12 sm:py-14" : "py-9"}`}>
          <span className={`grid h-16 w-16 place-items-center rounded-full border border-marigold/60 text-marigold transition ${over ? "scale-110 bg-marigold text-ink" : ""}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M12 16V4M6.5 9.5 12 4l5.5 5.5M4 15v4.5h16V15" /></svg>
          </span>
          <span className="display text-3xl sm:text-4xl">{over ? "Let go to add" : <>Drop photos. <em className="text-marigold">We write the listing.</em></>}</span>
          <span className="max-w-lg text-sm text-cream/75">
            Drag photos here, tap to choose from your phone, or paste one straight from WhatsApp (Ctrl/⌘ + V).
            {aiOn ? " AI reads each photo and fills in the name, category, colour, occasions and description." : " Add ANTHROPIC_API_KEY to let AI fill in the details for you."}
          </span>
        </button>
        <div className="relative flex flex-wrap items-center justify-center gap-2 border-t border-cream/10 px-4 py-3 text-xs">
          <span className="text-cream/60">Several photos at once:</span>
          {[[false, "One piece per photo"], [true, "All photos are one piece"]].map(([v, l]) => (
            <button key={String(v)} type="button" onClick={() => setGroup(v as boolean)} aria-pressed={group === v}
              className={`min-h-9 rounded-full px-3.5 font-medium transition ${group === v ? "bg-marigold text-ink" : "text-cream/80 hover:bg-cream/10"}`}>{l as string}</button>
          ))}
          <span className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${aiOn ? "bg-wa/30 text-cream" : "bg-cream/10 text-cream/60"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${aiOn ? "bg-[#5ee39a]" : "bg-cream/40"}`} /> AI {aiOn ? "on" : "off"}
          </span>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { handle([...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>

      {items.length > 0 && (
        <ul className="mt-5 grid gap-4">
          {items.map((it) => (
            <li key={it.id} className="grid gap-5 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:grid-cols-[180px_1fr] sm:p-5">
              <div>
                <div className="relative overflow-hidden rounded-lg bg-tint">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.previews[0]} alt="" className="block h-auto w-full" />
                  {it.state === "working" && <span aria-hidden className="ai-scan absolute inset-0" />}
                </div>
                {it.previews.length > 1 && (
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.previews.slice(1, 5).map((src) => <img key={src} src={src} alt="" className="aspect-square w-full rounded object-contain bg-tint" />)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                {it.state === "working" && (
                  <div aria-live="polite">
                    <p className="label text-amber">{aiOn ? "Reading the photo" : "Uploading"} · {((now - it.started) / 1000).toFixed(1)}s</p>
                    <div className="mt-4 space-y-3">
                      {[70, 40, 90, 55].map((w, i) => <span key={i} className="shimmer block h-4 rounded" style={{ width: `${w}%` }} />)}
                    </div>
                  </div>
                )}
                {it.state === "error" && (
                  <div role="alert">
                    <p className="font-medium text-rose">{it.error}</p>
                    <button type="button" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} className="mt-3 text-sm underline">Dismiss</button>
                  </div>
                )}
                {it.state === "ready" && it.product && (
                  <>
                    <p className="label mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-peacock">
                      <span>Code {it.product.code}</span>
                      <span className="text-muted">·</span>
                      <span>{it.ai ? "Drafted by AI" : "Ready to fill in"} in {((it.ms ?? 0) / 1000).toFixed(1)}s</span>
                      {it.extra > 0 && <span className="text-amber">Adding {it.extra} more {it.extra === 1 ? "photo" : "photos"}…</span>}
                    </p>
                    <PieceEditor product={it.product} compact />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
