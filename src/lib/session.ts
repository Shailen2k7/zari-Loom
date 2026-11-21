// Owner login session: a signed, httpOnly cookie. No session data is stored in the browser in the clear.
import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "store_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is missing or too short (need 32+ characters).");
  return s;
}
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("base64url");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function startSession(who: string) {
  const body = Buffer.from(JSON.stringify({ who, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
}
export async function endSession() {
  (await cookies()).delete(COOKIE);
}
export async function currentAdmin(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  try {
    const { who, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof who === "string" && Date.now() < exp ? who : null;
  } catch {
    return null;
  }
}
/** Use at the top of every admin page and every admin action. */
export async function requireAdmin(): Promise<string> {
  const who = await currentAdmin();
  if (!who) redirect("/admin/login");
  return who;
}
