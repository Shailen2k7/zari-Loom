"use client";
import { productHref } from "@/lib/seo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { inr, mediaSrc } from "@/lib/format";
import type { Media } from "@/lib/types";
import { useShop } from "./Shop";

type Slim = { code: string; name: string; colour: string; price: number; media: Media[] };
type Found = { id: string; createdAt: string; status: string; paymentStatus: string; total: number; slot: string; items: { name: string; qty: number; image: string }[] };
const statusText: Record<string, string> = { pending_payment: "Waiting for payment", new: "Confirmed", packed: "Packed", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled" };

export function Account() {
  const { ready, wish, toggleWish, myOrders } = useShop();
  const [products, setProducts] = useState<Slim[]>([]);
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => {});
    try {
      const d = localStorage.getItem("store_details");
      if (d) { const x = JSON.parse(d); setDetails(x); setPhone(x.phone || ""); }
    } catch {}
  }, []);
  useEffect(() => { if (myOrders[0] && !id) setId(myOrders[0]); }, [myOrders, id]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setFound(null);
    const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, phone }) });
    const data = await res.json();
    if (res.ok) setFound(data); else setError(data.error);
    setBusy(false);
  }

  const saved = products.filter((p) => wish.includes(p.code));
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-10">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="display text-3xl">Track an order</h2>
          <form onSubmit={lookup} className="mt-4 rounded-xl bg-white p-5">
            <label className="field-label" htmlFor="o-id">Order ID</label>
            <input id="o-id" className="field uppercase placeholder:normal-case" required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. ZL-123456" />
            <label className="field-label mt-4" htmlFor="o-phone">Phone number on the order</label>
            <input id="o-phone" className="field" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="btn btn-primary mt-5" disabled={busy}>{busy ? "Looking..." : "Find my order"}</button>
            {error && <p role="alert" className="mt-4 text-sm font-medium text-rose">{error}</p>}
            {found && (
              <div role="status" className="mt-5 rounded-lg bg-tint p-4 text-sm">
                <p className="text-base font-semibold">{found.id} · {statusText[found.status]}</p>
                <p className="mt-1 text-muted">{found.items.map((i) => i.name).join(", ")} · {inr(found.total)}</p>
                <p className="mt-1 text-muted">{found.slot}</p>
              </div>
            )}
          </form>
          {myOrders.length > 0 && <p className="mt-3 text-sm text-muted">Orders placed on this device: {myOrders.join(", ")}</p>}
        </section>
        <section aria-labelledby="addr-h">
          <h2 id="addr-h" className="display text-3xl">Saved address</h2>
          {details?.line1 ? (
            <p className="mt-4 rounded-xl bg-white p-5 text-sm leading-relaxed">
              <span className="font-semibold">{details.name}</span><br />
              {[details.tower, details.society, details.line1, details.city, details.pincode].filter(Boolean).join(", ")}
            </p>
          ) : <p className="mt-3 text-sm text-muted">Your address is saved on this device after your first order, so checkout is quicker next time.</p>}
        </section>

      </div>
      <section id="wishlist" aria-labelledby="wish-h" className="scroll-mt-32">
        <h2 id="wish-h" className="display text-3xl">Wishlist {ready && saved.length > 0 && <span className="font-sans text-base text-muted">({saved.length})</span>}</h2>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Tap the heart on any piece to save it here.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {saved.map((p) => (
              <li key={p.code}>
                <Link href={productHref(p)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="cell block">{p.media[0] && <img src={mediaSrc(p.media[0], 480)} width={p.media[0].width} height={p.media[0].height} alt={p.name} className="fit" loading="lazy" />}</span>
                  <span className="display mt-2 block text-xl leading-tight">{p.name}</span>
                </Link>
                <span className="text-sm">{inr(p.price)}</span>
                <button type="button" onClick={() => toggleWish(p.code)} className="block min-h-11 text-sm font-semibold text-peacock underline underline-offset-4">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
