// Order rules used by the checkout API, the payment routes and the dashboard.
import "server-only";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { site } from "@/config/site";
import * as store from "./store";
import type { Order } from "./types";

export const newOrderId = () => `${site.orderPrefix}-${crypto.randomInt(100000, 999999)}`;
/** Unguessable key that lets the buyer (and only the buyer) open their order page. */
export const orderKey = (id: string) =>
  crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update("order:" + id).digest("base64url").slice(0, 22);
export const newTrialId = () => `TR-${crypto.randomInt(100000, 999999)}`;

/** Mark an order paid. Safe to call twice (browser callback and webhook can both arrive). */
export async function markPaid(order: Order, paymentRef: string, gateway: string): Promise<"ok" | "already" | "no_stock"> {
  if (order.paymentStatus === "paid") return "already";
  if (!order.stockTaken) {
    const ok = await store.takeStock(order.items.map((i) => ({ code: i.code, qty: i.qty })));
    if (!ok) {
      await store.updateOrder(order.id, { paymentStatus: "paid", paymentRef, status: "cancelled" });
      await store.audit("system", "order.oversold", `${order.id} paid but stock was gone. Refund needed.`);
      return "no_stock";
    }
  }
  await store.updateOrder(order.id, { paymentStatus: "paid", paymentRef, status: "new", stockTaken: true });
  await store.recordPayment({ orderId: order.id, gateway, gatewayPaymentId: paymentRef, amount: order.total, status: "paid" });
  revalidatePath("/", "layout");
  return "ok";
}

export const nextStatus: Record<string, Order["status"] | undefined> = {
  new: "packed",
  packed: "shipped",
  shipped: "delivered",
};

// WhatsApp utility template that will go out on each step once the WhatsApp layer (Phase 2) is live.
export const statusTemplate: Record<string, string> = {
  new: "order_confirmed",
  shipped: "shipped",
  delivered: "out_for_delivery",
};
