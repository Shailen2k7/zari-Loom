import type { Metadata } from "next";
import { site } from "@/config/site";
import { Policy, Section } from "@/components/Policy";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${site.brand} collects when you shop, why, and how to have it changed or deleted.`,
  alternates: { canonical: "/policies/privacy" },
};

export default function PrivacyPage() {
  return (
    <Policy title="Privacy" intro="We collect only what we need to deliver your order and to keep in touch if you ask us to. We never sell your details.">
      <Section title="What we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Your order details:</strong> name, mobile number, email (if you give one), delivery address and the pieces you buy.</li>
          <li><strong>Payment status:</strong> whether a payment went through. Card and UPI details are handled by our payment provider; we never see or store them.</li>
          <li><strong>Your WhatsApp choice:</strong> if you tick the box to hear about new drops, we save that you agreed, when, and the exact words you agreed to.</li>
          <li><strong>Messages:</strong> what you send us on WhatsApp, so we can help with your order.</li>
        </ul>
      </Section>
      <Section title="Why we use it">
        <p>To confirm and deliver your order, handle returns and refunds, answer your questions, and keep records the law asks us to keep.</p>
        <p>If you opted in, we send new drops and offers on WhatsApp, at most 2 messages a week. Reply STOP at any time and we stop straight away.</p>
      </Section>
      <Section title="Who we share it with">
        <p>Only the services that run the shop for us, and only what each needs:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>our payment provider, to take your payment;</li>
          <li>our courier partners, to deliver your parcel;</li>
          <li>our hosting and database providers, which store the shop&apos;s data securely;</li>
          <li>WhatsApp, when we message you there.</li>
        </ul>
        <p>We never sell or rent your details to anyone.</p>
      </Section>
      <Section title="Your bag and cookies">
        <p>Your bag, wishlist and saved address are kept in your own browser on your device, so they are there next time. We do not use advertising or tracking cookies.</p>
      </Section>
      <Section title="How long we keep it">
        <p>Order records are kept for as long as tax and accounting rules require. Marketing consent is kept until you reply STOP or ask us to delete it.</p>
      </Section>
      <Section title="Your choices">
        <p>You can ask us to show, correct or delete your details at any time by messaging us on WhatsApp. We will do it within 30 days, except for records we must keep by law.</p>
      </Section>
    </Policy>
  );
}
