import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { seo } from "@/data/seo";
import { product } from "@/data/product";
import { hreflangMap, isLocale, localeMeta, locales, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/dict";

/** 언어 세그먼트 — ko(/ 로 리라이트) · en · zh 만 정적 생성 */
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ko";
  const d = getDict(locale);
  const sv = d.seoView;
  const url = `${seo.siteUrl}${sv.path === "/" ? "" : sv.path}`;
  return {
    metadataBase: new URL(seo.siteUrl),
    title: { default: sv.title, template: `%s | ${seo.shortTitle}` },
    description: sv.description,
    keywords: [...sv.keywords],
    applicationName: seo.siteName,
    authors: [{ name: d.product.brandLocal, url: product.urls.brand }],
    creator: d.product.brandLocal,
    publisher: d.product.brandLocal,
    category: "beauty",
    classification: "Skincare · Cream",
    referrer: "origin-when-cross-origin",
    formatDetection: { telephone: false, email: false, address: false },
    alternates: { canonical: sv.path, languages: hreflangMap() },
    openGraph: {
      type: "website",
      locale: sv.locale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].og),
      url,
      siteName: seo.siteName,
      title: sv.title,
      description: sv.description,
      images: [
        { url: seo.ogImage, width: 1200, height: 630, alt: sv.ogAlt, type: "image/jpeg" },
        { url: seo.ogImageSquare, width: 1200, height: 1200, alt: `${product.brand} ${product.name}`, type: "image/jpeg" },
      ],
    },
    twitter: { card: "summary_large_image", title: sv.title, description: sv.description, images: [seo.ogImage] },
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
      "article:author": d.product.brandLocal,
      "format-detection": "telephone=no",
    },
  };
}

export const viewport: Viewport = { themeColor: "#080706", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children, params }: { children: React.ReactNode } & Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={localeMeta[locale].htmlLang} data-locale={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap" />
        {locale === "zh" && (
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@200;300;400;500;600;700&display=swap" />
        )}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="preload" as="image" href="/media/detail/d01_candle_1st.webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
