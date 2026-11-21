// Dashboard quick-add: one photo in, one draft listing out (or, with `code`, one more photo on that piece).
// Photo processing and the AI read run at the same time, so a listing is usually ready in a few seconds.
import { revalidatePath } from "next/cache";
import { aiEnabled, draftFromPhoto } from "@/lib/ai";
import { MAX_UPLOAD_BYTES, preparePhoto, savePhoto } from "@/lib/photos";
import { BANNED, NOT_OFFERED, defaultPrice, fallbackDraft } from "@/lib/listing";
import { currentAdmin } from "@/lib/session";
import * as store from "@/lib/store";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Photos uploaded together are read separately, so two can come back with the same name: keep each one distinct. */
function uniqueName(name: string, colour: string, taken: string[]) {
  const used = new Set(taken.map((n) => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  const withColour = colour ? `${name}, ${colour.charAt(0).toUpperCase()}${colour.slice(1)}` : "";
  if (withColour && !used.has(withColour.toLowerCase())) return withColour.slice(0, 80);
  for (let n = 2; ; n++) if (!used.has(`${name} ${n}`.toLowerCase())) return `${name} ${n}`;
}

export async function POST(req: Request) {
  const who = await currentAdmin();
  if (!who) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const started = Date.now();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No photo received." }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "That file is not a photo." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "That photo is over 12 MB." }, { status: 413 });
  const input = Buffer.from(await file.arrayBuffer());

  // Add a photo to an existing piece.
  const addTo = String(form.get("code") || "");
  if (addTo) {
    const p = await store.getProduct(addTo);
    if (!p) return Response.json({ error: "Piece not found." }, { status: 404 });
    let media;
    try {
      media = await savePhoto(await preparePhoto(input));
    } catch {
      return Response.json({ error: "Could not read that photo. Try a JPEG or PNG." }, { status: 400 });
    }
    await store.addProductMedia(addTo, media);
    await store.audit(who, "product.photo_added", addTo);
    revalidatePath("/", "layout");
    return Response.json({ product: { ...p, media: [...p.media, media] }, ms: Date.now() - started });
  }

  // New piece: read the photo once, then store the web sizes and ask the AI at the same time.
  let prepared;
  try {
    prepared = await preparePhoto(input);
  } catch {
    return Response.json({ error: "Could not read that photo. Try a JPEG or PNG." }, { status: 400 });
  }
  const all = await store.listProducts({ includeHidden: true });
  const [media, ai] = await Promise.all([savePhoto(prepared), draftFromPhoto(prepared.forAi, all.map((p) => p.name))]);
  const photo = { media };
  const d = ai ?? fallbackDraft(photo.media);
  // Belt and braces: even if the AI slips, no fibre claims reach the store.
  const description = BANNED.test(d.description) || NOT_OFFERED.test(d.description) ? fallbackDraft(photo.media).description : d.description;

  const draft: Omit<Product, "code"> = {
    name: uniqueName(d.name.slice(0, 80), d.colour, (await store.listProducts({ includeHidden: true })).map((p) => p.name)), category: d.category as Product["category"], weave: d.weave.slice(0, 40),
    colour: d.colour.slice(0, 40), colourHex: /^#[0-9a-f]{6}$/i.test(d.colourHex) ? d.colourHex : "#888888",
    colourFamily: d.colourFamily, occasion: d.occasion.slice(0, 3), price: defaultPrice(all, d.category), stock: 1,
    silkMark: false, weaverId: null, description: description.slice(0, 1200), status: "draft", drop: 0,
    featured: false, media: [photo.media], onModel: d.onModel, createdAt: new Date().toISOString(),
  };
  const code = await store.createProduct(draft);
  const product: Product = { ...draft, code };
  await store.audit(who, "product.drafted", `${code} ${ai ? "by AI" : "manual"} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  return Response.json({ product, ai: Boolean(ai), aiEnabled, ms: Date.now() - started });
}
