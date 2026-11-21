import type { Metadata } from "next";
import { delivery, site } from "@/config/site";
import { inr } from "@/lib/format";
import { Policy, Section } from "@/components/Policy";

export const metadata: Metadata = {
  title: "Shipping and returns",
  description: `How ${site.brand} ships across India, what delivery costs, and how 7-day returns and refunds work.`,
  alternates: { canonical: "/policies/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <Policy title="Shipping and returns" intro="Every piece is checked by hand and photographed in full before it ships, so what you see is what arrives.">
      <Section title="Where we deliver">
        <p>We deliver across India. Orders ship the next working day and usually arrive in 3 to 6 days, depending on your pincode.</p>
        <p>You will get your tracking details on WhatsApp once your parcel is on its way.</p>
      </Section>
      <Section title="Delivery charges">
        <p>Shipping is free on orders above {inr(delivery.freeShippingAbove)}. Below that, delivery costs {inr(delivery.shippingFee)}, shown before you pay.</p>
        <p>All prices include taxes. There is no cash on delivery: orders are paid by UPI or card.</p>
      </Section>
      <Section title="Returns within 7 days">
        <p>If a piece is not right for you, tell us on WhatsApp within 7 days of delivery and we will arrange the pickup.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The piece should be unused, unwashed and unaltered, with its tags and original packing.</li>
          <li>We sell unstitched fabric and sarees. Fabric that has been cut, stitched or had a fall or pico added cannot be returned.</li>
          <li>Please share your order number and a photo of the piece when you write to us.</li>
        </ul>
      </Section>
      <Section title="Refunds">
        <p>Once the piece reaches us and passes a quick check, we refund the full price to your original payment method. The bank usually shows it within 5 to 7 working days.</p>
        <p>If a piece sells out while you are paying, we refund you in full straight away.</p>
      </Section>
      <Section title="Damaged or wrong piece">
        <p>If your parcel arrives damaged or with the wrong piece, message us within 48 hours of delivery with photos of the parcel and the piece. We will replace it if the same piece is available, or refund you in full, and the return pickup is free.</p>
      </Section>
      <Section title="Colours">
        <p>We photograph every piece in daylight. Screens vary a little, so a shade can look slightly different on your phone. If you are unsure, ask us for a video on WhatsApp before you order.</p>
      </Section>
    </Policy>
  );
}
