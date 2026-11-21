import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { paymentMode } from "@/lib/razorpay";
import { getOrder } from "@/lib/store";

// Simulated test payment. Works ONLY when ALLOW_TEST_PAYMENTS=yes and no Razorpay keys are set, so it can never
// be used to mark a real order as paid on the live site.
export async function POST(req: Request) {
  if (paymentMode !== "test") return NextResponse.json({ error: "Not available." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const order = await getOrder(String(b.orderId || ""));
  if (!order || order.paymentMethod === "cod") return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const r = await markPaid(order, "TEST-SIMULATED", "simulated");
  if (r === "no_stock") return NextResponse.json({ error: "This piece has just sold out." }, { status: 409 });
  return NextResponse.json({ ok: true, orderId: order.id });
}
