import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { Policy, Section } from "@/components/Policy";

export const metadata: Metadata = {
  title: "Terms",
  description: `The terms for buying from ${site.brand}: orders, prices, payment, delivery and returns.`,
  alternates: { canonical: "/policies/terms" },
};

export default function TermsPage() {
  return (
    <Policy title="Terms" intro={`These terms apply when you buy from ${site.brand}, on this website or on WhatsApp. Placing an order means you accept them.`}>
      <Section title="What we sell">
        <p>Banarasi sarees, unstitched suit fabric, unstitched suit sets, Anarkali fabric and dupattas. Pieces shown on a model were made up for the photo so you can see the fall; you receive unstitched fabric. We do not offer stitching or tailoring.</p>
        <p>We describe only what we can verify. Claims about fibre or certification are made only for pieces that carry a certificate.</p>
      </Section>
      <Section title="One of one">
        <p>Most pieces are one of a kind. A piece is yours once your payment is confirmed. If it sells out while you are paying, we refund you in full.</p>
      </Section>
      <Section title="Prices and payment">
        <p>Prices are in Indian rupees and include all taxes. Delivery charges, if any, are shown before you pay. We take UPI and cards; there is no cash on delivery.</p>
        <p>If a price is shown wrongly by mistake, we will tell you before shipping and you can cancel for a full refund.</p>
      </Section>
      <Section title="Delivery, returns and refunds">
        <p>These are set out in our <Link href="/policies/shipping-returns" className="font-medium text-peacock underline underline-offset-4">Shipping and returns</Link> policy.</p>
      </Section>
      <Section title="Cancelling an order">
        <p>You can cancel any time before your order ships by messaging us on WhatsApp, and we refund you in full. Once it has shipped, please use a return instead.</p>
      </Section>
      <Section title="Your details">
        <p>How we use your details is explained in our <Link href="/policies/privacy" className="font-medium text-peacock underline underline-offset-4">Privacy</Link> policy.</p>
      </Section>
      <Section title="Law">
        <p>These terms are governed by the laws of India. If something goes wrong, please talk to us first on WhatsApp; most things are sorted out in a message or two.</p>
      </Section>
    </Policy>
  );
}
