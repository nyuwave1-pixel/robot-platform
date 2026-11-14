import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE } from "@/content/site";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
// Product landing pages: a Didone for headlines and figures (the packaging wordmark is a Didone), Hanken Grotesk for text.
const serif = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"], variable: "--font-serif", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "UNI&CORE | Korean Vitamin C Skincare", template: "%s" },
  description: "Korean vitamin C skincare by UNI&CORE — shop the ampoule, sheet mask and enzyme powder wash on Amazon.",
  applicationName: "UNI&CORE",
  formatDetection: { telephone: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      // Naver Search Advisor (public verification token, safe to commit).
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "d6e8ae1b4af4b612f3852297fa69a6c6dadf557f",
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }),
      ...(process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION && { "facebook-domain-verification": process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION }),
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF8F3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions (e.g. an HWP viewer) add attributes to <html> before React loads; ignore those on this one element.
    <html lang="en-US" className={`${display.variable} ${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
