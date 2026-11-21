import { listContacts, listOrders } from "@/lib/store";

export default async function CustomersPage() {
  const [contacts, orders] = await Promise.all([listContacts(), listOrders()]);
  const count = (phone: string) => orders.filter((o) => o.phone === phone && !["pending_payment", "cancelled"].includes(o.status)).length;
  return (
    <div>
      <header><p className="label text-amber">People</p><h1 className="display mt-2 text-4xl sm:text-5xl">Customers</h1></header>
      <p className="mt-2 max-w-2xl text-sm text-muted">Marketing messages can go only to people marked "Opted in". Each opt-in keeps the time, the source and the exact words the person agreed to.</p>
      {contacts.length === 0 && <p className="mt-10 text-muted">No customers yet.</p>}
      <ul className="mt-6 space-y-3">
        {contacts.map((c) => (
          <li key={c.phone} className="rounded-2xl border border-line/70 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)] p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold">{c.name || "No name"} · +{c.phone}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.unsubscribedAt ? "bg-rose/15 text-rose" : c.optInAt ? "bg-tint text-peacock" : "bg-line text-ink"}`}>
                {c.unsubscribedAt ? "Unsubscribed" : c.optInAt ? "Opted in" : "No marketing consent"}
              </span>
            </div>
            <p className="mt-1 text-muted">{c.society || "Society not given"} · {count(c.phone)} {count(c.phone) === 1 ? "order" : "orders"}</p>
            {c.optInAt && (
              <details className="mt-2">
                <summary className="min-h-9 cursor-pointer font-medium text-peacock">Consent record</summary>
                <dl className="mt-2 grid gap-1.5 rounded-lg bg-mist p-3 sm:grid-cols-[110px_1fr]">
                  <dt className="text-muted">When</dt><dd>{new Date(c.optInAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</dd>
                  <dt className="text-muted">Source</dt><dd className="capitalize">{c.optInSource.replace("_", " ")}</dd>
                  <dt className="text-muted">Agreed to</dt><dd>"{c.consentText}"</dd>
                </dl>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
