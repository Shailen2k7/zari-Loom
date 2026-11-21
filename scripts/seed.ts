// Load the catalogue into Supabase: weavers, the current drop, every piece and its photos.
// If the local store (.data/store.json) exists, it is copied as it is now, owner edits and dashboard uploads included;
// photos uploaded on this computer (.data/uploads) go to the "products" storage bucket. Otherwise the starting catalogue is used.
// Safe to run more than once: pieces that already exist in Supabase are left untouched, so edits there are never overwritten.
//   npm run seed
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { site } from "../src/config/site";
import { seedProducts, weavers } from "../src/data/catalog";
import type { Media, Product } from "../src/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
// Realtime is never used; the stand-in keeps the client from needing a WebSocket on Node 20.
class NoRealtime { constructor() { throw new Error("Realtime is not used."); } }
const sb = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: NoRealtime as never } });
const must = <T,>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

const LOCAL = path.join(process.cwd(), ".data", "store.json");
const UPLOADS = path.join(process.cwd(), ".data", "uploads");
const products: Product[] = fs.existsSync(LOCAL) ? JSON.parse(fs.readFileSync(LOCAL, "utf8")).products : seedProducts;
console.log(fs.existsSync(LOCAL) ? `Copying the local store: ${products.length} pieces.` : `Loading the starting catalogue: ${products.length} pieces.`);

/** Photos uploaded on this computer live at /media/<key>; send their sizes to Storage and point at the public URL. */
async function hostMedia(m: Media): Promise<Media> {
  if (!m.url.startsWith("/media/")) return m; // /products/... ships with the site itself
  const k = m.url.slice("/media/".length);
  for (const w of m.widths) {
    const file = path.join(UPLOADS, `${k}-${w}.webp`);
    const { error } = await sb.storage.from("products").upload(`${k}-${w}.webp`, fs.readFileSync(file), {
      contentType: "image/webp", cacheControl: "31536000", upsert: true,
    });
    if (error) throw new Error(`Photo upload failed for ${k}-${w}: ${error.message}`);
  }
  return { ...m, url: `${url}/storage/v1/object/public/products/${k}` };
}

async function main() {
  must(await sb.from("weavers").upsert(weavers, { onConflict: "id", ignoreDuplicates: true }));
  must(await sb.from("drops").upsert({ id: site.currentDrop.number, title: site.currentDrop.label }, { onConflict: "id", ignoreDuplicates: true }));
  const dropIds = new Set([site.currentDrop.number]);
  const weaverIds = new Set(weavers.map((w) => w.id));

  const existing = new Set((must(await sb.from("products").select("code")) ?? []).map((r) => r.code));
  let added = 0, photos = 0;
  for (const p of products) {
    if (existing.has(p.code)) continue;
    const media = await Promise.all(p.media.map(hostMedia));
    photos += media.filter((m, i) => m.url !== p.media[i].url).length;
    const row = must(await sb.from("products").insert({
      code: p.code, name: p.name, category: p.category, weave: p.weave, colour: p.colour, colour_hex: p.colourHex,
      colour_family: p.colourFamily, occasion: p.occasion, price: p.price, stock: p.stock, silk_mark: p.silkMark,
      weaver_id: p.weaverId && weaverIds.has(p.weaverId) ? p.weaverId : null, description: p.description, status: p.status,
      drop_id: p.drop && dropIds.has(p.drop) ? p.drop : null, featured: p.featured, on_model: Boolean(p.onModel),
      cover: p.cover ?? null, ...(p.createdAt ? { created_at: p.createdAt } : {}),
    }).select("id").single());
    if (media.length) {
      must(await sb.from("product_media").insert(media.map((m, sort) => ({
        product_id: row!.id, url: m.url, type: m.type, width: m.width, height: m.height, variants: m.widths, sort,
      }))));
    }
    added++;
  }
  console.log(`Done. ${added} pieces added (${photos} photos uploaded to storage), ${products.length - added} already there.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
