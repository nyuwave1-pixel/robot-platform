import type { Metadata, Viewport } from "next";
import "./globals.css";
import { seo } from "@/data/seo";
import { product } from "@/data/product";

export const metadata: Metadata = {
  metadataBase: new URL(seo.siteUrl),
  title: { default: seo.title, template: `%s | ${product.brand}` },
  description: seo.description,
  keywords: [...seo.keywords],
  alternates: { canonical: "/" },
  openGraph: { title: seo.title, description: seo.description, url: seo.siteUrl, siteName: product.brand, locale: seo.locale, type: "website", images: [{ url: seo.ogImage, width: 1920, height: 1080, alt: `${product.brand} ${product.name}` }] },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [seo.ogImage] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#080706", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@400;500&display=swap" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
