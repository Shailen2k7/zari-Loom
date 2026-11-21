"use client";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { waLink } from "@/lib/format";
import { productMessage, useOrigin, type MsgProduct } from "@/lib/whatsapp";

/** "Buy on WhatsApp": opens a chat with the piece's name, code, price, page link and photo already written out. */
export function BuyOnWhatsApp({ p, className, children, ...rest }: { p: MsgProduct; className: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const origin = useOrigin();
  return (
    <a {...rest} href={waLink(productMessage(p, origin))} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
