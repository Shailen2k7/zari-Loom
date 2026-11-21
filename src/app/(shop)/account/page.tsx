import type { Metadata } from "next";
import { Account } from "@/components/Account";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <div className="wrap py-10 md:py-14">
      <h1 className="display text-5xl sm:text-6xl">Your account</h1>
      <p className="mt-3 max-w-xl text-muted">Your orders, saved address and wishlist. No password needed.</p>
      <div className="mt-10"><Account /></div>
    </div>
  );
}
