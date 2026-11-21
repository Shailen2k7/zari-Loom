import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { ShopProvider } from "@/components/Shop";
import { site } from "@/config/site";
import "./globals.css";

// Playfair Display: rich, high-contrast serif with real weight (headlines, prices, the brand).
// Manrope: crisp modern sans for everything you read and tap. No hairline-thin weights anywhere.
const display = Playfair_Display({
  subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"],
  variable: "--font-display-face", display: "swap",
});
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body-face", display: "swap" });

const description =
  "Banarasi sarees, Anarkalis and suit sets woven in Varanasi, each shown on a model. Shipping across India. Buy online or on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Banarasi Sarees, Anarkalis & Suit Sets Online | ${site.brand}`, template: `%s | ${site.brand}` },
  description,
  applicationName: site.brand,
  keywords: ["Banarasi saree", "Banarasi sarees online", "Banarasi Anarkali", "Banarasi suit set", "Banarasi dupatta",
    "Varanasi saree", "zari saree", "bridal Banarasi saree", "saree shop Noida", "Banarasi saree Noida"],
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website", siteName: site.brand, locale: "en_IN", url: "/",
    title: `${site.brand} · Banarasi sarees, Anarkalis and suit sets`, description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${site.brand}: Banarasi sarees and Anarkalis on a model` }],
  },
  twitter: { card: "summary_large_image", title: `${site.brand} · Banarasi sarees, Anarkalis and suit sets`, description, images: ["/og.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { themeColor: "#082625", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <ShopProvider>{children}</ShopProvider>
      </body>
    </html>
  );
}
