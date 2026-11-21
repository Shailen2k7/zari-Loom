import Link from "next/link";
import { QuickAdd } from "@/components/admin/QuickAdd";
import { aiEnabled } from "@/lib/ai";
import { inr } from "@/lib/format";
import { razorpayConfigured } from "@/lib/razorpay";
import { listAudit, listContacts, listOrders, listProducts } from "@/lib/store";

const Card = ({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) => {
  const body = (
    <>
      <p className="label text-xs text-muted">{label}</p>
      <p className="display mt-3 text-[2.4rem] leading-none">{value}</p>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-line/70 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition";
  return href ? <Link href={href} className={`${cls} hover:-translate-y-0.5 hover:shadow-md`}>{body}</Link> : <div className={cls}>{body}</div>;
};
const box = "rounded-2xl border border-line/70 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] sm:p-6";

export default async function Overview() {
  const [orders, products, contacts, log] = await Promise.all([listOrders(), listProducts({ includeHidden: true }), listContacts(), listAudit()]);
  const today = new Date().toDateString();
  const real = orders.filter((o) => !["pending_payment", "cancelled"].includes(o.status));
  const todays = real.filter((o) => new Date(o.createdAt).toDateString() === today);
  const sales = todays.reduce((s, o) => s + o.total, 0);
  const aov = real.length ? real.reduce((s, o) => s + o.total, 0) / real.length : 0;
  const low = products.filter((p) => p.status !== "draft" && p.stock <= 1);
  const optIns = contacts.filter((c) => c.optInAt && !c.unsubscribedAt);
  const bySource = optIns.reduce<Record<string, number>>((m, c) => ((m[c.optInSource] = (m[c.optInSource] || 0) + 1), m), {});
  const toPack = orders.filter((o) => o.status === "new").length;

  return (
    <div>
      <header>
        <p className="label text-amber">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">{greeting()}</h1>
      </header>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card label="Sales today" value={inr(sales)} note={`${todays.length} ${todays.length === 1 ? "order" : "orders"}`} href="/admin/orders" />
        <Card label="To pack" value={String(toPack)} note="New orders waiting" href="/admin/orders?status=new" />
        <Card label="Live pieces" value={String(products.filter((p) => p.status === "live").length)} note={`${products.filter((p) => p.status === "draft").length} drafts`} href="/admin/products" />
        <Card label="Average order" value={inr(aov)} note={`${real.length} orders in all`} href="/admin/orders" />
      </div>
      <div className="mt-8"><QuickAdd aiOn={aiEnabled} big={false} /></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className={box}>
          <h2 className="display text-[1.6rem]">Needs you</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            <li className="flex min-h-12 items-center justify-between gap-3"><span>{toPack} new {toPack === 1 ? "order" : "orders"} to pack</span><Link href="/admin/orders?status=new" className="font-semibold text-peacock underline underline-offset-4">Open orders</Link></li>
            <li className="flex min-h-12 items-center justify-between gap-3"><span>{products.filter((p) => p.status === "draft").length} drafts awaiting approval</span><Link href="/admin/products?status=draft" className="font-semibold text-peacock underline underline-offset-4">Open drafts</Link></li>
          </ul>
        </section>

        <section className={box}>
          <h2 className="display text-[1.6rem]">Low stock</h2>
          {low.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing is running low.</p> : (
            <ul className="mt-3 max-h-56 divide-y divide-line overflow-y-auto text-sm">
              {low.map((p) => (
                <li key={p.code} className="flex min-h-11 items-center justify-between gap-3">
                  <span>{p.code} · {p.name}</span>
                  <span className={p.stock === 0 ? "font-semibold text-rose" : "text-muted"}>{p.stock === 0 ? "Sold out" : "1 left"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={box}>
          <h2 className="display text-[1.6rem]">WhatsApp opt-ins</h2>
          <p className="mt-1 text-sm text-muted">{optIns.length} people have agreed to receive drops.</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(bySource).map(([s, n]) => <li key={s} className="flex justify-between"><span className="capitalize">{s.replace("_", " ")}</span><span className="font-semibold">{n}</span></li>)}
            {optIns.length === 0 && <li className="text-muted">No opt-ins yet. They come from checkout and (from Phase 2) QR codes.</li>}
          </ul>
        </section>

        <section className={box}>
          <h2 className="display text-[1.6rem]">Connections</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            <li className="flex min-h-11 items-center justify-between"><span>Payments (Razorpay)</span><span className="font-semibold">{razorpayConfigured ? "Connected" : "Simulated test payments"}</span></li>
            <li className="flex min-h-11 items-center justify-between"><span>WhatsApp number and quality rating</span><span className="text-muted">Phase 2</span></li>
            <li className="flex min-h-11 items-center justify-between"><span>AI sales agent and chat handovers</span><span className="text-muted">Phase 3</span></li>
            <li className="flex min-h-11 items-center justify-between"><span>Courier (Shiprocket)</span><span className="text-muted">Phase 3</span></li>
            <li className="flex min-h-11 items-center justify-between"><span>Broadcasts and drop scheduler</span><span className="text-muted">Phase 4</span></li>
          </ul>
        </section>
      </div>

      <section className={`mt-6 ${box}`}>
        <h2 className="display text-[1.6rem]">Recent activity</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {log.slice(0, 12).map((e, i) => (
            <li key={i} className="grid gap-x-4 py-2.5 sm:grid-cols-[150px_150px_1fr]">
              <span className="text-muted">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="font-medium">{e.action}</span>
              <span className="text-muted">{e.detail}</span>
            </li>
          ))}
          {log.length === 0 && <li className="py-2 text-muted">Nothing yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
