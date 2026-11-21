import type { Metadata } from "next";
import { Checkout } from "@/components/Checkout";
import { paymentMode } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Your bag" };

export default function BagPage() {
  return <div className="wrap py-10 md:py-14"><Checkout payments={paymentMode} /></div>;
}
