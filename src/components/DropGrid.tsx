"use client";
import { useState } from "react";
import { categories } from "@/config/site";
import { gridShape } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

// Interleave categories so the featured view shows a bit of everything, not one category at a time.
function mix(items: Product[]) {
  const groups = categories.map((c) => items.filter((p) => p.category === c.slug));
  const out: Product[] = [];
  for (let i = 0; out.length < items.length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

export function DropGrid({ products }: { products: Product[] }) {
  const tabs = [
    { slug: "featured", label: "Featured", items: mix(products.filter((p) => p.featured)) },
    ...categories.map((c) => ({ slug: c.slug as string, label: c.label as string, items: products.filter((p) => p.category === c.slug) })),
  ].filter((t) => t.items.length);
  const [tab, setTab] = useState(tabs[0]?.slug ?? "featured");
  const [all, setAll] = useState(false);
  const active = tabs.find((t) => t.slug === tab) ?? tabs[0];
  if (!active) return <p className="py-10 text-muted">The next drop is being photographed. Check back on Friday.</p>;
  const shown = all ? active.items : active.items.slice(0, 8);

  return (
    <div>
      <div role="tablist" aria-label="Browse the drop" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button key={t.slug} role="tab" aria-selected={t.slug === tab} type="button"
            onClick={() => { setTab(t.slug); setAll(false); }}
            className={`flex min-h-11 shrink-0 items-center gap-2 border px-5 rounded-full text-[0.9375rem] font-semibold transition ${
              t.slug === tab ? "border-peacock bg-peacock text-white" : "border-line bg-white text-ink hover:border-peacock"}`}>
            {t.label}
            <span className={`text-xs font-medium ${t.slug === tab ? "text-white/80" : "text-muted"}`}>{t.items.length}</span>
          </button>
        ))}
      </div>
      <div className={`product-grid mt-8 ${gridShape(shown)}`} role="tabpanel">
        {shown.map((p, i) => <ProductCard key={p.code} p={p} priority={i < 2} />)}
      </div>
      {active.items.length > 8 && (
        <div className="mt-10 text-center">
          <button type="button" className="btn btn-ghost" onClick={() => setAll((v) => !v)} aria-expanded={all}>
            {all ? "Show fewer" : `See all ${active.items.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
