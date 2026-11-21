"use client";
import { productHref } from "@/lib/seo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { delivery, site } from "@/config/site";
import { inr, mediaSrc, waLink } from "@/lib/format";
import { isNoida, totals } from "@/lib/pricing";
import type { Media, PaymentMethod, Product } from "@/lib/types";
import { useShop } from "./Shop";

type Slim = Pick<Product, "code" | "name" | "category" | "colour" | "weave" | "price" | "stock"> & { media: Media[] };
type Step = 0 | 1 | 2;
const steps = ["Bag", "Details", "Payment", "Confirmed"];

declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } }
}
function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function Checkout({ payments }: { payments: "razorpay" | "test" | "off" }) {
  const router = useRouter();
  const { ready, bag, removeLine, clearBag, rememberOrder } = useShop();
  const [products, setProducts] = useState<Slim[] | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [d, setD] = useState({ name: "", phone: "", email: "", line1: "", society: "", tower: "", city: "Noida", pincode: "", consent: false });
  const [slot, setSlot] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [pendingKey, setPendingKey] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => setProducts([]));
    try {
      const saved = localStorage.getItem("store_details");
      if (saved) setD((x) => ({ ...x, ...JSON.parse(saved), consent: false }));
    } catch {}
  }, []);

  const lines = useMemo(() => bag.map((l, index) => {
    const p = products?.find((x) => x.code === l.code);
    return { l, index, p, unit: p ? p.price : 0 };
  }), [bag, products]);
  const gone = lines.filter((x) => products && (!x.p || x.p.stock < x.l.qty));
  const subtotal = lines.reduce((s, x) => s + x.unit * x.l.qty, 0);
  const noida = isNoida(d.pincode);
  const t = totals(subtotal, applied, d.pincode);
  const slots: readonly string[] = noida ? delivery.slots.noida : delivery.slots.other;
  useEffect(() => { if (!slots.includes(slot)) setSlot(slots[0]); }, [slots, slot]);

  function applyCode() {
    const r = totals(subtotal, code, d.pincode);
    if (r.offerError) { setError(r.offerError); setApplied(""); } else { setError(""); setApplied(code.trim().toUpperCase()); }
  }

  function toPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, "").slice(-10))) return setError("Please enter a valid 10-digit mobile number.");
    if (!/^\d{6}$/.test(d.pincode)) return setError("Please enter a valid 6-digit pincode.");
    try { localStorage.setItem("store_details", JSON.stringify({ ...d, consent: false })); } catch {}
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  function done(orderId: string, key: string) {
    rememberOrder(orderId);
    clearBag();
    router.push(`/order/${orderId}?k=${key}`);
  }

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: bag, name: d.name, phone: d.phone, email: d.email, offerCode: applied, slot, method, consent: d.consent,
          address: { line1: d.line1, society: d.society, tower: d.tower, city: d.city, pincode: d.pincode },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      if (data.mode === "simulated") { setPending(data.orderId); setPendingKey(data.key); setBusy(false); return; }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Could not open the payment window. Please check your connection.");
      const rz = data.razorpay;
      new window.Razorpay({
        key: rz.key, order_id: rz.gatewayOrderId, amount: rz.amount, currency: "INR", name: site.brand,
        description: `Order ${data.orderId}`, prefill: { name: rz.name, contact: rz.phone, email: rz.email || undefined },
        theme: { color: "#0f4443" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: data.orderId, ...r }),
          });
          const vd = await v.json();
          if (!v.ok) { setError(vd.error || "Payment could not be verified."); setBusy(false); return; }
          done(data.orderId, data.key);
        },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function simulate() {
    setBusy(true);
    const res = await fetch("/api/payments/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: pending }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setBusy(false); setPending(""); return; }
    done(pending, pendingKey);
  }

  if (!ready || !products) return <p className="py-24 text-center text-muted">Loading your bag...</p>;
  if (!bag.length) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="display text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-muted">Most pieces are one of one. Find yours before someone else does.</p>
        <Link href="/collection" className="btn btn-primary mt-7">Browse the collection</Link>
      </div>
    );
  }

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const summary = (
    <aside className="rounded-xl bg-white p-5 sm:p-6 lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
      <h2 className="display text-2xl">Summary</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(t.subtotal)}</dd></div>
        {t.discount > 0 && <div className="flex justify-between text-peacock"><dt>Offer {applied}</dt><dd>-{inr(t.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{d.pincode.length === 6 ? (t.shipping ? inr(t.shipping) : "Free") : "Enter pincode"}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{inr(t.total)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-muted">Prices include all taxes.</p>
      {step === 0 && (
        <>
          <div className="mt-5">
            <label htmlFor="offer" className="field-label">Offer code</label>
            <div className="flex gap-2">
              <input id="offer" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SOCIETY300" className="field uppercase" />
              <button type="button" onClick={applyCode} className="btn btn-ghost shrink-0">Apply</button>
            </div>
            {applied && t.discount > 0 && <p role="status" className="mt-2 text-sm font-medium text-peacock">{applied} applied. You save {inr(t.discount)}.</p>}
          </div>
          <button type="button" className="btn btn-primary mt-5 w-full" disabled={gone.length > 0} onClick={() => { setError(""); setStep(1); window.scrollTo({ top: 0 }); }}>
            Continue to details
          </button>
        </>
      )}
    </aside>
  );

  return (
    <div>
      <ol className="flex items-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2 sm:gap-3" aria-current={i === step ? "step" : undefined}>
            <span className={`grid h-7 w-7 place-items-center rounded-full ${i <= step ? "bg-peacock text-white" : "border border-line bg-white text-muted"}`}>{i + 1}</span>
            <span className={i <= step ? "text-ink" : "text-muted"}>{s}</span>
            {i < steps.length - 1 && <span className="h-px w-4 bg-line sm:w-10" aria-hidden />}
          </li>
        ))}
      </ol>
      <h1 className="display mt-6 text-5xl sm:text-6xl">{["Your bag", "Your details", "Payment"][step]}</h1>
      {error && <p role="alert" className="mt-5 rounded-lg bg-rose/10 px-4 py-3 text-sm font-medium text-rose">{error}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <div>
          {step === 0 && (
            <ul className="divide-y divide-line border-y border-line">
              {lines.map(({ l, index, p, unit }) => (
                <li key={index} className="flex gap-4 py-5">
                  <div className="w-24 shrink-0 sm:w-28">
                    {p?.media[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaSrc(p.media[0], 200)} width={p.media[0].width} height={p.media[0].height} alt="" className="photo" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="display text-2xl leading-tight">
                      {p ? <Link href={productHref(p)} className="hover:text-peacock">{p.name}</Link> : "No longer available"}
                    </h2>
                    {p && <p className="mt-1 text-sm text-muted">{p.colour} · {p.weave} · Code {p.code}</p>}
                    {p && p.stock < l.qty && <p className="mt-1 text-sm font-semibold text-rose">Just sold out. Please remove it to continue.</p>}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-semibold">{p ? inr(unit * l.qty) : ""}{l.qty > 1 ? ` (${l.qty})` : ""}</span>
                      <button type="button" onClick={() => removeLine(index)} className="min-h-11 px-1 text-sm font-semibold text-peacock underline underline-offset-4">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {step === 1 && (
            <form onSubmit={toPayment} className="rounded-xl bg-white p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="field-label" htmlFor="c-name">Full name</label><input id="c-name" className="field" required minLength={2} autoComplete="name" value={d.name} onChange={set("name")} /></div>
                <div><label className="field-label" htmlFor="c-phone">WhatsApp number</label><input id="c-phone" className="field" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={d.phone} onChange={set("phone")} /></div>
                <div className="sm:col-span-2"><label className="field-label" htmlFor="c-email">Email (optional)</label><input id="c-email" type="email" className="field" autoComplete="email" value={d.email} onChange={set("email")} /></div>
                <div><label className="field-label" htmlFor="c-soc">Society or building</label><input id="c-soc" className="field" placeholder="e.g. Gaur City 2" value={d.society} onChange={set("society")} /></div>
                <div><label className="field-label" htmlFor="c-tower">Tower and flat</label><input id="c-tower" className="field" placeholder="e.g. B-1204" value={d.tower} onChange={set("tower")} /></div>
                <div className="sm:col-span-2"><label className="field-label" htmlFor="c-line1">Street address</label><input id="c-line1" className="field" required autoComplete="street-address" value={d.line1} onChange={set("line1")} /></div>
                <div><label className="field-label" htmlFor="c-city">City</label><input id="c-city" className="field" required autoComplete="address-level2" value={d.city} onChange={set("city")} /></div>
                <div><label className="field-label" htmlFor="c-pin">Pincode</label><input id="c-pin" className="field" required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={d.pincode} onChange={(e) => setD((x) => ({ ...x, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} /></div>
              </div>
              {d.pincode.length === 6 && (
                <fieldset className="mt-6">
                  <legend className="field-label">Delivery</legend>
                  <div className="grid gap-2">
                    {slots.map((s) => (
                      <label key={s} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm ${slot === s ? "border-peacock bg-tint" : "border-line"}`}>
                        <input type="radio" name="slot" checked={slot === s} onChange={() => setSlot(s)} className="h-4 w-4 accent-[#0f4443]" /> {s}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-muted">
                <input type="checkbox" checked={d.consent} onChange={(e) => setD((x) => ({ ...x, consent: e.target.checked }))} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0f4443]" />
                <span>{site.consentText}</span>
              </label>
              <p className="mt-2 text-xs text-muted">Order updates are sent on WhatsApp either way.</p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back to bag</button>
                <button type="submit" className="btn btn-primary">Continue to payment</button>
              </div>
            </form>
          )}

          {step === 2 && payments === "off" && (
            <div className="rounded-xl bg-white p-5 sm:p-7">
              <h2 className="display text-3xl">Send your order on WhatsApp</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Online payment opens soon. Send us your order on WhatsApp: we confirm the piece is yours and share a UPI or card payment link there.
              </p>
              <div className="mt-5 rounded-lg bg-mist p-4 text-sm leading-relaxed">
                <p className="font-semibold">{d.name} · {d.phone}</p>
                <p className="text-muted">{[d.tower, d.society, d.line1, d.city, d.pincode].filter(Boolean).join(", ")}</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={waLink([
                  "Hi! I would like to order:",
                  ...lines.filter((x) => x.p).map((x) => `• ${x.p!.name} (code ${x.p!.code}) × ${x.l.qty}, ${inr(x.unit * x.l.qty)}`),
                  `Total ${inr(t.total)}${applied ? ` with offer ${applied}` : ""}`,
                  `Name: ${d.name}, ${d.phone}`,
                  `Address: ${[d.tower, d.society, d.line1, d.city, d.pincode].filter(Boolean).join(", ")}`,
                ].join("\n"))}>Send order on WhatsApp · {inr(t.total)}</a>
              </div>
            </div>
          )}

          {step === 2 && payments !== "off" && !pending && (
            <div className="rounded-xl bg-white p-5 sm:p-7">
              <fieldset>
                <legend className="field-label">How would you like to pay?</legend>
                <div className="grid gap-2">
                  {([
                    ["upi", "UPI", "Recommended. GPay, PhonePe, Paytm or any UPI app."],
                    ["card", "Card or net banking", "Credit card, debit card or your bank."],
                  ] as const).map(([v, label, note]) => {
                    return (
                      <label key={v} className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer ${method === v ? "border-peacock bg-tint" : "border-line"}`}>
                        <input type="radio" name="method" checked={method === v} onChange={() => setMethod(v)} className="h-4 w-4 accent-[#0f4443]" />
                        <span><span className="block text-sm font-semibold">{label}</span><span className="block text-sm text-muted">{note}</span></span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-5 rounded-lg bg-mist p-4 text-sm leading-relaxed">
                <p className="font-semibold">{d.name} · {d.phone}</p>
                <p className="text-muted">{[d.tower, d.society, d.line1, d.city, d.pincode].filter(Boolean).join(", ")}</p>
                <p className="text-muted">{slot}</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>Back</button>
                <button type="button" className="btn btn-primary" onClick={pay} disabled={busy}>
                  {busy ? "Please wait..." : `Pay ${inr(t.total)}`}
                </button>
              </div>
            </div>
          )}

          {step === 2 && pending && (
            <div className="rounded-xl border-2 border-dashed border-marigold bg-white p-5 sm:p-7" role="dialog" aria-label="Test payment">
              <p className="label text-amber">Test mode</p>
              <h2 className="display mt-2 text-3xl">Simulated payment</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Payment keys are not connected yet, so no money moves. Press the button to pretend the payment of {inr(t.total)} for order {pending} succeeded.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-primary" onClick={simulate} disabled={busy}>{busy ? "Please wait..." : "Simulate successful payment"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setPending("")} disabled={busy}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}
