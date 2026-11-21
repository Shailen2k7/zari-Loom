"use client";
import Link from "next/link";
import { useState } from "react";
import { delivery } from "@/config/site";
import { inr } from "@/lib/format";
import type { Media, Product } from "@/lib/types";
import { BuyOnWhatsApp } from "./BuyOnWhatsApp";
import { Check, Truck, WhatsApp } from "./Icons";
import { useShop } from "./Shop";

type Slim = Pick<Product, "code" | "name" | "price" | "stock" | "category" | "colour" | "weave"> & { media: Media[] };

export function ProductBuy({ p }: { p: Slim }) {
  const { bag, addToBag } = useShop();
  const [added, setAdded] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const price = p.price;
  const inBag = bag.filter((l) => l.code === p.code).reduce((s, l) => s + l.qty, 0);
  const soldOut = p.stock <= 0;
  const maxed = inBag >= p.stock;

  function checkPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setPinMsg({ ok: false, text: "Please enter a 6-digit pincode." });
    setPinMsg({ ok: true, text: `We deliver here in 3 to 6 days. Free shipping above ${inr(delivery.freeShippingAbove)}.` });
  }

  return (
    <div>
      <p className="display text-[2.6rem] leading-none">
        {inr(price)} <span className="font-sans text-sm font-normal text-muted">incl. all taxes</span>
      </p>

      <div className="mt-7 grid gap-3">
        <button type="button" className="btn btn-primary w-full" disabled={soldOut || maxed}
          onClick={() => { addToBag({ code: p.code, qty: 1 }, p.stock); setAdded(true); }}>
          {soldOut ? "Sold out" : maxed ? "In your bag" : "Add to bag"}
        </button>
        {(added || inBag > 0) && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-peacock">
            <Check width={18} height={18} /> In your bag. <Link href="/bag" className="underline underline-offset-4">Go to bag</Link>
          </p>
        )}
        <BuyOnWhatsApp p={p} className="btn btn-wa w-full"><WhatsApp /> Buy on WhatsApp</BuyOnWhatsApp>
      </div>

      <form onSubmit={checkPin} className="mt-7 rounded-lg border border-line bg-white p-4">
        <label htmlFor="pin" className="field-label flex items-center gap-2"><Truck width={18} height={18} /> Check delivery to your pincode</label>
        <div className="flex gap-2">
          <input id="pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="e.g. 201301" className="field" />
          <button type="submit" className="btn btn-ghost shrink-0">Check</button>
        </div>
        {pinMsg && <p role="status" className={`mt-3 text-sm ${pinMsg.ok ? "text-peacock" : "text-rose"}`}>{pinMsg.text}</p>}
      </form>
    </div>
  );
}
