import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { JsonLd } from "@/components/site/JsonLd";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { getProducts } from "@/lib/cms";
import { SITE } from "@/content/site";

// Brand page for searches such as "uni&core" or "unincore" (Google search improvement request, 2026-11-17).
// Facts only from the site content: products.ts and SITE.
export const metadata = pageMetadata({
  title: "About UNI&CORE USA | Korean Skincare Brand",
  description:
    "UNI&CORE is a Korean skincare brand. Find our vitamin C serum, sheet mask, enzyme cleanser and serum mist in the US on Amazon, TikTok Shop and our US store.",
  path: "/about",
  absoluteTitle: true,
});

export default async function AboutPage() {
  const products = await getProducts();
  return (
    <>
      <LegalPage title="About UNI&CORE USA" updated="November 17, 2026">
        <p>
          UNI&amp;CORE is a Korean skincare brand from {SITE.legalName}. Our motto is &ldquo;{SITE.tagline}&rdquo;. This site,
          promotion.unincore.com, is the official US site for UNI&amp;CORE skincare.
        </p>
        <h2>Our products in the US</h2>
        <ul>
          {products.map((p) => (
            <li key={p.slug}>
              <Link href={`/products/${p.slug}`}>{p.name}</Link>
              {p.tagline ? ` — ${p.tagline}` : ""} {p.shop?.kind === "tiktok" ? "(TikTok Shop)" : "(Amazon.com)"}
            </li>
          ))}
        </ul>
        <h2>Where to buy</h2>
        <ul>
          <li>
            <a href={SITE.amazonStore}>UNI&amp;CORE brand store on Amazon.com</a>: the vitamin C ampoule, sheet mask and enzyme powder wash
          </li>
          <li>TikTok Shop: the Hydrating Skin Barrier Serum Mist</li>
          <li>
            <a href={SITE.usStore}>UNI&amp;CORE US Official Store</a> ({SITE.usStore.replace("https://", "")})
          </li>
        </ul>
        <h2>Official channels</h2>
        <ul>
          <li>
            Korea official site: <a href={SITE.mainSite}>{SITE.mainSite.replace("https://", "")}</a>
          </li>
          {SITE.social.map((s) => (
            <li key={s}>
              <a href={s}>{s.replace("https://www.", "")}</a>
            </li>
          ))}
          <li>
            Skincare how-tos: <Link href="/guides">UNI&amp;CORE skincare guides</Link>
          </li>
        </ul>
      </LegalPage>
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])]} />
    </>
  );
}
