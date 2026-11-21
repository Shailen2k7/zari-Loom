import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { getOrder } from "@/lib/store";

// Called by the browser after Razorpay Checkout succeeds. The signature proves the payment is real.
export async function POST(req: Request) {
  if (!razorpayConfigured) return NextResponse.json({ error: "Payments are not set up." }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const order = await getOrder(String(b.orderId || ""));
  if (!order || !order.gatewayOrderId || order.gatewayOrderId !== b.razorpay_order_id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!verifyPaymentSignature(order.gatewayOrderId, String(b.razorpay_payment_id || ""), String(b.razorpay_signature || ""))) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  const r = await markPaid(order, String(b.razorpay_payment_id), "razorpay");
  if (r === "no_stock") return NextResponse.json({ error: "This piece sold out while you were paying. We will refund you in full." }, { status: 409 });
  return NextResponse.json({ ok: true, orderId: order.id });
}
