// Data layer. Two drivers behind one interface:
//  - Supabase (Postgres) when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//  - a local JSON file (.data/store.json) otherwise, so the store runs on a laptop with no setup
// Server only: this file uses the service role key and must never be imported by a client component.
import { NOT_OFFERED } from "./listing";
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedProducts, weavers as seedWeavers } from "@/data/catalog";
import type { AuditEntry, Contact, Media, Order, OrderItem, Product, Trial, Weaver } from "./types";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const usingSupabase = Boolean(SB_URL && SB_KEY);

let _sb: SupabaseClient | null = null;
export class NoRealtime {
  constructor() { throw new Error("Supabase Realtime is not used by this store."); }
}

function sb() {
  // The store never uses Supabase Realtime. Node 20 has no built-in WebSocket, so hand the client a stand-in
  // instead of letting it crash on start-up (Node 22+ would not need this).
  if (!_sb) _sb = createClient(SB_URL!, SB_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: NoRealtime as never },
  });
  return _sb;
}

// ---------- local file driver ----------
interface FileDb {
  products: Product[];
  orders: Order[];
  trials: Trial[];
  contacts: Contact[];
  audit: AuditEntry[];
}
const FILE = path.join(process.cwd(), ".data", "store.json");
function readDb(): FileDb {
  try {
    const db = JSON.parse(fs.readFileSync(FILE, "utf8")) as FileDb;
    // Bring in catalogue pieces added to the seed after this file was created,
    // and refresh the seed's own photo + on-model flags (owner edits to price/stock are kept).
    const have = new Map(db.products.map((p) => [p.code, p]));
    let changed = false;
    for (const s of seedProducts) {
      const cur = have.get(s.code);
      if (!cur) { db.products.push(s); changed = true; }
      else if (cur.onModel !== s.onModel || cur.cover?.url !== s.cover?.url) { cur.onModel = s.onModel; cur.cover = s.cover; changed = true; }
      if (cur && NOT_OFFERED.test(cur.description)) { cur.description = s.description; changed = true; }
    }
    if (changed) writeDb(db);
    return db;
  } catch {
    const db: FileDb = { products: seedProducts, orders: [], trials: [], contacts: [], audit: [] };
    writeDb(db);
    return db;
  }
}
function writeDb(db: FileDb) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
  fs.renameSync(tmp, FILE);
}

// ---------- row mapping (Supabase) ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
function toProduct(r: any): Product {
  const media: Media[] = (r.product_media ?? [])
    .sort((a: any, b: any) => a.sort - b.sort)
    .map((m: any) => ({ url: m.url, type: m.type, width: m.width, height: m.height, widths: m.variants ?? [] }));
  return {
    code: r.code, name: r.name, category: r.category, weave: r.weave, colour: r.colour,
    colourHex: r.colour_hex, colourFamily: r.colour_family, occasion: r.occasion ?? [],
    price: r.price, stock: r.stock, silkMark: r.silk_mark, weaverId: r.weaver_id,
    description: r.description, status: r.status, drop: r.drop_id ?? 0, featured: r.featured, media,
    onModel: r.on_model ?? false, createdAt: r.created_at, cover: r.cover ?? undefined,
  };
}
function toOrder(r: any): Order {
  const items: OrderItem[] = (r.order_items ?? []).map((i: any) => ({
    code: i.product_code, name: i.name, qty: i.qty, unitPrice: i.unit_price,
    lineTotal: i.line_total, image: i.image,
  }));
  return {
    id: r.id, createdAt: r.created_at, status: r.status, customerName: r.customer_name, phone: r.phone,
    email: r.email ?? "", address: r.address, slot: r.slot, items, subtotal: r.subtotal, discount: r.discount,
    offerCode: r.offer_code ?? "", shipping: r.shipping, total: r.total, paymentMethod: r.payment_method,
    paymentStatus: r.payment_status, paymentRef: r.payment_ref ?? "", gatewayOrderId: r.gateway_order_id ?? "",
    stockTaken: r.stock_taken,
  };
}
function fromOrderPatch(p: Partial<Order>) {
  const m: Record<string, unknown> = {};
  if (p.status !== undefined) m.status = p.status;
  if (p.paymentStatus !== undefined) m.payment_status = p.paymentStatus;
  if (p.paymentRef !== undefined) m.payment_ref = p.paymentRef;
  if (p.gatewayOrderId !== undefined) m.gateway_order_id = p.gatewayOrderId;
  if (p.stockTaken !== undefined) m.stock_taken = p.stockTaken;
  return m;
}
function toTrial(r: any): Trial {
  return { id: r.id, createdAt: r.created_at, name: r.name, phone: r.phone, society: r.society, tower: r.tower,
    pincode: r.pincode, slot: r.slot, pieces: r.pieces, status: r.status };
}
function toContact(r: any): Contact {
  return { phone: r.phone, name: r.name ?? "", society: r.society ?? "", optInAt: r.opt_in_at,
    optInSource: r.opt_in_source ?? "", consentText: r.consent_text ?? "", unsubscribedAt: r.unsubscribed_at };
}
function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error("Database error: " + res.error.message);
  return res.data;
}
function list(res: { data: any[] | null; error: { message: string } | null }): any[] {
  if (res.error) throw new Error("Database error: " + res.error.message);
  return res.data ?? [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- products ----------
export async function listProducts(opts: { includeHidden?: boolean } = {}): Promise<Product[]> {
  let all: Product[];
  if (usingSupabase) {
    all = list(await sb().from("products").select("*, product_media(*)").order("code")).map(toProduct);
  } else {
    all = readDb().products;
  }
  // Sold-out pieces auto-hide from the storefront; drafts never show.
  return opts.includeHidden ? all : all.filter((p) => p.status === "live" && p.stock > 0);
}

export async function getProduct(code: string): Promise<Product | null> {
  if (usingSupabase) {
    const r = check(await sb().from("products").select("*, product_media(*)").eq("code", code).maybeSingle());
    return r ? toProduct(r) : null;
  }
  return readDb().products.find((p) => p.code === code) ?? null;
}

export type ProductPatch = Partial<Pick<Product,
  "name" | "price" | "stock" | "status" | "silkMark" | "description" | "weave" | "colour" | "featured"
  | "category" | "colourHex" | "colourFamily" | "occasion" | "onModel">>;

export async function updateProduct(code: string, patch: ProductPatch) {
  if (usingSupabase) {
    const m: Record<string, unknown> = {};
    if (patch.name !== undefined) m.name = patch.name;
    if (patch.price !== undefined) m.price = patch.price;
    if (patch.stock !== undefined) m.stock = patch.stock;
    if (patch.status !== undefined) m.status = patch.status;
    if (patch.silkMark !== undefined) m.silk_mark = patch.silkMark;
    if (patch.description !== undefined) m.description = patch.description;
    if (patch.weave !== undefined) m.weave = patch.weave;
    if (patch.colour !== undefined) m.colour = patch.colour;
    if (patch.featured !== undefined) m.featured = patch.featured;
    if (patch.category !== undefined) m.category = patch.category;
    if (patch.colourHex !== undefined) m.colour_hex = patch.colourHex;
    if (patch.colourFamily !== undefined) m.colour_family = patch.colourFamily;
    if (patch.occasion !== undefined) m.occasion = patch.occasion;
    if (patch.onModel !== undefined) m.on_model = patch.onModel;
    m.updated_at = new Date().toISOString();
    check(await sb().from("products").update(m).eq("code", code));
    return;
  }
  const db = readDb();
  const p = db.products.find((x) => x.code === code);
  if (!p) throw new Error("Product not found");
  Object.assign(p, patch);
  writeDb(db);
}

// ---------- uploaded photos ----------
export const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

/** Save the webp variants of one photo. Returns the base URL (variants live at `${base}-${width}.webp`). */
export async function savePhotoFiles(key: string, files: { width: number; data: Buffer }[]): Promise<string> {
  if (usingSupabase) {
    for (const f of files) {
      const { error } = await sb().storage.from("products").upload(`${key}-${f.width}.webp`, f.data, {
        contentType: "image/webp", cacheControl: "31536000", upsert: false,
      });
      if (error) throw new Error("Photo upload failed: " + error.message);
    }
    return `${SB_URL}/storage/v1/object/public/products/${key}`;
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(UPLOAD_DIR, `${key}-${f.width}.webp`), f.data);
  return `/media/${key}`;
}

/** One above the highest numeric product code. */
function codeAfter(products: { code: string }[]) {
  return String(products.reduce((m, p) => Math.max(m, Number(p.code) || 0), 1000) + 1);
}

/** Next free product code (a preview only: createProduct assigns the real one). */
export async function nextProductCode(): Promise<string> {
  return codeAfter(await listProducts({ includeHidden: true }));
}

/**
 * Create a new piece and return the code it was given. The code is chosen at the moment of saving,
 * so several photos uploaded at once never collide: the file store does it in one synchronous step,
 * and Postgres retries when another upload took the same code a moment earlier (unique constraint).
 */
export async function createProduct(p: Omit<Product, "code">): Promise<string> {
  if (usingSupabase) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = await nextProductCode();
      const res = await sb().from("products").insert({
        code, name: p.name, category: p.category, weave: p.weave, colour: p.colour, colour_hex: p.colourHex,
        colour_family: p.colourFamily, occasion: p.occasion, price: p.price, stock: p.stock, silk_mark: p.silkMark,
        weaver_id: p.weaverId, description: p.description, status: p.status, drop_id: p.drop || null,
        featured: p.featured, on_model: Boolean(p.onModel), cover: p.cover ?? null,
      }).select("id").single();
      if (res.error?.code === "23505") continue; // code just taken by a parallel upload: try the next one
      const row = check(res) as { id: string };
      if (p.media.length) {
        check(await sb().from("product_media").insert(p.media.map((m, i) => ({
          product_id: row.id, url: m.url, type: m.type, width: m.width, height: m.height, variants: m.widths, sort: i,
        }))));
      }
      return code;
    }
    throw new Error("Could not find a free product code. Please try again.");
  }
  const db = readDb();
  const code = codeAfter(db.products);
  db.products.unshift({ ...p, code, createdAt: p.createdAt ?? new Date().toISOString() });
  writeDb(db);
  return code;
}

/** Add one more photo to an existing piece. */
export async function addProductMedia(code: string, m: Media) {
  if (usingSupabase) {
    const row = check(await sb().from("products").select("id, product_media(sort)").eq("code", code).single()) as
      { id: string; product_media: { sort: number }[] };
    const sort = row.product_media.reduce((x, r) => Math.max(x, r.sort + 1), 0);
    check(await sb().from("product_media").insert({ product_id: row.id, url: m.url, type: m.type, width: m.width, height: m.height, variants: m.widths, sort }));
    return;
  }
  const db = readDb();
  const p = db.products.find((x) => x.code === code);
  if (!p) throw new Error("Product not found");
  p.media.push(m);
  writeDb(db);
}

/** Set a piece's photos to exactly this list, in this order (first one is the cover). Photos left out are removed from the piece. */
export async function setProductMedia(code: string, media: Media[]) {
  if (usingSupabase) {
    const row = check(await sb().from("products").select("id, product_media(id, url)").eq("code", code).single()) as
      { id: string; product_media: { id: string; url: string }[] };
    const keep = new Map(media.map((m, i) => [m.url, i]));
    const drop = row.product_media.filter((r) => !keep.has(r.url)).map((r) => r.id);
    if (drop.length) check(await sb().from("product_media").delete().in("id", drop));
    for (const r of row.product_media) {
      const sort = keep.get(r.url);
      if (sort !== undefined) check(await sb().from("product_media").update({ sort }).eq("id", r.id));
    }
    return;
  }
  const db = readDb();
  const p = db.products.find((x) => x.code === code);
  if (!p) throw new Error("Product not found");
  p.media = media;
  writeDb(db);
}

/** Take stock for an order. Returns false (and takes nothing) if any piece is short. */
export async function takeStock(items: { code: string; qty: number }[]): Promise<boolean> {
  if (usingSupabase) {
    const taken: { code: string; qty: number }[] = [];
    for (const it of items) {
      const ok = check(await sb().rpc("take_stock", { p_code: it.code, p_qty: it.qty }));
      if (!ok) {
        for (const t of taken) await sb().rpc("take_stock", { p_code: t.code, p_qty: -t.qty });
        return false;
      }
      taken.push(it);
    }
    return true;
  }
  const db = readDb();
  for (const it of items) {
    const p = db.products.find((x) => x.code === it.code);
    if (!p || p.stock < it.qty) return false;
  }
  for (const it of items) {
    const p = db.products.find((x) => x.code === it.code)!;
    p.stock -= it.qty;
    if (p.stock <= 0) p.status = "sold_out";
  }
  writeDb(db);
  return true;
}

export async function listWeavers(): Promise<Weaver[]> {
  if (usingSupabase) {
    const rows = list(await sb().from("weavers").select("*"));
    return rows.map((r) => ({ id: r.id, name: r.name, village: r.village, story: r.story, placeholder: r.placeholder }));
  }
  return seedWeavers;
}

// ---------- orders ----------
export async function createOrder(o: Order) {
  if (usingSupabase) {
    check(await sb().from("orders").insert({
      id: o.id, created_at: o.createdAt, status: o.status, customer_name: o.customerName, phone: o.phone,
      email: o.email, address: o.address, slot: o.slot, subtotal: o.subtotal, discount: o.discount,
      offer_code: o.offerCode, shipping: o.shipping, total: o.total, payment_method: o.paymentMethod,
      payment_status: o.paymentStatus, payment_ref: o.paymentRef, gateway_order_id: o.gatewayOrderId,
      stock_taken: o.stockTaken,
    }));
    check(await sb().from("order_items").insert(o.items.map((i) => ({
      order_id: o.id, product_code: i.code, name: i.name, qty: i.qty, unit_price: i.unitPrice,
      line_total: i.lineTotal, image: i.image,
    }))));
    return;
  }
  const db = readDb();
  db.orders.unshift(o);
  writeDb(db);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (usingSupabase) {
    const r = check(await sb().from("orders").select("*, order_items(*)").eq("id", id).maybeSingle());
    return r ? toOrder(r) : null;
  }
  return readDb().orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByGatewayId(gatewayOrderId: string): Promise<Order | null> {
  if (usingSupabase) {
    const r = check(await sb().from("orders").select("*, order_items(*)").eq("gateway_order_id", gatewayOrderId).maybeSingle());
    return r ? toOrder(r) : null;
  }
  return readDb().orders.find((o) => o.gatewayOrderId === gatewayOrderId) ?? null;
}

export async function listOrders(): Promise<Order[]> {
  if (usingSupabase) {
    return list(await sb().from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500)).map(toOrder);
  }
  return readDb().orders;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  if (usingSupabase) {
    check(await sb().from("orders").update(fromOrderPatch(patch)).eq("id", id));
    return;
  }
  const db = readDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found");
  Object.assign(o, patch);
  writeDb(db);
}

export async function recordPayment(p: { orderId: string; gateway: string; gatewayPaymentId: string; amount: number; status: string }) {
  if (usingSupabase) {
    check(await sb().from("payments").insert({
      order_id: p.orderId, gateway: p.gateway, gateway_payment_id: p.gatewayPaymentId, amount: p.amount, status: p.status,
    }));
  }
  await audit("system", "payment." + p.status, `${p.orderId} ${p.gateway} ${p.gatewayPaymentId} ₹${p.amount}`);
}

// ---------- trials ----------
export async function createTrial(t: Trial) {
  if (usingSupabase) {
    check(await sb().from("trials").insert({
      id: t.id, created_at: t.createdAt, name: t.name, phone: t.phone, society: t.society, tower: t.tower,
      pincode: t.pincode, slot: t.slot, pieces: t.pieces, status: t.status,
    }));
    return;
  }
  const db = readDb();
  db.trials.unshift(t);
  writeDb(db);
}
export async function listTrials(): Promise<Trial[]> {
  if (usingSupabase) return list(await sb().from("trials").select("*").order("created_at", { ascending: false }).limit(500)).map(toTrial);
  return readDb().trials;
}
export async function updateTrial(id: string, status: Trial["status"]) {
  if (usingSupabase) {
    check(await sb().from("trials").update({ status }).eq("id", id));
    return;
  }
  const db = readDb();
  const t = db.trials.find((x) => x.id === id);
  if (t) t.status = status;
  writeDb(db);
}

// ---------- contacts and consent ----------
/**
 * Save a contact. Marketing consent is only recorded when `consent` is given, and is stored with the
 * timestamp, the source, and the exact text the person agreed to. An existing opt-in is never overwritten
 * and an unsubscribe is never undone by this function.
 */
export async function saveContact(c: { phone: string; name: string; society: string; consent?: { source: string; text: string } }) {
  const now = new Date().toISOString();
  if (usingSupabase) {
    const existing = check(await sb().from("contacts").select("*").eq("phone", c.phone).maybeSingle());
    const row: Record<string, unknown> = { phone: c.phone, name: c.name || existing?.name || "", society: c.society || existing?.society || "" };
    if (c.consent && !existing?.opt_in_at && !existing?.unsubscribed_at) {
      row.opt_in_at = now; row.opt_in_source = c.consent.source; row.consent_text = c.consent.text;
    }
    check(await sb().from("contacts").upsert(row, { onConflict: "phone" }));
  } else {
    const db = readDb();
    let x = db.contacts.find((k) => k.phone === c.phone);
    if (!x) {
      x = { phone: c.phone, name: "", society: "", optInAt: null, optInSource: "", consentText: "", unsubscribedAt: null };
      db.contacts.unshift(x);
    }
    x.name = c.name || x.name;
    x.society = c.society || x.society;
    if (c.consent && !x.optInAt && !x.unsubscribedAt) {
      x.optInAt = now; x.optInSource = c.consent.source; x.consentText = c.consent.text;
    }
    writeDb(db);
  }
  if (c.consent) await audit("customer", "consent.opt_in", `${c.phone} via ${c.consent.source}`);
}
export async function listContacts(): Promise<Contact[]> {
  if (usingSupabase) return list(await sb().from("contacts").select("*").order("created_at", { ascending: false }).limit(1000)).map(toContact);
  return readDb().contacts;
}

// ---------- audit log ----------
export async function audit(actor: string, action: string, detail: string) {
  const entry: AuditEntry = { at: new Date().toISOString(), actor, action, detail };
  try {
    if (usingSupabase) {
      await sb().from("audit_log").insert({ actor, action, detail });
    } else {
      const db = readDb();
      db.audit.unshift(entry);
      db.audit = db.audit.slice(0, 500);
      writeDb(db);
    }
  } catch (e) {
    console.error("audit failed", e);
  }
}
export async function listAudit(): Promise<AuditEntry[]> {
  if (usingSupabase) {
    const rows = list(await sb().from("audit_log").select("*").order("created_at", { ascending: false }).limit(100));
    return rows.map((r) => ({ at: r.created_at, actor: r.actor, action: r.action, detail: r.detail }));
  }
  return readDb().audit.slice(0, 100);
}
