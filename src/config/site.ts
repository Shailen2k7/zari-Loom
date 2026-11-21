// One place for everything that may change: brand name, numbers, offers, delivery rules.
export const site = {
  // Working name. Change it here and it changes everywhere.
  brand: "Zari & Loom",
  tagline: "Banaras, by the piece",
  city: "Varanasi",
  // On Netlify, URL is the site's main address; set NEXT_PUBLIC_SITE_URL once the domain is connected.
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918840225471",
  currentDrop: { number: 7, label: "Drop 07", opens: "Friday, 7 pm" },
  orderPrefix: "ZL",
  // Exact wording shown next to every WhatsApp consent checkbox. Stored with each consent.
  consentText:
    "Yes, send me new drops and offers on WhatsApp (at most 2 messages a week). I can reply STOP any time to unsubscribe.",
} as const;

export const delivery = {
  // Noida, Greater Noida and Greater Noida West pincodes (local delivery area).
  noidaPincodes: [
    "201301", "201302", "201303", "201304", "201305", "201306", "201307",
    "201308", "201309", "201310", "201313", "201316", "201318",
  ],
  freeShippingAbove: 2999,
  shippingFee: 99,
  slots: {
    noida: ["Ships tomorrow, arrives in 3 to 6 days"],
    other: ["Ships tomorrow, arrives in 3 to 6 days"],
  },
} as const;

// Offer codes. amount is rupees off; minSubtotal is the smallest bag it applies to.
export const offers: Record<string, { amount: number; minSubtotal: number; label: string }> = {
  SOCIETY300: { amount: 300, minSubtotal: 3000, label: "Society welcome offer" },
};

export const categories = [
  { slug: "saree", label: "Sarees", singular: "Saree" },
  { slug: "suit_set", label: "Suit sets", singular: "Suit set" },
  { slug: "anarkali", label: "Anarkalis", singular: "Anarkali" },
  { slug: "suit_fabric", label: "Suit fabric", singular: "Suit fabric" },
  { slug: "dupatta", label: "Dupattas", singular: "Dupatta" },
] as const;

export const occasions = [
  { slug: "bride", label: "The Bride", blurb: "Reds, rani pinks and heavy zari" },
  { slug: "mother-of-the-bride", label: "Mother of the Bride", blurb: "Deep jewel tones, quiet grandeur" },
  { slug: "festive", label: "Festive", blurb: "Pooja mornings to Diwali nights" },
  { slug: "gifts", label: "Gifts under ₹5,000", blurb: "Pieces that travel well" },
] as const;

export const priceBands = [
  { slug: "under-3000", label: "Under ₹3,000", min: 0, max: 2999 },
  { slug: "3000-5000", label: "₹3,000 to ₹5,000", min: 3000, max: 5000 },
  { slug: "5000-10000", label: "₹5,000 to ₹10,000", min: 5001, max: 10000 },
  { slug: "above-10000", label: "Above ₹10,000", min: 10001, max: 10000000 },
] as const;

export const colourFamilies = [
  { slug: "red", label: "Red", hex: "#B4231F" },
  { slug: "pink", label: "Pink", hex: "#E6336E" },
  { slug: "yellow", label: "Yellow", hex: "#EBA51F" },
  { slug: "green", label: "Green", hex: "#3C8A3A" },
  { slug: "blue", label: "Blue", hex: "#1F55C8" },
  { slug: "purple", label: "Purple", hex: "#7B1F8C" },
  { slug: "neutral", label: "Ivory and grey", hex: "#E6DCC4" },
  { slug: "black", label: "Black", hex: "#1B1B1B" },
];
