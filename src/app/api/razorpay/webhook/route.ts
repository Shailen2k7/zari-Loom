import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { audit, getOrderByGatewayId } from "@/lib/store";

// Razorpay server-to-server webhook. Every call must carry a valid signature over the raw body.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id) {
    const order = await getOrderByGatewayId(String(payment.order_id));
    if (order) await markPaid(order, String(payment.id), "razorpay");
  } else if (event.event === "payment.failed" && payment?.order_id) {
    await audit("system", "payment.failed", String(payment.order_id));
  }
  return NextResponse.json({ ok: true });
}
