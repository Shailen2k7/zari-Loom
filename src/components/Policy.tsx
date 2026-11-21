import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { waLink } from "@/lib/format";

export const POLICY_UPDATED = "21 November 2026";

export const policies = [
  { href: "/policies/shipping-returns", label: "Shipping and returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
];

/** Shared layout for the policy pages: plain, readable, one column. */
export function Policy({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="wrap py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <span className="text-ink">{title}</span>
      </nav>
      <article className="mt-6 max-w-2xl">
        <h1 className="display text-[2.4rem] leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{intro}</p>
        <p className="mt-2 text-sm text-muted">Last updated {POLICY_UPDATED}</p>
        <div className="policy mt-8 space-y-8 leading-relaxed">{children}</div>
        <div className="mt-12 rounded-xl bg-white p-5 ring-1 ring-line">
          <p className="font-semibold">Questions?</p>
          <p className="mt-1 text-sm text-muted">
            Message us on WhatsApp at{" "}
            <a href={waLink("Hi! I have a question about my order.")} target="_blank" rel="noopener noreferrer" className="font-medium text-peacock underline underline-offset-4">
              +{site.whatsappNumber.replace(/^91/, "91 ")}
            </a>
            . We usually reply the same day.
          </p>
        </div>
        <nav aria-label="Other policies" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {policies.map((p) => (
            <Link key={p.href} href={p.href} className="font-medium text-peacock underline underline-offset-4">{p.label}</Link>
          ))}
        </nav>
      </article>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display text-2xl sm:text-[1.75rem]">{title}</h2>
      <div className="mt-3 space-y-3 text-ink/85">{children}</div>
    </section>
  );
}
