import { site } from "@/config/site";
import type { Media } from "./types";

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function waLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mediaSrc(m: Media, want = 800) {
  if (!m.widths.length) return m.url;
  const w = m.widths.find((x) => x >= want) ?? m.widths[m.widths.length - 1];
  return `${m.url}-${w}.webp`;
}

export function mediaSrcSet(m: Media) {
  if (!m.widths.length) return undefined;
  return m.widths.map((w) => `${m.url}-${w}.webp ${w}w`).join(", ");
}

export function stockLabel(stock: number) {
  if (stock <= 0) return "Sold out";
  if (stock === 1) return "1 of 1";
  if (stock <= 3) return `Only ${stock} left`;
  return "In stock";
}

export const digits = (s: string) => s.replace(/\D/g, "");

/** Indian mobile number -> 91XXXXXXXXXX, or null if it does not look valid */
export function normalisePhone(s: string): string | null {
  let d = digits(s);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? "91" + d : null;
}

/** "wide" when most (70%+) of the main photos are landscape, so the grid can use a wider picture area. */
export function gridShape(items: { media: Media[] }[]) {
  if (!items.length) return "";
  const wide = items.filter((p) => p.media[0] && p.media[0].width > p.media[0].height).length;
  return wide / items.length >= 0.7 ? "wide" : "";
}

/** The photo to show on a product card: the whole cover picture if there is one, else the first photo. */
/** The photo used on cards: always the single main photo (never a collage). */
export const cardMedia = (p: { cover?: Media; media: Media[] }) => p.media[0];
