// Shared listing rules for the dashboard (used by quick-add and by saving).
import type { Media, Product } from "./types";

/** Fibre and craft claims allowed only on pieces the owner has marked as Silk Mark certified. */
export const BANNED = /pure\s+silk|handloom|hand\s*woven|silk\s*mark/i;

/** Services the store does not offer, ever: it sells unstitched fabric only. */
export const NOT_OFFERED = /ready[\s-]*to[\s-]*wear|ready[\s-]*made|stitching|tailoring|home\s*trial/i;

const FALLBACK_PRICE: Record<string, number> = { saree: 6900, anarkali: 6400, suit_set: 4800, suit_fabric: 3400, dupatta: 1450 };

/** Starting price for a new piece: the middle price of what is already in that category. */
export function defaultPrice(all: Product[], category: string) {
  const prices = all.filter((p) => p.category === category).map((p) => p.price).sort((a, b) => a - b);
  return prices.length ? prices[Math.floor(prices.length / 2)] : FALLBACK_PRICE[category] ?? 4900;
}

/** Used when AI is off or could not read the photo. The owner fills in the blanks. */
export function fallbackDraft(m: Media) {
  const tall = m.height > m.width * 1.2;
  return {
    name: tall ? "New saree" : "New piece",
    category: tall ? "saree" : "suit_fabric",
    colour: "",
    colourHex: "#888888",
    colourFamily: "neutral",
    weave: "Zari buti",
    occasion: ["festive"],
    description: "A Banarasi piece from this week's drop, photographed in full. Details to follow.",
    onModel: tall,
  };
}
