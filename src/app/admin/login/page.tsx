import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Header";
import { Photo } from "@/components/Photo";
import { mediaFor } from "@/data/catalog";
import { currentAdmin } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Owner login", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  const look = mediaFor("n26")[0];
  return (
    <main id="main" className="min-h-screen bg-deep lg:grid lg:grid-cols-[1fr_1.1fr]">
      <div className="on-dark relative hidden items-center justify-center overflow-hidden bg-[#0b0b0b] p-12 lg:flex">
        {look && <Photo m={look} alt="" priority want={800} sizes="40vw" className="max-h-[86vh] !w-auto !rounded-none" />}
      </div>
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-mist p-7 shadow-2xl sm:p-9">
          <div className="text-center"><Logo /></div>
          <h1 className="display mt-7 text-center text-3xl">Owner studio</h1>
          <p className="mt-2 text-center text-sm text-muted">Add a piece in seconds. Pack and ship orders.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
