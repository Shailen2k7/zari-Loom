"use client";
import type { ReactNode } from "react";
import { waLink } from "@/lib/format";
import { productMessage, useOrigin, type MsgProduct } from "@/lib/whatsapp";

/** "Buy on WhatsApp": opens a chat with the piece's name, code, price, page link and photo already written out. */
export function BuyOnWhatsApp({ p, className, children }: { p: MsgProduct; className: string; children: ReactNode }) {
  const origin = useOrigin();
  return (
    <a href={waLink(productMessage(p, origin))} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
