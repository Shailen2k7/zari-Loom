import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, WhatsApp } from "@/components/Icons";
import { inr, waLink } from "@/lib/format";
import { orderKey } from "@/lib/orders";
import { safeEqual } from "@/lib/session";
import { getOrder } from "@/lib/store";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusText: Record<string, string> = {
  pending_payment: "Waiting for payment", new: "Confirmed", packed: "Packed", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k } = await searchParams;
  const order = await getOrder(id);
  // The order ID alone is not enough to see an order: the private key in the link must match too.
  if (!order || !k || !safeEqual(k, orderKey(order.id))) notFound();
  const paid = order.paymentStatus === "paid";

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <ol className="flex items-center gap-3 text-sm font-semibold" aria-label="Checkout steps">
        {["Bag", "Details", "Payment", "Confirmed"].map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-peacock text-white">{i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
            {i < 3 && <span className="h-px w-5 bg-line sm:w-10" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-xl bg-white p-6 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-tint text-peacock"><Check width={28} height={28} /></span>
        <h1 className="display mt-5 text-5xl sm:text-6xl">
          {order.status === "pending_payment" ? "Almost there" : <>Thank you, <em className="font-normal text-peacock">{order.customerName.split(" ")[0]}</em></>}
        </h1>
        <p className="mt-4 text-muted">
          {order.status === "pending_payment"
            ? "We have not received your payment yet. If money left your account, it will update here in a minute."
            : "Your order is confirmed. We are checking and packing your piece by hand."}
        </p>
        <dl className="mt-7 grid gap-5 border-y border-line py-6 text-sm sm:grid-cols-3">
          <div><dt className="label text-muted">Order ID</dt><dd className="mt-1.5 text-lg font-semibold">{order.id}</dd></div>
          <div><dt className="label text-muted">Status</dt><dd className="mt-1.5 font-medium">{statusText[order.status]}</dd></div>
          <div><dt className="label text-muted">Payment</dt><dd className="mt-1.5 font-medium">{paid ? "Paid" : order.paymentStatus === "cod_due" ? "Pay on delivery" : "Pending"}{order.paymentRef.startsWith("TEST") ? " (test)" : ""}</dd></div>
          <div className="sm:col-span-2"><dt className="label text-muted">Delivering to</dt><dd className="mt-1.5">{[order.address.tower, order.address.society, order.address.line1, order.address.city, order.address.pincode].filter(Boolean).join(", ")}</dd></div>
          <div><dt className="label text-muted">Delivery</dt><dd className="mt-1.5">{order.slot}</dd></div>
        </dl>
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.code} className="flex items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image && <img src={i.image} alt="" className="photo !w-16" loading="lazy" />}
              <span className="flex-1"><span className="display block text-xl">{i.name}</span><span className="text-sm text-muted">Code {i.code}{i.qty > 1 ? ` · Qty ${i.qty}` : ""}</span></span>
              <span className="font-medium">{inr(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-peacock"><dt>Offer {order.offerCode}</dt><dd>-{inr(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shipping ? inr(order.shipping) : "Free"}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={waLink(`Hi! Please share updates for my order ${order.id}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-wa"><WhatsApp /> Track on WhatsApp</a>
          <Link href="/collection" className="btn btn-ghost">Keep browsing</Link>
        </div>
      </div>
    </div>
  );
}
