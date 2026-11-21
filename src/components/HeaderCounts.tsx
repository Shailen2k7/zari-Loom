"use client";
import Link from "next/link";
import { Bag, Heart } from "./Icons";
import { useShop } from "./Shop";

const Dot = ({ n }: { n: number }) =>
  n > 0 ? (
    <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-peacock px-1 text-xs font-bold text-white">{n}</span>
  ) : null;

export function HeaderCounts() {
  const { bag, wish } = useShop();
  const items = bag.reduce((s, l) => s + l.qty, 0);
  return (
    <>
      <Link href="/account#wishlist" aria-label={`Wishlist, ${wish.length} saved`} className="relative grid h-11 w-11 place-items-center">
        <Heart /><Dot n={wish.length} />
      </Link>
      <Link href="/bag" aria-label={`Bag, ${items} items`} className="relative grid h-11 w-11 place-items-center">
        <Bag /><Dot n={items} />
      </Link>
    </>
  );
}
