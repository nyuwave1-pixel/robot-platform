import { seo } from "@/data/seo";
import { product } from "@/data/product";
import { localeMeta, locales } from "@/i18n/config";
import { getDict } from "@/i18n/dict";

/** RSS 2.0 피드 — 네이버 서치어드바이저 "RSS 제출" 및 일반 피드 리더용. 정적 생성. */
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const site = seo.siteUrl;
  const pub = new Date(`${seo.publishedAt}T00:00:00+09:00`).toUTCString();
  const ko = getDict("ko");
  const sections: { hash: string; title: string; desc: string }[] = [
    { hash: "#clinical", title: `${ko.copy.s04.h1a} ${ko.copy.s04.h1b} — 4주 인체적용시험`, desc: ko.clinicalList.filter((c) => c.verified).map((c) => `${c.label} ${c.value}${c.unitLabel}`).join(", ") },
    { hash: "#ingredients", title: "핵심 성분 4가지 — 인삼 PDRN · EGF 4GF · 아세틸헥사펩타이드-8 · 시카", desc: ko.ingredientsList.map((i) => `${i.name}: ${i.claim1} ${i.claim2}`).join(" / ") },
    { hash: "#how-to-use", title: `HOW TO USE — ${ko.howto.intro}`, desc: `${ko.howto.intro}. ${ko.howto.steps.map((s) => `${s.step} ${s.area}`).join(", ")}` },
  ];
  const items: string[] = [];
  for (const l of locales) {
    const d = getDict(l);
    const url = `${site}${localeMeta[l].path === "/" ? "/" : localeMeta[l].path}`;
    items.push(`<item><title>${esc(d.seoView.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${esc(d.seoView.description)}</description><pubDate>${pub}</pubDate><category>${esc(d.jsonld.keyIngredient)}</category></item>`);
  }
  for (const s of sections) {
    const url = `${site}/${s.hash}`;
    items.push(`<item><title>${esc(s.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${esc(s.desc)}</description><pubDate>${pub}</pubDate></item>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${esc(seo.siteName)}</title>
<link>${site}/</link>
<atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
<description>${esc(seo.description)}</description>
<language>ko-KR</language>
<copyright>${esc(product.brand)}</copyright>
<pubDate>${pub}</pubDate>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<ttl>1440</ttl>
<image><url>${site}/icon.png</url><title>${esc(seo.siteName)}</title><link>${site}/</link></image>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
