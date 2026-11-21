"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  home: <path d="M4 11.5 12 4.5l8 7V20h-5.5v-5h-5v5H4z" />,
  orders: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  pieces: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  trials: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  people: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.8-3.2 3-4.6 5.5-4.6s4.7 1.4 5.5 4.6" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17 14.6c1.8.5 3 1.9 3.5 4.4" /></>,
};
export const adminNav = [
  { href: "/admin", label: "Today", icon: I.home },
  { href: "/admin/products", label: "Pieces", icon: I.pieces },
  { href: "/admin/orders", label: "Orders", icon: I.orders },
  { href: "/admin/customers", label: "Customers", icon: I.people },
];

function Icon({ d }: { d: React.ReactNode }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>;
}

export function SideNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="space-y-1">
      {adminNav.map((n) => {
        const on = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[0.9375rem] transition ${on ? "bg-cream/12 font-medium text-cream" : "text-cream/70 hover:bg-cream/6 hover:text-cream"}`}>
            <span className={on ? "text-marigold" : ""}><Icon d={n.icon} /></span>
            {n.label}
            {badges[n.href] ? <span className="ml-auto rounded-full bg-marigold px-2 py-0.5 text-xs font-semibold text-ink">{badges[n.href]}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone: an app-style tab bar at the bottom, with the add button in the middle. */
export function TabBar({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const items = [adminNav[0], adminNav[1], null, adminNav[2], adminNav[3]];
  return (
    <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((n, i) => n ? (
        <Link key={n.href} href={n.href}
          className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-xs font-medium ${(n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)) ? "text-peacock" : "text-muted"}`}>
          <Icon d={n.icon} />{n.label}
          {badges[n.href] ? <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-marigold" /> : null}
        </Link>
      ) : (
        <Link key={i} href="/admin/products#add" aria-label="Add a piece" className="flex items-center justify-center">
          <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-marigold text-ink shadow-lg ring-4 ring-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          </span>
        </Link>
      ))}
    </nav>
  );
}
