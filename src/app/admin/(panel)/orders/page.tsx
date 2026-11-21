import { Empty } from "@/components/admin/Empty";
import Link from "next/link";
import { inr } from "@/lib/format";
import { nextStatus } from "@/lib/orders";
import { listOrders } from "@/lib/store";
import { advanceOrder, cancelOrder } from "../../actions";

const tabs = [["", "All"], ["new", "New"], ["packed", "Packed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["pending_payment", "Unpaid"], ["cancelled", "Cancelled"]];
const label: Record<string, string> = { pending_payment: "Unpaid", new: "New", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const tone: Record<string, string> = { new: "bg-marigold text-ink", packed: "bg-tint text-peacock", shipped: "bg-peacock text-white", delivered: "bg-deep text-cream", pending_payment: "bg-line text-ink", cancelled: "bg-rose/15 text-rose" };
const verb: Record<string, string> = { packed: "Mark packed", shipped: "Mark shipped", delivered: "Mark delivered" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const all = await listOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;
  return (
    <div>
      <header><p className="label text-amber">Fulfilment</p><h1 className="display mt-1 text-[1.9rem] leading-tight sm:text-[2.15rem]">Orders</h1></header>
      <nav aria-label="Filter by status" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map(([s, l]) => (
          <Link key={s} href={s ? `/admin/orders?status=${s}` : "/admin/orders"} aria-current={s === status ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${s === status ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}>
            {l} <span className="text-xs opacity-75">{s ? all.filter((o) => o.status === s).length : all.length}</span>
          </Link>
        ))}
      </nav>
      {orders.length === 0 && <Empty title="No orders here yet" text="Orders from the store and from WhatsApp land here, ready to pack and ship." action={{ href: "/", label: "View the store" }} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>} />}
      <ul className="mt-6 space-y-4">
        {orders.map((o) => {
          const next = nextStatus[o.status];
          return (
            <li key={o.id} className="rounded-2xl border border-line/70 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-semibold">{o.id}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[o.status]}`}>{label[o.status]}</span>
                    <span className="text-sm text-muted">{o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "cod_due" ? "Collect on delivery" : "Not paid"} · {o.paymentMethod.toUpperCase()}{o.paymentRef.startsWith("TEST") ? " · test" : ""}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {o.slot}</p>
                </div>
                <p className="display text-2xl">{inr(o.total)}</p>
              </div>
              <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm md:grid-cols-2">
                <ul className="space-y-2">
                  {o.items.map((i) => (
                    <li key={i.code} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.image && <img src={i.image} alt="" className="photo !w-11" loading="lazy" />}
                      <span><strong className="font-semibold">{i.code}</strong> · {i.name}{i.qty > 1 ? ` × ${i.qty}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="leading-relaxed">
                  <strong className="font-semibold">{o.customerName}</strong> · <a href={`tel:+${o.phone}`} className="underline underline-offset-4">+{o.phone}</a>
                  {" "}· <a href={`https://wa.me/${o.phone}`} target="_blank" rel="noopener noreferrer" className="font-medium text-wa underline underline-offset-4">WhatsApp</a><br />
                  <span className="text-muted">{[o.address.tower, o.address.society, o.address.line1, o.address.city, o.address.pincode].filter(Boolean).join(", ")}</span>
                </p>
              </div>
              {(next || ["new", "packed", "pending_payment"].includes(o.status)) && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
                  {next && <form action={advanceOrder}><input type="hidden" name="id" value={o.id} /><button className="btn btn-primary">{verb[next]}</button></form>}
                  {["new", "packed", "pending_payment"].includes(o.status) && (
                    <form action={cancelOrder}><input type="hidden" name="id" value={o.id} /><button className="btn btn-ghost">Cancel order</button></form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
