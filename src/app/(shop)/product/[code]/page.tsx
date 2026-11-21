import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { WishButton } from "@/components/WishButton";
import { categories, delivery, site } from "@/config/site";
import { inr, mediaSrc, stockLabel } from "@/lib/format";
import { getProduct, listProducts, listWeavers } from "@/lib/store";
import { codeFromParam, shareImage, JsonLd, productDescription, productHref, productJsonLd, productTitle } from "@/lib/seo";

export const revalidate = 60;
type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(codeFromParam((await params).code));
  if (!p) return { title: "Not found", robots: { index: false } };
  const title = productTitle(p);
  const description = productDescription(p).slice(0, 158);
  const image = p.media[0] ? [{ url: shareImage(mediaSrc(p.media[0], 1200)), width: Math.min(1200, p.media[0].width), alt: `${p.name} in ${p.colour}` }] : [];
  return {
    title,
    description,
    alternates: { canonical: productHref(p) },
    robots: p.status === "draft" ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", title, description, url: productHref(p), images: image },
    twitter: { card: "summary_large_image", title, description, images: image.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { code: param } = await params;
  const p = await getProduct(codeFromParam(param));
  if (!p || p.status === "draft") notFound();
  // One canonical URL per piece: /product/1041-rani-arch-saree
  if (decodeURIComponent(param) !== productHref(p).slice("/product/".length)) permanentRedirect(productHref(p));
  const [all, weavers] = await Promise.all([listProducts(), listWeavers()]);
  const weaver = weavers.find((w) => w.id === p.weaverId);
  const cat = categories.find((c) => c.slug === p.category);
  const pairs = [
    ...all.filter((x) => x.code !== p.code && x.category !== p.category && x.colourFamily === p.colourFamily),
    ...all.filter((x) => x.code !== p.code && x.category === p.category),
  ].slice(0, 4);

  const care = p.silkMark
    ? "Silk Mark certified pure silk. Dry clean only. Store folded in soft cotton, and refold every few months."
    : "Dry clean recommended for the first wash. Store folded in soft cotton, away from damp. Keep perfume and deodorant away from the zari.";

  return (
    <div className="wrap py-8 md:py-12">
      <JsonLd data={productJsonLd(p)} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-peacock">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/collection?category=${p.category}`} className="hover:text-peacock">{cat?.label}</Link> <span aria-hidden>/</span>{" "}
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <Gallery media={p.media} name={p.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="label text-amber">{cat?.singular} · Code {p.code} · {site.currentDrop.label}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="display text-[2.75rem] sm:text-6xl">{p.name}</h1>
            <WishButton code={p.code} name={p.name} className="mt-1 shrink-0 border border-line" />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {[p.weave, p.colour, ...(p.silkMark ? ["Silk Mark certified"] : [])].map((t) => (
              <li key={t} className="rounded-full border border-line bg-white px-3 py-1.5">{t}</li>
            ))}
            <li className={`rounded-full px-3 py-1.5 font-semibold ${p.stock > 0 ? "bg-deep text-cream" : "bg-rose text-white"}`}>{stockLabel(p.stock)}</li>
          </ul>
          {weaver && (
            <p className="mt-4 text-sm text-muted">
              Woven in <span className="font-medium text-ink">{weaver.village}</span>{!weaver.placeholder && <> by <span className="font-medium text-ink">{weaver.name}</span></>}
            </p>
          )}
          <p className="mt-5 leading-relaxed text-muted">{p.description}</p>
          <div className="my-7 h-px bg-line" />
          <ProductBuy p={{ code: p.code, name: p.name, price: p.price, stock: p.stock, category: p.category, colour: p.colour, weave: p.weave, media: p.media.slice(0, 1) }} />

          <div className="mt-8 divide-y divide-line border-y border-line">
            {[
              ["Fabric and care", care],
              ["The weave", `${p.weave} is one of the classic Banarasi patterns. The motifs are woven into the cloth with zari thread on the loom, not printed or stuck on, so they stay for the life of the piece.`],
              ["Shipping and returns", `Delivered across India in 3 to 6 days, with free shipping above ${inr(delivery.freeShippingAbove)}. Easy returns within 7 days of delivery; we arrange the pickup.`],
            ].map(([t, d]) => (
              <details key={t} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {t} <span aria-hidden className="text-xl font-normal text-peacock transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted">{d}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {weaver && (
        <section className="mt-16 rounded-xl bg-tint p-6 sm:p-10 md:mt-24">
          <p className="label text-amber">Meet the weaver</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">{weaver.placeholder ? weaver.village : weaver.name}</h2>
          {!weaver.placeholder && <p className="mt-1 text-muted">{weaver.village}</p>}
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">{weaver.story}</p>
        </section>
      )}

      {pairs.length > 0 && (
        <section className="mt-16 md:mt-24">
          <h2 className="display text-4xl sm:text-5xl">Pairs <em className="font-normal text-peacock">beautifully</em> with</h2>
          <div className="product-grid mt-8">{pairs.map((x) => <ProductCard key={x.code} p={x} />)}</div>
        </section>
      )}
    </div>
  );
}
