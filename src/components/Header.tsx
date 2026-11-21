import Link from "next/link";
import { site } from "@/config/site";
import { waLink } from "@/lib/format";
import { ChromeHeight } from "./ChromeHeight";
import { HeaderCounts } from "./HeaderCounts";
import { Search, User, WhatsApp } from "./Icons";

const nav = [
  { href: "/collection?category=saree", label: "Sarees" },
  { href: "/collection?category=anarkali", label: "Anarkalis" },
  { href: "/collection?category=suit_set", label: "Suit sets" },
  { href: "/collection?category=suit_fabric", label: "Fabric" },
  { href: "/collection?category=dupatta", label: "Dupattas" },
  { href: "/collection?occasion=bride", label: "Bridal" },
];

export function Logo({ light = false }: { light?: boolean }) {
  const [a, b] = site.brand.split("&").map((s) => s.trim());
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className={`display text-[1.7rem] font-semibold tracking-tight md:text-[2rem] ${light ? "text-cream" : "text-peacock"}`}>
        {b ? (<>{a} <em className={`font-normal ${light ? "text-marigold" : "text-amber"}`}>&amp;</em> {b}</>) : site.brand}
      </span>
      <span className={`label mt-1 text-xs ${light ? "text-cream/70" : "text-muted"}`}>{site.tagline}</span>
    </span>
  );
}

export function Header() {
  return (
    <>
      <ChromeHeight />
      <p data-chrome className="bg-deep px-4 py-2 text-center text-[0.8125rem] font-medium text-cream/90">
        Shipping across India<span className="hidden sm:inline"> · Free above ₹2,999</span> · 7-day returns
      </p>
      <header data-chrome className="sticky top-0 z-40 border-b border-line bg-mist/95 backdrop-blur">
        <div className="wrap grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2.5 md:py-3">
          <nav aria-label="Main" className="hidden items-center gap-5 lg:flex xl:gap-7">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap text-[0.9375rem] font-semibold text-ink underline-offset-8 hover:text-peacock hover:underline">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center lg:hidden">
            <Link href="/collection" aria-label="Search the collection" className="grid h-11 w-11 place-items-center"><Search /></Link>
          </div>
          <Link href="/" aria-label={`${site.brand} home`} className="justify-self-center"><Logo /></Link>
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <Link href="/collection" aria-label="Search the collection" className="hidden h-11 w-11 place-items-center lg:grid"><Search /></Link>
            <Link href="/account" aria-label="Your account" className="hidden h-11 w-11 place-items-center sm:grid"><User /></Link>
            <HeaderCounts />
            <a href={waLink("Hi! I would like to see the new drop.")} target="_blank" rel="noopener noreferrer"
              className="btn btn-wa ml-2 hidden !min-h-10 !px-4 !py-2 md:inline-flex">
              <WhatsApp width={17} height={17} /> WhatsApp
            </a>
          </div>
        </div>
        <nav aria-label="Categories" className="no-scrollbar flex gap-5 overflow-x-auto border-t border-line px-4 lg:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-11 shrink-0 items-center text-[0.9375rem] font-semibold">{n.label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
