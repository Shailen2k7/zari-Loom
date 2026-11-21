// Seed catalogue for the 37 real product photos.
// Names, prices and weaver details are PLACEHOLDERS until the owner confirms them.
// silkMark is false everywhere, so no copy may say "pure silk", "handloom" or "Silk Mark".
import mediaManifest from "./media.json";
import type { Category, Media, Product, Weaver } from "@/lib/types";

type Panel = { key: string; width: number; height: number; widths: number[] };
const manifest = mediaManifest as Record<string, Panel[]>;

export function mediaFor(photoId: string): Media[] {
  return (manifest[photoId] ?? []).map((p) => ({
    url: `/products/${p.key}`,
    type: "photo" as const,
    width: p.width,
    height: p.height,
    widths: p.widths,
  }));
}

export const weavers: Weaver[] = [
  {
    id: "w1",
    name: "Weaver name to be confirmed",
    village: "Madanpura, Varanasi",
    story:
      "Every piece in the drop is checked by hand before it leaves Banaras. The weaver's name and loom story for this piece will be added once the owner confirms it.",
    placeholder: true,
  },
  {
    id: "w2",
    name: "Weaver name to be confirmed",
    village: "Lallapura, Varanasi",
    story:
      "Woven in the lanes of Lallapura, where zari buti work has passed from parent to child for generations. Details for this piece will be added once confirmed.",
    placeholder: true,
  },
  {
    id: "w3",
    name: "Weaver name to be confirmed",
    village: "Ramnagar, Varanasi",
    story:
      "From a family workshop across the river in Ramnagar. Details for this piece will be added once the owner confirms them.",
    placeholder: true,
  },
];

type Row = [
  photo: string, name: string, category: Category, weave: string, colour: string, hex: string,
  family: string, occasion: string[], price: number, stock: number, featured: boolean, description: string,
];

const suitSetCopy = (c: string) =>
  `An unstitched three-piece suit in ${c}: kurta fabric scattered with zari buti, matching bottom fabric, and a dupatta with floral jaal and a wide zari border. Shown made up on a model so you can see how it falls.`;
const fabricCopy = (c: string) =>
  `Unstitched Banarasi suit fabric in ${c}. Top with woven zari buti and a floral neck panel, plain bottom and a zari border to finish. Take it to your own tailor for a perfect fit.`;
const mannequinCopy = (c: string, d: string) =>
  `Unstitched three-piece suit in ${c}: top fabric with woven buti, plain bottom fabric and ${d}. Shown draped on a form so you can see the fall.`;
const sareeCopy = (c: string, p: string) =>
  `A lightweight Banarasi saree in ${c} with all-over zari buti, a woven border and ${p}. Photographed flat in daylight so the colour you see is the colour you get.`;
const dupattaCopy = (c: string) =>
  `A sheer, feather-light dupatta in ${c} with a fine check texture, a broad zari floral border, zari stripes at the ends and hand-knotted tassels.`;

const modelSaree = (c: string, p: string) =>
  `A Banarasi saree in ${c} with woven zari buti across the body and ${p}. Shown on a model so you can see the drape and fall before you order.`;
const anarkaliCopy = (c: string) =>
  `Banarasi Anarkali fabric in ${c} with a woven zari peacock for the yoke, buti for the flare and a deep zari hem. Sold as unstitched fabric, shown made up on a model.`;
const palaceSet = (c: string) =>
  `An unstitched ${c} Banarasi suit: kurta fabric with woven zari jaal, matching bottom fabric, and a silver zari dupatta with a wide border. Shown made up on a model.`;

const rows: Row[] = [
  // Model suit sets
  ["p01", "Gulnar Suit Set", "suit_set", "Zari buti", "Peach", "#F0907A", "pink", ["festive"], 4800, 2, true, suitSetCopy("soft peach")],
  ["p02", "Aasmani Suit Set", "suit_set", "Zari buti", "Sky blue", "#6FB1E4", "blue", ["festive", "gifts"], 4800, 2, true, suitSetCopy("sky blue")],
  ["p03", "Moonga Suit Set", "suit_set", "Zari buti", "Coral", "#EC5F6B", "pink", ["festive"], 4800, 1, false, suitSetCopy("coral")],
  ["p04", "Chandni Suit Set", "suit_set", "Zari buti", "Ivory gold", "#EBDDB0", "neutral", ["mother-of-the-bride", "festive"], 5200, 1, true, suitSetCopy("ivory and gold")],
  ["p05", "Raat Suit Set", "suit_set", "Zari buti", "Black", "#1B1B1B", "black", ["festive"], 5200, 1, true, suitSetCopy("black with gold zari")],
  ["p06", "Neelam Suit Set", "suit_set", "Zari buti", "Royal blue", "#1634C4", "blue", ["festive", "mother-of-the-bride"], 4800, 2, false, suitSetCopy("royal blue")],
  ["p07", "Rani Suit Set", "suit_set", "Zari buti", "Rani pink", "#E6336E", "pink", ["bride", "festive"], 4800, 1, true, suitSetCopy("rani pink")],
  ["p08", "Mehendi Suit Set", "suit_set", "Zari buti", "Sage green", "#9DB368", "green", ["festive", "gifts"], 4800, 2, false, suitSetCopy("sage green")],
  ["p09", "Haldi Suit Set", "suit_set", "Zari buti", "Mustard", "#E2A21C", "yellow", ["festive", "gifts"], 4800, 1, true, suitSetCopy("mustard")],
  // Flat-lay suit fabric
  ["p10", "Sindoor Suit Fabric", "suit_fabric", "Zari buti", "Sindoor red", "#B4231F", "red", ["bride", "festive"], 3400, 3, true, fabricCopy("sindoor red with silver zari")],
  ["p11", "Jamun Suit Fabric", "suit_fabric", "Zari buti", "Wine", "#4A1D2A", "purple", ["mother-of-the-bride", "gifts"], 3400, 2, false, fabricCopy("deep wine with silver zari")],
  ["p12", "Gulabi Suit Fabric", "suit_fabric", "Zari buti", "Rani pink", "#E0126E", "pink", ["bride", "festive", "gifts"], 3400, 2, false, fabricCopy("rani pink with silver zari")],
  ["p13", "Genda Suit Fabric", "suit_fabric", "Zari buti", "Marigold", "#F5A014", "yellow", ["festive", "gifts"], 3400, 3, true, fabricCopy("marigold with silver zari")],
  ["p14", "Neel Suit Fabric", "suit_fabric", "Zari buti", "Midnight navy", "#17274F", "blue", ["mother-of-the-bride", "gifts"], 3400, 2, false, fabricCopy("midnight navy with silver zari")],
  // Sarees
  ["p15", "Tota Buti Saree", "saree", "Zari buti", "Leaf green", "#2F8F1F", "green", ["festive"], 7800, 1, false, sareeCopy("leaf green", "a floral jaal pallu")],
  ["p16", "Baingani Buti Saree", "saree", "Zari buti", "Royal purple", "#6A1B5E", "purple", ["mother-of-the-bride", "festive"], 8900, 1, true, sareeCopy("royal purple", "a striped pallu with embroidered flowers")],
  ["p17", "Chandan Stripe Saree", "saree", "Leheriya stripe", "Ivory", "#EFE2C2", "neutral", ["mother-of-the-bride", "festive"], 9800, 1, true, sareeCopy("ivory", "a pink and yellow leheriya stripe pallu")],
  ["p18", "Angoori Jaal Saree", "saree", "Floral jaal", "Parrot green", "#A9B93A", "green", ["festive"], 8400, 1, true, sareeCopy("parrot green", "a diagonal stripe pallu with embroidered flowers")],
  ["p19", "Rani Buti Saree", "saree", "Zari buti", "Rani pink", "#E01566", "pink", ["bride", "festive"], 9200, 1, true, sareeCopy("rani pink", "a checked pallu with floral embroidery")],
  ["p20", "Kabootar Stripe Saree", "saree", "Leheriya stripe", "Dove grey", "#A39AA6", "neutral", ["mother-of-the-bride"], 8900, 1, true, sareeCopy("dove grey", "a teal leheriya stripe pallu")],
  ["p21", "Firozi Buti Saree", "saree", "Zari buti", "Peacock blue", "#1F86C4", "blue", ["festive"], 7800, 1, false, sareeCopy("peacock blue", "a green and blue stripe pallu")],
  ["p22", "Gulab Check Saree", "saree", "Zari check", "Blush pink", "#F2A3A8", "pink", ["bride", "festive"], 8400, 1, false, sareeCopy("blush pink", "a bright checked pallu")],
  ["p23", "Panna Buti Saree", "saree", "Zari buti", "Bottle green", "#17502F", "green", ["bride", "mother-of-the-bride", "festive"], 9800, 1, true, sareeCopy("bottle green", "a zari stripe pallu with embroidered flowers")],
  ["p24", "Basanti Check Saree", "saree", "Zari check", "Lemon yellow", "#F6D84B", "yellow", ["festive"], 7800, 1, false, sareeCopy("lemon yellow", "an orange and green checked pallu")],
  // Draped unstitched suits
  ["p25", "Jamuni Jaal Suit", "suit_fabric", "Jangla jaal", "Purple", "#7B1F8C", "purple", ["festive", "mother-of-the-bride"], 4600, 1, true, mannequinCopy("purple", "a diamond jaal dupatta with a heavy zari border")],
  ["p26", "Kathai Phool Suit", "suit_fabric", "Floral jaal", "Maroon", "#8E2331", "red", ["mother-of-the-bride", "festive"], 4600, 1, false, mannequinCopy("maroon", "a floral jaal dupatta")],
  ["p27", "Narangi Bel Suit", "suit_fabric", "Floral jaal", "Orange", "#EE7A14", "yellow", ["festive", "gifts"], 4200, 1, true, mannequinCopy("orange", "a sheer bel-work dupatta finished with tassels")],
  ["p28", "Surkh Jaal Suit", "suit_fabric", "Jangla jaal", "Red", "#CC1F2C", "red", ["bride", "festive"], 4600, 1, true, mannequinCopy("bridal red", "a diamond jaal dupatta")],
  ["p29", "Jamuni Phool Suit", "suit_fabric", "Floral jaal", "Purple", "#8A1F8E", "purple", ["festive"], 4600, 1, false, mannequinCopy("purple", "a floral jaal dupatta with a pink selvedge")],
  ["p30", "Kathai Jaal Suit", "suit_fabric", "Jangla jaal", "Maroon", "#932B33", "red", ["mother-of-the-bride", "gifts"], 4600, 1, false, mannequinCopy("maroon", "a diamond jaal dupatta")],
  ["p31", "Neelam Jaal Suit", "suit_fabric", "Jangla jaal", "Royal blue", "#1F55C8", "blue", ["festive", "gifts"], 4600, 1, false, mannequinCopy("royal blue", "a diamond jaal dupatta with a purple selvedge")],
  ["p32", "Neelam Phool Suit", "suit_fabric", "Floral jaal", "Royal blue", "#1B4FCB", "blue", ["festive"], 4600, 1, true, mannequinCopy("royal blue", "a floral jaal dupatta")],
  ["p33", "Kathai Chakra Suit", "suit_fabric", "Zari buti", "Maroon", "#8B2424", "red", ["mother-of-the-bride", "festive"], 4900, 1, false, mannequinCopy("maroon", "a dupatta edged with large zari chakra motifs")],
  // Dupattas
  ["p34", "Pudina Dupatta", "dupatta", "Zari border", "Mint", "#A9CDB2", "green", ["gifts", "festive"], 1450, 4, true, dupattaCopy("mint green")],
  ["p35", "Nimbu Dupatta", "dupatta", "Zari border", "Lemon", "#D6CF5A", "yellow", ["gifts", "festive"], 1450, 4, false, dupattaCopy("lemon")],
  ["p36", "Gulab Dupatta", "dupatta", "Zari border", "Rose", "#D69AAE", "pink", ["gifts", "festive"], 1450, 3, true, dupattaCopy("rose pink")],
  ["p37", "Lavender Dupatta", "dupatta", "Zari border", "Lilac", "#B3A2D2", "purple", ["gifts", "festive"], 1450, 4, false, dupattaCopy("lilac")],
  // ---- On-model photography (Drop 07 additions) ----
  // Sarees shot at the sandstone arch
  ["n01", "Chandni Arch Saree", "saree", "Zari buti", "Ivory", "#F1ECE0", "neutral", ["mother-of-the-bride", "festive"], 6900, 1, true, modelSaree("ivory", "a paisley zari pallu")],
  ["n02", "Sindoori Arch Saree", "saree", "Zari buti", "Red", "#C21A22", "red", ["bride", "festive"], 6900, 1, true, modelSaree("bridal red", "a paisley zari pallu")],
  ["n03", "Kajal Arch Saree", "saree", "Zari buti", "Black", "#1A1A1A", "black", ["festive"], 6900, 1, true, modelSaree("black", "a paisley zari pallu")],
  ["n04", "Rani Arch Saree", "saree", "Zari buti", "Rani pink", "#E0156E", "pink", ["bride", "festive"], 6900, 1, true, modelSaree("rani pink", "a paisley zari pallu")],
  ["n05", "Pista Arch Saree", "saree", "Zari buti", "Mint", "#BFDDC0", "green", ["festive", "gifts"], 6900, 1, false, modelSaree("mint", "a paisley zari pallu")],
  ["n06", "Gulabi Arch Saree", "saree", "Zari buti", "Baby pink", "#F4BFD0", "pink", ["festive", "gifts"], 6900, 1, false, modelSaree("baby pink", "a paisley zari pallu")],
  ["n07", "Haldi Arch Saree", "saree", "Zari buti", "Mustard", "#E9AE16", "yellow", ["festive"], 6900, 1, true, modelSaree("mustard", "a paisley zari pallu")],
  ["n08", "Mor Arch Saree", "saree", "Zari buti", "Teal", "#0E6F86", "blue", ["festive", "mother-of-the-bride"], 6900, 1, true, modelSaree("teal", "a paisley zari pallu")],
  ["n09", "Kesari Arch Saree", "saree", "Zari buti", "Orange", "#F0701A", "yellow", ["festive"], 6900, 1, false, modelSaree("orange", "a paisley zari pallu")],
  // Sarees shot at the carved door
  ["n10", "Neelam Dwaar Saree", "saree", "Zari buti", "Royal blue", "#1D36B0", "blue", ["festive", "mother-of-the-bride"], 7400, 1, true, modelSaree("royal blue", "a broad zari border")],
  ["n11", "Raat Dwaar Saree", "saree", "Zari buti", "Black", "#161616", "black", ["festive"], 7400, 1, false, modelSaree("black", "a broad zari border")],
  ["n12", "Moti Dwaar Saree", "saree", "Zari buti", "Ivory", "#EFE9DA", "neutral", ["mother-of-the-bride"], 7400, 1, true, modelSaree("ivory", "a broad zari border")],
  ["n13", "Sona Dwaar Saree", "saree", "Zari buti", "Yellow", "#E6B320", "yellow", ["festive", "gifts"], 7400, 1, false, modelSaree("yellow", "a broad zari border")],
  ["n14", "Magenta Dwaar Saree", "saree", "Zari buti", "Magenta", "#C8156B", "pink", ["bride", "festive"], 7400, 1, true, modelSaree("magenta", "a broad zari border")],
  ["n15", "Panna Dwaar Saree", "saree", "Zari buti", "Bottle green", "#2E5A1E", "green", ["festive", "mother-of-the-bride"], 7400, 1, true, modelSaree("bottle green", "a broad zari border")],
  ["n16", "Kathai Dwaar Saree", "saree", "Zari buti", "Maroon", "#6E1420", "red", ["mother-of-the-bride", "festive"], 7400, 1, false, modelSaree("maroon", "a broad zari border")],
  ["n17", "Dhuan Dwaar Saree", "saree", "Zari buti", "Grey", "#8E8C8A", "neutral", ["festive"], 7400, 1, false, modelSaree("smoke grey", "a broad zari border")],
  ["n18", "Jamuni Dwaar Saree", "saree", "Zari buti", "Purple", "#5E1A7A", "purple", ["festive", "mother-of-the-bride"], 7400, 1, true, modelSaree("purple", "a broad zari border")],
  ["n19", "Malai Dwaar Saree", "saree", "Zari buti", "Cream", "#EEE6D0", "neutral", ["mother-of-the-bride", "gifts"], 7400, 1, false, modelSaree("cream", "a broad zari border")],
  ["n20", "Laal Dwaar Saree", "saree", "Zari buti", "Red", "#C01A1F", "red", ["bride", "festive"], 7400, 1, true, modelSaree("red", "a broad zari border")],
  // Sarees with close-up panels
  ["n32", "Kathai Kalga Saree", "saree", "Zari kalga", "Maroon", "#701824", "red", ["bride", "mother-of-the-bride"], 8600, 1, true, modelSaree("maroon", "a kalga motif border and pallu")],
  ["n33", "Rani Kalga Saree", "saree", "Zari kalga", "Rani pink", "#D41566", "pink", ["bride", "festive"], 8600, 1, true, modelSaree("rani pink", "a kalga motif border and pallu")],
  ["n34", "Shyam Kalga Saree", "saree", "Zari kalga", "Black", "#171717", "black", ["festive"], 8600, 1, false, modelSaree("black", "a kalga motif border and pallu")],
  ["n35", "Sarson Kalga Saree", "saree", "Zari kalga", "Mustard", "#DDA21A", "yellow", ["festive", "gifts"], 8600, 1, false, modelSaree("mustard", "a kalga motif border and pallu")],
  ["n36", "Gulnar Kalga Saree", "saree", "Zari kalga", "Pink", "#E2336F", "pink", ["festive"], 8600, 1, false, modelSaree("pink", "a kalga motif border and pallu")],
  ["n37", "Surkh Kalga Saree", "saree", "Zari kalga", "Red", "#C21B26", "red", ["bride", "festive"], 8600, 1, true, modelSaree("red", "a kalga motif border and pallu")],
  // Anarkali gowns
  ["n23", "Mor Anarkali, Hot Pink", "anarkali", "Peacock zari", "Hot pink", "#E0157A", "pink", ["festive", "bride"], 6400, 1, true, anarkaliCopy("hot pink")],
  ["n24", "Mor Anarkali, Black", "anarkali", "Peacock zari", "Black", "#151515", "black", ["festive"], 6400, 1, true, anarkaliCopy("black")],
  ["n25", "Mor Anarkali, Midnight", "anarkali", "Peacock zari", "Black", "#1B1B1B", "black", ["festive"], 6400, 1, false, anarkaliCopy("midnight black")],
  ["n26", "Mor Anarkali, Purple", "anarkali", "Peacock zari", "Purple", "#5A1A9A", "purple", ["festive"], 6400, 1, true, anarkaliCopy("purple")],
  ["n27", "Mor Anarkali, Royal Blue", "anarkali", "Peacock zari", "Royal blue", "#1C3FB4", "blue", ["festive", "mother-of-the-bride"], 6400, 1, true, anarkaliCopy("royal blue")],
  ["n28", "Mor Anarkali, Deep Maroon", "anarkali", "Peacock zari", "Deep maroon", "#7A1124", "red", ["festive", "mother-of-the-bride"], 6400, 1, false, anarkaliCopy("deep maroon")],
  ["n29", "Mor Anarkali, Teal", "anarkali", "Peacock zari", "Teal", "#0F7C8C", "blue", ["festive"], 6400, 1, true, anarkaliCopy("teal")],
  ["n30", "Mor Anarkali, Magenta", "anarkali", "Peacock zari", "Magenta", "#C2126A", "pink", ["festive", "bride"], 6400, 1, false, anarkaliCopy("magenta")],
  // Co-ord and suit sets on model
  ["n22", "Kaali Bel Co-ord Set", "suit_set", "Zari bel", "Black", "#161616", "black", ["festive", "gifts"], 4400, 2, true, "Unstitched black Banarasi co-ord fabric with a gold zari bel for the front and sleeves, plus matching bottom fabric. Shown made up on a model."],
  ["n38", "Mahal Suit Set, Black", "suit_set", "Zari jaal", "Black", "#151515", "black", ["festive", "mother-of-the-bride"], 5600, 1, true, palaceSet("black")],
  ["n39", "Mahal Suit Set, Navy", "suit_set", "Zari jaal", "Navy", "#1B2A5C", "blue", ["festive", "mother-of-the-bride"], 5600, 1, true, palaceSet("navy")],
  ["n40", "Mahal Suit Set, Maroon", "suit_set", "Zari jaal", "Maroon", "#6B1528", "red", ["festive", "mother-of-the-bride"], 5600, 1, false, palaceSet("maroon")],
  ["n42", "Mahal Suit Set, Rani", "suit_set", "Zari jaal", "Rani pink", "#D61E6E", "pink", ["festive", "bride"], 5600, 1, true, palaceSet("rani pink")],
  ["n43", "Mahal Suit Set, Emerald", "suit_set", "Zari jaal", "Bottle green", "#1C6A4A", "green", ["festive"], 5600, 1, false, palaceSet("bottle green")],
  ["n44", "Mahal Suit Set, Mustard", "suit_set", "Zari jaal", "Mustard", "#C9951C", "yellow", ["festive", "gifts"], 5600, 1, false, palaceSet("mustard")],
  ["n45", "Mahal Suit Set, Purple", "suit_set", "Zari jaal", "Purple", "#5B1F6E", "purple", ["festive"], 5600, 1, true, palaceSet("purple")],
];

/** Photos that show the piece worn by a model (used for the homepage and hero). */
const ON_MODEL = /^(p0[1-9]|n(?!24)\d\d)$/; // n24 has fabric swatches beside the model

export const seedProducts: Product[] = rows.map((r, i) => ({
  code: String(1001 + i),
  name: r[1],
  category: r[2],
  weave: r[3],
  colour: r[4],
  colourHex: r[5],
  colourFamily: r[6],
  occasion: r[7],
  price: r[8],
  stock: r[9],
  featured: r[10],
  description: r[11],
  silkMark: false,
  weaverId: weavers[i % weavers.length].id,
  status: "live",
  drop: 7,
  media: mediaFor(r[0]),
  onModel: ON_MODEL.test(r[0]),
  cover: mediaFor(`${r[0]}~cover`)[0],
}));

export { colourFamilies } from "@/config/site";
