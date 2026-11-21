import Link from "next/link";
import type { ReactNode } from "react";

/** A calm empty state: icon, one line of what will appear here, and the next useful step. */
export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-tint text-peacock">{icon}</span>
      <p className="display mt-4 text-xl">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <Link href={action.href} className="btn btn-ghost mt-5">{action.label}</Link>}
    </div>
  );
}
