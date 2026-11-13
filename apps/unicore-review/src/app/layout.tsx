import type { Metadata, Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";

/** 구매 후기 이벤트 사이트 루트 레이아웃 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://unipromotion.unincore.com";
const title = "벌스데이 크림 구매 후기 이벤트 | UNI&CORE 1ST BIRTHDAY CREAM";
const description = "유니앤코어 퍼스트 벌스데이 크림 구매 후기를 남겨 주세요. 참여자 전원 프로틴 쉐이크 1박스, 우수 후기 3명에게 1ST BIRTHDAY CREAM 을 드립니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title, description,
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: { type: "website", locale: "ko_KR", url: SITE, siteName: "UNI&CORE 1ST BIRTHDAY CREAM", title, description, images: [{ url: "/og/og-1200x630.jpg", width: 1200, height: 630, alt: "UNI&CORE 1ST BIRTHDAY CREAM" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og/og-1200x630.jpg"] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#080706", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

const fontCss = [
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap",
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
];

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-locale="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {fontCss.map((h) => <link key={h} rel="preload" as="style" href={h} />)}
        <script dangerouslySetInnerHTML={{ __html: `(function(){${JSON.stringify(fontCss)}.forEach(function(h){var l=document.createElement("link");l.rel="stylesheet";l.href=h;l.media="print";l.onload=function(){this.media="all"};document.head.appendChild(l)})})();` }} />
        <noscript>{fontCss.map((h) => <link key={h} rel="stylesheet" href={h} />)}</noscript>
        <link rel="preload" as="image" href="/media/product/spotlight_jar_poster.webp" />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
