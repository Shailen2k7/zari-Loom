import type { Metadata, Viewport } from "next";
import { StudioWorker } from "@/components/admin/StudioApp";

// The owner studio installs as its own app ("Z&L Studio") on the phone's home screen.
export const metadata: Metadata = {
  manifest: "/studio.webmanifest",
  appleWebApp: { capable: true, title: "Z&L Studio", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/studio/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#082625" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <>{children}<StudioWorker /></>;
}
