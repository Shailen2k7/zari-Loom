import { productHref } from "@/lib/seo";
import Link from "next/link";
import { categories } from "@/config/site";
import { cardMedia, inr, stockLabel } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BuyOnWhatsApp } from "./BuyOnWhatsApp";
import { WhatsApp } from "./Icons";
import { Photo } from "./Photo";
import { WishButton } from "./WishButton";

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const cat = categories.find((c) => c.slug === p.category)?.singular ?? "";
  return (
    <article className="flex flex-col">
      <div className="cell">
        <Link href={productHref(p)} aria-label={`${p.name}, ${inr(p.price)}`} className="absolute inset-0 block">
          {cardMedia(p) && (
            <Photo fit m={cardMedia(p)} alt={`${p.name} in ${p.colour}`} priority={priority} want={480}
              sizes="(min-width: 1100px) 290px, (min-width: 768px) 31vw, 46vw" />
          )}
        </Link>
        <WishButton code={p.code} name={p.name} className="absolute right-0 top-0" />
      </div>
      <div className="flex flex-1 flex-col border-t border-line pt-3">
        <p className="label truncate text-amber">{cat} · {p.weave}</p>
        <h3 className="display mt-1 text-[1.3rem] leading-tight md:text-[1.45rem]">
          <Link href={productHref(p)} className="hover:text-peacock">{p.name}</Link>
        </h3>
        <p className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
          <span className="text-[0.95rem] font-semibold">{inr(p.price)}</span>
          {p.stock <= 3 && <span className="text-xs font-medium text-rose">{stockLabel(p.stock)}</span>}
        </p>
        <BuyOnWhatsApp p={{ code: p.code, name: p.name, category: p.category, colour: p.colour, weave: p.weave, price: p.price, media: cardMedia(p) ? [cardMedia(p)!] : [] }}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-wa underline-offset-4 hover:underline">
          <WhatsApp width={16} height={16} /> Buy on WhatsApp
        </BuyOnWhatsApp>
      </div>
    </article>
  );
}
