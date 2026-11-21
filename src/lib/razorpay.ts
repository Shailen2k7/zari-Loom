// Razorpay over plain HTTPS (no SDK). Phase 1 runs in TEST mode only.
import "server-only";
import crypto from "node:crypto";

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const razorpayConfigured = Boolean(KEY_ID && KEY_SECRET);
export const razorpayKeyId = KEY_ID;
/** Simulated payments are for trying the flow only. They never run unless switched on on purpose (ALLOW_TEST_PAYMENTS=yes). */
export const testPaymentsAllowed = process.env.ALLOW_TEST_PAYMENTS === "yes";
/** razorpay: real checkout · test: simulated, no money moves · off: no online payment yet, orders go to WhatsApp. */
export const paymentMode: "razorpay" | "test" | "off" = razorpayConfigured ? "razorpay" : testPaymentsAllowed ? "test" : "off";

function assertAllowed() {
  // Live payments are an irreversible step: they stay blocked until the owner turns them on deliberately.
  if (KEY_ID.startsWith("rzp_live_") && process.env.RAZORPAY_ALLOW_LIVE !== "yes") {
    throw new Error("Live Razorpay keys are set but RAZORPAY_ALLOW_LIVE is not 'yes'. Refusing to take real payments.");
  }
}

export async function createGatewayOrder(amountRupees: number, receipt: string) {
  assertAllowed();
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error("Razorpay could not create the order (" + res.status + ")");
  return (await res.json()) as { id: string; amount: number };
}

const eq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Signature Razorpay Checkout returns to the browser after a payment. */
export function verifyPaymentSignature(gatewayOrderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${gatewayOrderId}|${paymentId}`).digest("hex");
  return eq(expected, signature);
}

/** Signature on webhook calls (uses the separate webhook secret, over the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!s) return false;
  const expected = crypto.createHmac("sha256", s).update(rawBody).digest("hex");
  return eq(expected, signature);
}
