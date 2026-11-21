"use client";
import { useState, useTransition } from "react";
import { quickSave, type QuickFields } from "@/app/admin/actions";
import { categories, colourFamilies, occasions } from "@/config/site";
import { inr, mediaSrc } from "@/lib/format";
import { productHref } from "@/lib/seo";
import type { Product, ProductStatus } from "@/lib/types";

const chip = (on: boolean) =>
  `inline-flex min-h-9 items-center rounded-full border px-3.5 text-[0.8125rem] font-medium transition ${
    on ? "border-peacock bg-peacock text-white" : "border-line bg-white text-ink hover:border-peacock"}`;

/** Edit a piece in place. Used on fresh AI drafts and on existing pieces alike. */
export function PieceEditor({ product, onSaved, compact = false }: {
  product: Product; onSaved?: (p: Product) => void; compact?: boolean;
}) {
  const [f, setF] = useState<QuickFields>({
    name: product.name, price: product.price, stock: product.stock, category: product.category, colour: product.colour,
    colourHex: product.colourHex, colourFamily: product.colourFamily, weave: product.weave, occasion: product.occasion,
    description: product.description, featured: product.featured, silkMark: product.silkMark, status: product.status,
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [more, setMore] = useState(!compact);
  const [pending, start] = useTransition();
  const set = <K extends keyof QuickFields>(k: K, v: QuickFields[K]) => { setF((x) => ({ ...x, [k]: v })); setMsg(null); };

  function save(next: ProductStatus) {
    start(async () => {
      const r = await quickSave(product.code, { ...f, status: next });
      if ("error" in r) { setMsg({ ok: false, text: r.error }); return; }
      setStatus(r.status);
      setMsg({ ok: true, text: r.status === "live" ? "Live on the store" : r.status === "draft" ? "Saved as a draft" : "Saved" });
      onSaved?.({ ...product, ...f, status: r.status, category: f.category as Product["category"] });
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_110px]">
        <label className="block">
          <span className="field-label">Name</span>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className="field" maxLength={80} />
        </label>
        <label className="block">
          <span className="field-label">Price (₹)</span>
          <input value={f.price || ""} onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric"
            className="field !text-lg font-semibold" aria-describedby={`ph-${product.code}`} />
        </label>
        <label className="block">
          <span className="field-label">Stock</span>
          <span className="flex">
            <button type="button" onClick={() => set("stock", Math.max(0, f.stock - 1))} className="h-12 w-10 rounded-l-lg border border-line bg-white text-lg" aria-label="One less">−</button>
            <input value={f.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} inputMode="numeric"
              className="field !rounded-none !border-x-0 !px-1 text-center" />
            <button type="button" onClick={() => set("stock", f.stock + 1)} className="h-12 w-10 rounded-r-lg border border-line bg-white text-lg" aria-label="One more">+</button>
          </span>
        </label>
      </div>
      <p id={`ph-${product.code}`} className="-mt-2 text-xs text-muted">Shoppers see {inr(f.price || 0)}, all taxes included.</p>

      <div>
        <span className="field-label">Category</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.slug} type="button" onClick={() => set("category", c.slug)} className={chip(f.category === c.slug)}>{c.singular}</button>
          ))}
        </div>
      </div>

      {more ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Colour</span>
              <span className="flex items-center gap-2">
                <input type="color" value={f.colourHex} onChange={(e) => set("colourHex", e.target.value)} className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1" aria-label="Colour swatch" />
                <input value={f.colour} onChange={(e) => set("colour", e.target.value)} className="field" placeholder="e.g. Rani pink" />
              </span>
            </label>
            <label className="block">
              <span className="field-label">Weave or motif</span>
              <input value={f.weave} onChange={(e) => set("weave", e.target.value)} className="field" placeholder="e.g. Zari buti" />
            </label>
          </div>
          <div>
            <span className="field-label">Colour family (for the colour filter)</span>
            <div className="flex flex-wrap gap-2">
              {colourFamilies.map((c) => (
                <button key={c.slug} type="button" onClick={() => set("colourFamily", c.slug)} className={chip(f.colourFamily === c.slug)}>
                  <span className="mr-2 h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Occasions</span>
            <div className="flex flex-wrap gap-2">
              {occasions.map((o) => {
                const on = f.occasion.includes(o.slug);
                return (
                  <button key={o.slug} type="button" aria-pressed={on} className={chip(on)}
                    onClick={() => set("occasion", on ? f.occasion.filter((x) => x !== o.slug) : [...f.occasion, o.slug])}>{o.label}</button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="field-label">Description</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="field" maxLength={1200} />
          </label>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-5 w-5 accent-[#0f4443]" /> Feature on homepage
            </label>
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={f.silkMark} onChange={(e) => set("silkMark", e.target.checked)} className="h-5 w-5 accent-[#0f4443]" /> Silk Mark certified
            </label>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setMore(true)} className="w-fit text-sm font-medium text-peacock underline underline-offset-4">
          Edit colour, occasions and description
        </button>
      )}

      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm font-medium ${msg.ok ? "bg-tint text-peacock" : "bg-rose/10 text-rose"}`}>{msg.text}</p>}

      <div className="flex flex-wrap items-center gap-2.5">
        {status === "live" ? (
          <>
            <button type="button" disabled={pending} onClick={() => save("live")} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
            <button type="button" disabled={pending} onClick={() => save("draft")} className="btn btn-ghost">Hide from store</button>
            <a href={productHref({ code: product.code, name: f.name })} target="_blank" rel="noopener" className="text-sm font-medium text-peacock underline underline-offset-4">View on store ↗</a>
          </>
        ) : (
          <>
            <button type="button" disabled={pending} onClick={() => save("live")} className="btn btn-gold">{pending ? "Publishing…" : "Publish now"}</button>
            <button type="button" disabled={pending} onClick={() => save("draft")} className="btn btn-ghost">Save draft</button>
          </>
        )}
      </div>
    </div>
  );
}

export function Thumb({ p, className = "" }: { p: Product; className?: string }) {
  const m = p.media[0];
  if (!m) return <span className={`block aspect-[3/4] rounded-lg bg-tint ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaSrc(m, 480)} width={m.width} height={m.height} alt="" loading="lazy" className={`block h-auto w-full rounded-lg ${className}`} />;
}
