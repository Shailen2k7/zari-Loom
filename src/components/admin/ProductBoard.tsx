"use client";
import { useEffect, useMemo, useState } from "react";
import { categories } from "@/config/site";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PieceEditor, Thumb } from "./PieceEditor";

const tone: Record<string, string> = {
  live: "bg-[#e3f1e8] text-[#17613a]",
  draft: "bg-marigold/25 text-amber",
  sold_out: "bg-rose/10 text-rose",
};
const label: Record<string, string> = { live: "Live", draft: "Draft", sold_out: "Sold out" };

/** All pieces as a photo wall. Tap one to edit it in a side sheet. */
export function ProductBoard({ products: initial, startStatus = "" }: { products: Product[]; startStatus?: string }) {
  const [products, setProducts] = useState(initial);
  const [status, setStatus] = useState(startStatus);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Product | null>(null);
  useEffect(() => setProducts(initial), [initial]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) =>
      (!status || p.status === status) && (!cat || p.category === cat) &&
      (!s || `${p.code} ${p.name} ${p.colour} ${p.weave}`.toLowerCase().includes(s)));
  }, [products, status, cat, q]);

  const count = (s: string) => products.filter((p) => !s || p.status === s).length;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {[["", "All"], ["live", "Live"], ["draft", "Drafts"], ["sold_out", "Sold out"]].map(([s, l]) => (
            <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${status === s ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink"}`}>
              {l} <span className="text-xs opacity-60">{count(s)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="field !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, colour or code" className="field !min-h-10 !py-1.5 text-sm lg:!w-64" aria-label="Search pieces" />
        </div>
      </div>

      {shown.length === 0 ? <p className="mt-12 text-center text-muted">No pieces match.</p> : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {shown.map((p) => (
            <li key={p.code}>
              <button type="button" onClick={() => setOpen(p)} className="group block w-full text-left">
                <span className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-xl bg-white p-2 ring-1 ring-line transition group-hover:ring-2 group-hover:ring-peacock">
                  <Thumb p={p} className="max-h-full !w-auto max-w-full rounded-md object-contain" />
                  <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${tone[p.status]}`}>{label[p.status]}</span>
                  {p.featured && <span className="absolute right-2 top-2 rounded-full bg-deep px-2 py-1 text-xs font-semibold text-marigold">★</span>}
                </span>
                <span className="mt-2.5 block truncate text-sm font-medium group-hover:text-peacock">{p.name}</span>
                <span className="flex items-center justify-between text-xs text-muted">
                  <span>#{p.code} · {p.stock} in stock</span>
                  <span className="font-semibold text-ink">{inr(p.price)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Edit ${open.name}`}>
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="sheet relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-mist shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-mist/95 px-5 py-3 backdrop-blur">
              <p className="min-w-0"><span className="label text-amber">#{open.code}</span> <span className="ml-2 truncate font-medium">{open.name}</span></p>
              <button type="button" onClick={() => setOpen(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white" aria-label="Close">✕</button>
            </div>
            <div className="grid gap-6 p-5 sm:grid-cols-[170px_1fr]">
              <div className="grid content-start gap-2">
                {open.media.slice(0, 5).map((m, i) => (
                  <Thumb key={i} p={{ ...open, media: [m] }} />
                ))}
              </div>
              <PieceEditor key={open.code} product={open}
                onSaved={(np) => setProducts((xs) => xs.map((x) => (x.code === np.code ? { ...x, ...np } : x)))} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
