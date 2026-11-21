import { NextResponse } from "next/server";
import { delivery, site } from "@/config/site";
import { mediaSrc, normalisePhone } from "@/lib/format";
import { newOrderId, orderKey } from "@/lib/orders";
import { isNoida, totals } from "@/lib/pricing";
import { createGatewayOrder, paymentMode, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import * as store from "@/lib/store";
import type { BagLine, Order, OrderItem, PaymentMethod } from "@/lib/types";

const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  // No online payment yet: the bag page sends the order on WhatsApp instead, so refuse here too.
  if (paymentMode === "off") return bad("Online payment is not open yet. Please send your order on WhatsApp.", 503);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Bad request");
  }

  const lines = Array.isArray(body.items) ? (body.items as BagLine[]).slice(0, 30) : [];
  if (!lines.length) return bad("Your bag is empty.");

  const name = str(body.name, 80);
  const phone = normalisePhone(str(body.phone, 20));
  const email = str(body.email, 120);
  const a = (body.address ?? {}) as Record<string, unknown>;
  const address = { line1: str(a.line1), society: str(a.society, 120), tower: str(a.tower, 60), city: str(a.city, 80), pincode: str(a.pincode, 6) };
  const method = str(body.method, 10) as PaymentMethod;

  if (name.length < 2) return bad("Please enter your name.");
  if (!phone) return bad("Please enter a valid 10-digit mobile number.");
  if (!address.line1 || !address.city) return bad("Please enter your full address.");
  if (!/^\d{6}$/.test(address.pincode)) return bad("Please enter a valid 6-digit pincode.");
  if (!["upi", "card"].includes(method)) return bad("Please choose how you would like to pay.");
  const noida = isNoida(address.pincode);
  const allowedSlots: readonly string[] = noida ? delivery.slots.noida : delivery.slots.other;
  const slot = allowedSlots.includes(str(body.slot)) ? str(body.slot) : allowedSlots[0];

  // Prices and stock always come from the database, never from the browser.
  const items: OrderItem[] = [];
  for (const l of lines) {
    const p = await store.getProduct(String(l.code));
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.qty) || 1)));
    if (!p || p.status !== "live") return bad("A piece in your bag is no longer available. Please review your bag.", 409);
    if (p.stock < qty) return bad(`${p.name} has just sold out. Please remove it from your bag.`, 409);
    items.push({ code: p.code, name: p.name, qty, unitPrice: p.price, lineTotal: p.price * qty, image: p.media[0] ? mediaSrc(p.media[0], 480) : "" });
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const offerCode = str(body.offerCode, 20).toUpperCase();
  const t = totals(subtotal, offerCode, address.pincode);
  if (offerCode && t.offerError) return bad(t.offerError);

  const order: Order = {
    id: newOrderId(), createdAt: new Date().toISOString(), status: "pending_payment",
    customerName: name, phone, email, address, slot, items,
    subtotal: t.subtotal, discount: t.discount, offerCode: t.discount ? offerCode : "", shipping: t.shipping, total: t.total,
    paymentMethod: method, paymentStatus: "pending", paymentRef: "", gatewayOrderId: "", stockTaken: false,
  };

  await store.saveContact({
    phone, name, society: address.society,
    consent: body.consent === true ? { source: "checkout", text: site.consentText } : undefined,
  });


  if (razorpayConfigured) {
    const g = await createGatewayOrder(order.total, order.id);
    await store.createOrder({ ...order, gatewayOrderId: g.id });
    await store.audit("customer", "order.created", `${order.id} awaiting payment ₹${order.total}`);
    return NextResponse.json({
      orderId: order.id, key: orderKey(order.id), mode: "razorpay",
      razorpay: { key: razorpayKeyId, gatewayOrderId: g.id, amount: g.amount, name, phone, email },
    });
  }

  // Test mode (ALLOW_TEST_PAYMENTS=yes, no Razorpay keys): simulated payment so the whole flow can be tried.
  await store.createOrder(order);
  await store.audit("customer", "order.created", `${order.id} awaiting simulated test payment ₹${order.total}`);
  return NextResponse.json({ orderId: order.id, key: orderKey(order.id), mode: "simulated" });
}
