import Link from "next/link";
import { site } from "@/config/site";
import { waLink } from "@/lib/format";
import { Logo } from "./Header";
import { WhatsApp } from "./Icons";
import { policies } from "./Policy";

export function Footer() {
  return (
    <footer className="on-dark bg-deep text-cream">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/80">
            A small weekly drop of Banarasi sarees, suits and dupattas. Each piece checked by hand, photographed in full, and delivered to your door.
          </p>
        </div>
        <nav aria-label="Shop">
          <h2 className="label text-marigold">Shop</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {[["Sarees", "/collection?category=saree"], ["Suit sets", "/collection?category=suit_set"], ["Suit fabric", "/collection?category=suit_fabric"], ["Dupattas", "/collection?category=dupatta"], ["Everything", "/collection"]].map(([l, h]) => (
              <li key={h}><Link href={h} className="inline-flex min-h-9 items-center text-cream/85 hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Help">
          <h2 className="label text-marigold">Help</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {[["Track an order", "/account"], ["Your bag", "/bag"], ["Wishlist", "/account#wishlist"], ...policies.map((p) => [p.label, p.href])].map(([l, h]) => (
              <li key={h}><Link href={h} className="inline-flex min-h-9 items-center text-cream/85 hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="label text-marigold">Be first to the drop</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/80">New pieces every {site.currentDrop.opens}. Join on WhatsApp and see them before anyone else.</p>
          <a href={waLink("Hi! Please add me to the weekly drop list.")} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-5">
            <WhatsApp /> Join on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <p className="wrap py-5 text-xs text-cream/65">
          © {new Date().getFullYear()} {site.brand}. Prices include all taxes. Colours are photographed in daylight; screens may vary slightly.
        </p>
      </div>
    </footer>
  );
}
