import type { Metadata, Viewport } from "next";
import "./globals.css";
import { seo } from "@/data/seo";
import { product } from "@/data/product";

export const metadata: Metadata = {
  metadataBase: new URL(seo.siteUrl),
  title: { default: seo.title, template: `%s | ${seo.shortTitle}` },
  description: seo.description,
  keywords: [...seo.keywords],
  applicationName: seo.siteName,
  authors: [{ name: product.brandKo, url: product.urls.brand }],
  creator: product.brandKo,
  publisher: product.brandKo,
  category: "beauty",
  classification: "Skincare · Cream",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "/", languages: { "ko-KR": "/", "x-default": "/" } },
  openGraph: {
    type: "website",
    locale: seo.locale,
    url: seo.siteUrl,
    siteName: seo.siteName,
    title: seo.title,
    description: seo.description,
    images: [
      { url: seo.ogImage, width: 1200, height: 630, alt: `${product.brandKo} ${product.nameKo} — ${product.subtitle}`, type: "image/jpeg" },
      { url: seo.ogImageSquare, width: 1200, height: 1200, alt: `${product.brand} ${product.name}`, type: "image/jpeg" },
    ],
  },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [seo.ogImage] },
  robots: {
    index: true, follow: true, nocache: false,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    ...(seo.verification.google ? { google: seo.verification.google } : {}),
    ...(seo.verification.naver ? { other: { "naver-site-verification": seo.verification.naver } } : {}),
  },
  other: {
    "og:image:secure_url": `${seo.siteUrl}${seo.ogImage}`,
    "article:author": product.brandKo,
    "format-detection": "telephone=no",
  },
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
        <link rel="preload" as="image" href="/media/detail/d01_candle_1st.webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
