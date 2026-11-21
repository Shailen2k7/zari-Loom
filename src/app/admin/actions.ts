"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { nextStatus, statusTemplate } from "@/lib/orders";
import { endSession, requireAdmin, safeEqual, startSession } from "@/lib/session";
import * as store from "@/lib/store";
import { categories, colourFamilies, occasions } from "@/config/site";
import { BANNED, NOT_OFFERED } from "@/lib/listing";
import type { Category, ProductStatus } from "@/lib/types";

// ---- login ----
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.n >= 5 && Date.now() < a.until) return { error: "Too many attempts. Please wait 10 minutes and try again." };
  const fail = (msg: string) => {
    attempts.set(ip, { n: (a && Date.now() < a.until ? a.n : 0) + 1, until: Date.now() + 10 * 60 * 1000 });
    return { error: msg };
  };
  const password = String(form.get("password") || "");

  // One owner password (ADMIN_PASSWORD), with or without Supabase. Failed tries are rate-limited above.
  const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_DEMO_PASSWORD || "";
  if (!expected) return { error: "ADMIN_PASSWORD is not set." };
  if (!safeEqual(password, expected)) return fail("Wrong password.");
  const who = "owner";
  attempts.delete(ip);
  await startSession(who);
  await store.audit(who, "admin.login", "");
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---- orders ----
export async function advanceOrder(form: FormData) {
  const who = await requireAdmin();
  const id = String(form.get("id"));
  const order = await store.getOrder(id);
  const next = order && nextStatus[order.status];
  if (!order || !next) return;
  const patch: Parameters<typeof store.updateOrder>[1] = { status: next };
  if (next === "delivered" && order.paymentStatus === "cod_due") patch.paymentStatus = "paid";
  await store.updateOrder(id, patch);
  const tpl = statusTemplate[next];
  await store.audit(who, "order." + next, `${id}${tpl ? ` · WhatsApp template "${tpl}" will send once the WhatsApp layer is live` : ""}${next === "packed" ? " · courier booking starts with Shiprocket in Phase 3" : ""}`);
  revalidatePath("/admin", "layout");
}

export async function cancelOrder(form: FormData) {
  const who = await requireAdmin();
  const id = String(form.get("id"));
  const order = await store.getOrder(id);
  if (!order || !["new", "packed", "pending_payment"].includes(order.status)) return;
  if (order.stockTaken) {
    // give the pieces back to stock
    for (const i of order.items) {
      const p = await store.getProduct(i.code);
      if (p) await store.updateProduct(i.code, { stock: p.stock + i.qty, status: p.status === "sold_out" ? "live" : p.status });
    }
  }
  await store.updateOrder(id, { status: "cancelled", stockTaken: false });
  await store.audit(who, "order.cancelled", `${id}${order.paymentStatus === "paid" ? " · PAID: refund needed" : ""}`);
  revalidatePath("/", "layout");
}

// ---- products ----

export async function saveProduct(form: FormData) {
  const who = await requireAdmin();
  const code = String(form.get("code"));
  const name = String(form.get("name") || "").trim().slice(0, 80);
  const description = String(form.get("description") || "").trim().slice(0, 1200);
  const price = Math.floor(Number(form.get("price")));
  const stock = Math.floor(Number(form.get("stock")));
  const silkMark = form.get("silkMark") === "on";
  const featured = form.get("featured") === "on";
  let status = String(form.get("status")) as ProductStatus;

  const back = (error: string) => redirect(`/admin/products?edit=${code}&error=${encodeURIComponent(error)}#p-${code}`);
  if (!name) back("Name cannot be empty.");
  if (!Number.isFinite(price) || price < 1) back("Price must be a number above zero.");
  if (!Number.isFinite(stock) || stock < 0) back("Stock cannot be negative.");
  if (!["draft", "live", "sold_out"].includes(status)) back("Unknown status.");
  // Compliance: silk and handloom claims are allowed only on pieces the owner has marked as Silk Mark.
  if (!silkMark && BANNED.test(`${name} ${description}`)) {
    back('The words "pure silk", "handloom" and "Silk Mark" can be used only when Silk Mark is ticked for this piece.');
  }
  if (NOT_OFFERED.test(`${name} ${description}`)) back("We sell unstitched fabric only: remove ready-to-wear, stitching or trial wording.");
  if (stock === 0 && status === "live") status = "sold_out";
  if (stock > 0 && status === "sold_out") status = "live";

  await store.updateProduct(code, { name, description, price, stock, silkMark, featured, status });
  await store.audit(who, "product.updated", `${code} ₹${price} stock ${stock} ${status}${silkMark ? " silk-mark" : ""}`);
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=${code}#p-${code}`);
}

// ---- trials ----
export async function setTrialStatus(form: FormData) {
  const who = await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (status !== "done" && status !== "cancelled" && status !== "booked") return;
  await store.updateTrial(id, status);
  await store.audit(who, "trial." + status, id);
  revalidatePath("/admin", "layout");
}

// ---- quick edit / publish (called straight from the dashboard cards, no page reload) ----
export type QuickFields = {
  name: string; price: number; stock: number; category: string; colour: string; colourHex: string; colourFamily: string;
  weave: string; occasion: string[]; description: string; featured: boolean; silkMark: boolean; status: ProductStatus;
};

export async function quickSave(code: string, f: QuickFields): Promise<{ ok: true; status: ProductStatus } | { error: string }> {
  const who = await requireAdmin();
  const p = await store.getProduct(String(code));
  if (!p) return { error: "This piece no longer exists." };
  const name = String(f.name || "").trim().slice(0, 80);
  const description = String(f.description || "").trim().slice(0, 1200);
  const price = Math.floor(Number(f.price));
  const stock = Math.floor(Number(f.stock));
  if (!name) return { error: "Give the piece a name." };
  if (!Number.isFinite(price) || price < 1) return { error: "Add a price." };
  if (!Number.isFinite(stock) || stock < 0) return { error: "Stock cannot be negative." };
  if (!categories.some((c) => c.slug === f.category)) return { error: "Pick a category." };
  if (!["draft", "live", "sold_out"].includes(f.status)) return { error: "Unknown status." };
  if (!f.silkMark && BANNED.test(`${name} ${description}`)) {
    return { error: 'Remove "pure silk", "handloom" or "Silk Mark" from the text, or tick Silk Mark if this piece is certified.' };
  }
  if (NOT_OFFERED.test(`${name} ${description}`)) return { error: "We sell unstitched fabric only. Remove ready-to-wear, stitching or trial wording." };
  let status = f.status;
  if (stock === 0 && status === "live") status = "sold_out";
  if (stock > 0 && status === "sold_out") status = "live";
  await store.updateProduct(p.code, {
    name, description, price, stock, status, featured: Boolean(f.featured), silkMark: Boolean(f.silkMark),
    category: f.category as Category,
    colour: String(f.colour || "").trim().slice(0, 40),
    colourHex: /^#[0-9a-f]{6}$/i.test(f.colourHex) ? f.colourHex : p.colourHex,
    colourFamily: colourFamilies.some((c) => c.slug === f.colourFamily) ? f.colourFamily : p.colourFamily,
    weave: String(f.weave || "").trim().slice(0, 40),
    occasion: (Array.isArray(f.occasion) ? f.occasion : []).filter((o) => occasions.some((x) => x.slug === o)).slice(0, 4),
  });
  await store.audit(who, p.status !== "live" && status === "live" ? "product.published" : "product.updated", `${p.code} ₹${price} stock ${stock} ${status}`);
  revalidatePath("/", "layout");
  return { ok: true, status };
}
