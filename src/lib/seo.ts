// Search engine helpers: clean URLs, structured data (schema.org JSON-LD) and shared copy.
// Google reads JSON-LD to show price, stock and breadcrumbs right in the search results.
import { createElement } from "react";
import { categories, delivery, site } from "@/config/site";
import { mediaSrc } from "./format";
import type { Product } from "./types";

export const absolute = (path: string) => new URL(path, site.url).toString();

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

/** /product/1041-rani-arch-saree : the code keeps it unique, the words help it rank. */
export const productHref = (p: Pick<Product, "code" | "name">) => `/product/${p.code}-${slugify(p.name)}`;
/** The code is always the leading digits of the URL segment. */
export const codeFromParam = (param: string) => decodeURIComponent(param).match(/^\d+/)?.[0] ?? param;

const catLabel = (p: Product) => categories.find((c) => c.slug === p.category)?.singular ?? "Banarasi piece";

/** Title tuned for search: what it is, the colour, and the word people actually type. */
export function productTitle(p: Product) {
  const kind = catLabel(p);
  const name = p.name.toLowerCase().includes(kind.toLowerCase()) ? p.name : `${p.name} ${kind}`;
  return `${name} in ${p.colour} · Banarasi ${kind}`;
}

export function productDescription(p: Product) {
  const base = `${p.colour} Banarasi ${catLabel(p).toLowerCase()} with ${p.weave.toLowerCase()}, woven in Varanasi.`;
  return `${base} ${p.description} Shipping across India. Buy online or on WhatsApp.`.slice(0, 300);
}

export function JsonLd({ data }: { data: unknown }) {
  // Escape "<" so no product text can ever close the script tag.
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") },
  });
}

const org = () => ({
  "@type": "ClothingStore",
  "@id": absolute("/#store"),
  name: site.brand,
  slogan: site.tagline,
  url: site.url,
  logo: absolute("/icon.svg"),
  image: absolute("/og.jpg"),
  telephone: `+${site.whatsappNumber}`,
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Credit Card, Debit Card",
  address: { "@type": "PostalAddress", addressLocality: "Noida", addressRegion: "Uttar Pradesh", addressCountry: "IN" },
  areaServed: [{ "@type": "City", name: "Noida" }, { "@type": "City", name: "Greater Noida" }, { "@type": "Country", name: "India" }],
  sameAs: [`https://wa.me/${site.whatsappNumber}`],
});

export function homeJsonLd(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      org(),
      {
        "@type": "WebSite",
        "@id": absolute("/#website"),
        url: site.url,
        name: site.brand,
        publisher: { "@id": absolute("/#store") },
        inLanguage: "en-IN",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: absolute("/collection?q={search_term_string}") },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: "This week's drop",
        itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absolute(productHref(p)), name: p.name })),
      },
    ],
  };
}

export function productJsonLd(p: Product) {
  const url = absolute(productHref(p));
  const inStock = p.status === "live" && p.stock > 0;
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.name,
        sku: p.code,
        mpn: p.code,
        url,
        description: productDescription(p),
        image: p.media.filter((m) => m.type === "photo").slice(0, 6).map((m) => absolute(mediaSrc(m, 1200))),
        brand: { "@type": "Brand", name: site.brand },
        color: p.colour,
        material: p.silkMark ? "Silk" : undefined,
        pattern: p.weave,
        category: `Apparel & Accessories > Clothing > ${catLabel(p)}`,
        audience: { "@type": "PeopleAudience", suggestedGender: "female" },
        countryOfOrigin: { "@type": "Country", name: "India" },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: p.price,
          priceValidUntil: validUntil,
          itemCondition: "https://schema.org/NewCondition",
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          seller: { "@id": absolute("/#store") },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: p.price >= delivery.freeShippingAbove ? 0 : delivery.shippingFee, currency: "INR" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 6, unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        },
      },
      breadcrumbs([
        ["Home", "/"],
        [categories.find((c) => c.slug === p.category)?.label ?? "Collection", `/collection?category=${p.category}`],
        [p.name, productHref(p)],
      ]),
    ],
  };
}

export function breadcrumbs(trail: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absolute(path) })),
  };
}

/** Landing copy for each category page, written around what shoppers search for. */
export const categorySeo: Record<string, { title: string; h1: string; description: string }> = {
  saree: {
    title: "Banarasi Sarees Online · Zari Buti, Kalga & Bridal Sarees",
    h1: "Banarasi sarees",
    description: "Shop Banarasi sarees woven in Varanasi: zari buti, kalga borders and bridal reds, each shown on a model. Shipping across India.",
  },
  anarkali: {
    title: "Banarasi Anarkali Gowns Online · Peacock Zari Anarkalis",
    h1: "Banarasi Anarkalis",
    description: "Banarasi Anarkali fabric with a woven zari peacock yoke and deep zari hem, sold as unstitched fabric. Shipping across India.",
  },
  suit_set: {
    title: "Banarasi Suit Sets Online · Unstitched Three-Piece Suits",
    h1: "Banarasi suit sets",
    description: "Unstitched Banarasi suit sets: kurta fabric, bottom and zari dupatta matched for you. Shown on a model. Shipping across India.",
  },
  suit_fabric: {
    title: "Banarasi Suit Fabric Online · Unstitched Dress Material",
    h1: "Banarasi suit fabric",
    description: "Unstitched Banarasi suit fabric with woven zari buti and borders. Take it to your own tailor. Delivery across India.",
  },
  dupatta: {
    title: "Banarasi Dupattas Online · Zari Border Dupattas",
    h1: "Banarasi dupattas",
    description: "Feather-light Banarasi dupattas with broad zari borders and hand-knotted tassels. The easiest gift from Varanasi. Delivery across India.",
  },
};
