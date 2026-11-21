// Price maths shared by the browser (live preview) and the server (the amount actually charged).
import { delivery, offers } from "@/config/site";

export const isNoida = (pincode: string) => (delivery.noidaPincodes as readonly string[]).includes(pincode.trim());

export function offerDiscount(code: string, subtotal: number): { amount: number; error: string } {
  const c = code.trim().toUpperCase();
  if (!c) return { amount: 0, error: "" };
  const o = offers[c];
  if (!o) return { amount: 0, error: "That code is not valid." };
  if (subtotal < o.minSubtotal) return { amount: 0, error: `This code needs a bag of ₹${o.minSubtotal.toLocaleString("en-IN")} or more.` };
  return { amount: o.amount, error: "" };
}

export function shippingFee(subtotalAfterDiscount: number, pincode: string) {
  if (isNoida(pincode)) return 0;
  return subtotalAfterDiscount >= delivery.freeShippingAbove ? 0 : delivery.shippingFee;
}

export function totals(subtotal: number, code: string, pincode: string) {
  const { amount: discount, error } = offerDiscount(code, subtotal);
  const shipping = subtotal > 0 ? shippingFee(subtotal - discount, pincode) : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, offerError: error };
}
