import type { MetadataRoute } from "next";
import { categories, occasions } from "@/config/site";
import { absolute, productHref } from "@/lib/seo";
import { listProducts } from "@/lib/store";
import { mediaSrc } from "@/lib/format";

export const revalidate = 3600;

// Every live piece, with its photos, so Google Images can index them too.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();
  const now = new Date();
  return [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/collection"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: absolute(`/collection?category=${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...["/policies/shipping-returns", "/policies/privacy", "/policies/terms"].map((u) => ({ url: absolute(u), lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...occasions.map((o) => ({ url: absolute(`/collection?occasion=${o.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: absolute(productHref(p)),
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.media.filter((m) => m.type === "photo").slice(0, 5).map((m) => absolute(mediaSrc(m, 1200))),
    })),
  ];
}
