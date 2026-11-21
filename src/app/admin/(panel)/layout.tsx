import type { Metadata } from "next";
import Link from "next/link";
import { SideNav, TabBar } from "@/components/admin/AdminNav";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/session";
import { listOrders, usingSupabase } from "@/lib/store";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const who = await requireAdmin();
  const orders = await listOrders();
  const badges = {
    "/admin/orders": orders.filter((o) => o.status === "new").length,
  };
  const [a, b] = site.brand.split("&").map((s) => s.trim());
  return (
    <div className="admin min-h-screen bg-[#f5f4ef] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="on-dark hidden bg-deep text-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-4 lg:py-7">
        <Link href="/admin" className="px-3.5">
          <span className="display block text-[1.7rem] leading-none">{a} <em className="text-marigold">&amp;</em> {b}</span>
          <span className="label mt-2 block text-xs text-cream/50">Owner studio</span>
        </Link>
        <Link href="/admin/products#add" className="btn btn-gold mx-1 mt-8 !min-h-12 !rounded-xl !normal-case !tracking-normal !text-[0.9375rem]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          Add a piece
        </Link>
        <div className="mt-7"><SideNav badges={badges} /></div>
        <div className="mt-auto space-y-3 px-3.5">
          <a href="/" target="_blank" rel="noopener" className="flex min-h-10 items-center gap-2 text-sm text-cream/70 hover:text-cream">View the store ↗</a>
          <div className="border-t border-cream/10 pt-4">
            <p className="truncate text-xs text-cream/50">Signed in as {who}</p>
            <form action={logout}><button className="mt-1 min-h-10 text-sm font-medium text-cream/85 hover:text-cream">Sign out</button></form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="on-dark sticky top-0 z-30 flex items-center justify-between bg-deep px-4 py-3 text-cream lg:hidden">
          <Link href="/admin" className="display text-xl">{a} <em className="text-marigold">&amp;</em> {b}</Link>
          <form action={logout}><button className="min-h-10 px-2 text-sm text-cream/80">Sign out</button></form>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
          {!usingSupabase && (
            <p className="mb-7 flex items-start gap-3 rounded-xl border border-marigold/50 bg-marigold/10 px-4 py-3 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-marigold" />
              <span><strong className="font-semibold">Local demo mode.</strong> Everything is saved on this computer. Connect Supabase before going live.</span>
            </p>
          )}
          {children}
        </main>
      </div>
      <TabBar badges={badges} />
    </div>
  );
}
