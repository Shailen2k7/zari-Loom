"use client";
import { Heart } from "./Icons";
import { useShop } from "./Shop";

export function WishButton({ code, name, className = "" }: { code: string; name: string; className?: string }) {
  const { wish, toggleWish } = useShop();
  const on = wish.includes(code);
  return (
    <button
      type="button"
      onClick={() => toggleWish(code)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={`grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white ${className}`}
    >
      <Heart width={20} height={20} fill={on ? "#a82e52" : "none"} stroke={on ? "#a82e52" : "currentColor"} />
    </button>
  );
}
