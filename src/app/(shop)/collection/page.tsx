import type { Metadata } from "next";
import Link from "next/link";
import { Filters, type FilterValues } from "@/components/Filters";
import { ProductCard } from "@/components/ProductCard";
import { categories, occasions, priceBands } from "@/config/site";
import { gridShape } from "@/lib/format";
import { listProducts } from "@/lib/store";
import { absolute, breadcrumbs, categorySeo, JsonLd, productHref } from "@/lib/seo";

export const revalidate = 60;
type SP = { searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ searchParams }: SP): Promise<Metadata> {
  const sp = await searchParams;
  const seo = sp.category ? categorySeo[sp.category] : undefined;
  const occ = occasions.find((o) => o.slug === sp.occasion);
  // Only clean category / occasion pages are indexed; filtered and searched views are not.
  const extra = ["weave", "price", "colour", "silk", "sort", "q"].some((k) => sp[k]);
  const canonical = sp.category ? `/collection?category=${sp.category}` : occ ? `/collection?occasion=${occ.slug}` : "/collection";
  const title = seo?.title ?? (occ ? `${occ.label} · Banarasi Sarees, Anarkalis and Suits` : "Shop Banarasi Sarees, Anarkalis, Suits and Dupattas");
  const description = seo?.description ??
    (occ ? `${occ.blurb}. Banarasi pieces chosen for ${occ.label.toLowerCase()}, each photographed in full. Shipping across India.`
      : "The full collection of Banarasi sarees, Anarkalis, suit sets, suit fabric and dupattas woven in Varanasi. Shipping across India.");
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: extra ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: canonical },
  };
}

export default async function CollectionPage({ searchParams }: SP) {
  const sp = await searchParams;
  const v: FilterValues = {
    category: sp.category ?? "", weave: sp.weave ?? "", price: sp.price ?? "", colour: sp.colour ?? "",
    occasion: sp.occasion ?? "", silk: sp.silk ?? "", sort: sp.sort ?? "", q: (sp.q ?? "").trim().slice(0, 60),
  };
  const all = await listProducts();
  const weaves = [...new Set(all.map((p) => p.weave))].sort();
  const band = priceBands.find((b) => b.slug === v.price);
  const q = v.q.toLowerCase();

  let items = all.filter((p) =>
    (!v.category || p.category === v.category) &&
    (!v.weave || p.weave === v.weave) &&
    (!band || (p.price >= band.min && p.price <= band.max)) &&
    (!v.colour || p.colourFamily === v.colour) &&
    (!v.occasion || p.occasion.includes(v.occasion)) &&
    (v.silk !== "1" || p.silkMark) &&
    (!q || `${p.name} ${p.colour} ${p.weave} ${p.code}`.toLowerCase().includes(q)),
  );
  if (v.sort === "low") items = [...items].sort((a, b) => a.price - b.price);
  else if (v.sort === "high") items = [...items].sort((a, b) => b.price - a.price);
  // Featured first, then the newest pieces, so fresh uploads lead the page.
  else items = [...items].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.code) - Number(a.code));

  const seo = v.category ? categorySeo[v.category] : undefined;
  const title =
    seo?.h1 ??
    categories.find((c) => c.slug === v.category)?.label ??
    occasions.find((o) => o.slug === v.occasion)?.label ?? "The collection";

  return (
    <div className="wrap py-10 md:py-14">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          breadcrumbs([["Home", "/"], [title, v.category ? `/collection?category=${v.category}` : "/collection"]]),
          { "@type": "CollectionPage", name: title, url: absolute(v.category ? `/collection?category=${v.category}` : "/collection"),
            mainEntity: { "@type": "ItemList", itemListElement: items.slice(0, 40).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absolute(productHref(p)), name: p.name })) } },
        ],
      }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-peacock">Home</Link> <span aria-hidden>/</span> <span className="text-ink">{title}</span>
      </nav>
      <h1 className="display mt-3 text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{seo ? `${seo.description.split(". ").slice(0, 2).join(". ").replace(/\.$/, "")}.` : "Every piece shown in full, exactly as it is. Most are one of one, so when it is gone, it is gone."}</p>
      <div className="mt-8"><Filters key={JSON.stringify(v)} values={v} weaves={weaves} count={items.length} /></div>

      {items.length ? (
        <div className={`product-grid mt-10 ${gridShape(items)}`}>{items.map((p, i) => <ProductCard key={p.code} p={p} priority={i < 2} />)}</div>
      ) : (
        <div className="mx-auto mt-16 max-w-md pb-10 text-center">
          <h2 className="display text-3xl">Nothing matches just yet</h2>
          <p className="mt-3 text-muted">
            {v.silk === "1"
              ? "No piece in this drop carries a Silk Mark label. Clear that filter to see everything."
              : "Try removing a filter, or tell our stylist what you are looking for."}
          </p>
          <Link href="/collection" className="btn btn-primary mt-6">Clear all filters</Link>
        </div>
      )}
    </div>
  );
}
