import { NextResponse } from "next/server";
import { normalisePhone } from "@/lib/format";
import { getOrder } from "@/lib/store";

// Order tracking: needs both the order ID and the phone number used on the order.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const order = await getOrder(String(b.id || "").trim().toUpperCase());
  const phone = normalisePhone(String(b.phone || ""));
  if (!order || !phone || order.phone !== phone) {
    return NextResponse.json({ error: "We could not find an order with that ID and phone number." }, { status: 404 });
  }
  return NextResponse.json({
    id: order.id, createdAt: order.createdAt, status: order.status, paymentStatus: order.paymentStatus,
    total: order.total, slot: order.slot, items: order.items.map((i) => ({ name: i.name, qty: i.qty, image: i.image })),
  });
}
