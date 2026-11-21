// The messages a shopper sends us on WhatsApp. Laid out so the order can be read at a glance:
// the product link comes first (WhatsApp turns the first link into a photo preview), then a direct photo link.
import { useEffect, useState } from "react";
import { categories, site } from "@/config/site";
import { inr, mediaSrc } from "./format";
import type { Media, Product } from "./types";
import { productHref } from "./seo";

export type MsgProduct = Pick<Product, "code" | "name" | "category" | "colour" | "weave" | "price"> & { media: Media[] };

const join = (origin: string, path: string) => (/^https?:\/\//.test(path) ? path : `${origin}${path}`);
const kind = (p: MsgProduct) => categories.find((c) => c.slug === p.category)?.singular ?? "Banarasi piece";
const photo = (p: MsgProduct, origin: string) => (p.media[0] ? join(origin, mediaSrc(p.media[0], 1200)) : "");

/** The site's address as the shopper sees it. Empty until the page has loaded, then the real address. */
export function useOrigin() {
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_SITE_URL || "");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

export function productMessage(p: MsgProduct, origin: string) {
  const pic = photo(p, origin);
  return [
    `Hello ${site.brand},`,
    "",
    "I would like to buy this piece:",
    "",
    `*${p.name}*`,
    `Code: ${p.code}`,
    `Type: ${kind(p)} · ${p.weave}`,
    `Colour: ${p.colour}`,
    `Price: ${inr(p.price)} (incl. all taxes)`,
    "",
    `View: ${join(origin, productHref(p))}`,
    ...(pic ? [`Photo: ${pic}`] : []),
    "",
    "Could you please confirm it is available and share the next steps?",
  ].join("\n");
}

export interface OrderDetails {
  items: { p: MsgProduct; qty: number; amount: number }[];
  subtotal: number;
  discount: number;
  offer: string;
  shipping: number;
  total: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  delivery: string;
}

export function orderMessage(o: OrderDetails, origin: string) {
  const items = o.items.flatMap(({ p, qty, amount }, i) => {
    const pic = photo(p, origin);
    return [
      `*${i + 1}. ${p.name}*`,
      `Code ${p.code} · ${kind(p)} · ${p.colour}`,
      `Qty ${qty} · ${inr(amount)}`,
      `View: ${join(origin, productHref(p))}`,
      ...(pic ? [`Photo: ${pic}`] : []),
      "",
    ];
  });
  return [
    `Hello ${site.brand},`,
    "",
    "I would like to place an order.",
    "",
    ...items,
    "*Order summary*",
    `Subtotal: ${inr(o.subtotal)}`,
    ...(o.discount > 0 ? [`Offer ${o.offer}: −${inr(o.discount)}`] : []),
    `Delivery: ${o.shipping > 0 ? inr(o.shipping) : "Free"}`,
    `*Total: ${inr(o.total)}* (incl. all taxes)`,
    "",
    "*Deliver to*",
    o.name,
    `Phone: ${o.phone}`,
    ...(o.email ? [`Email: ${o.email}`] : []),
    `Address: ${o.address}`,
    ...(o.delivery ? [`Delivery: ${o.delivery}`] : []),
    "",
    "Please confirm the pieces are available and share the payment link (UPI or card). Thank you!",
  ].join("\n");
}
