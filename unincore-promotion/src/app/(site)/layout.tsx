import { getProducts, getSettings } from "@/lib/cms";
import { TrackingScripts } from "@/components/site/TrackingScripts";
import { ConsentBanner } from "@/components/site/ConsentBanner";
import { RevealProvider } from "@/components/site/RevealProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { LANDING } from "@/content/landing";
import { JsonLd } from "@/components/site/JsonLd";
import { consentDefaultSnippet } from "@/lib/consent-snippet";
import { organizationLd, websiteLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, products] = await Promise.all([getSettings(), getProducts()]);
  return (
    <>
      {/* Must run before any tag: defines gtag + Consent Mode defaults (honors GPC). */}
      <script dangerouslySetInnerHTML={{ __html: consentDefaultSnippet(settings.consentMode, settings.tracking.gtmId ? undefined : settings.tracking.ga4Id) }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      {settings.announcement.enabled && settings.announcement.text && (
        <AnnouncementBar text={settings.announcement.text} banners={Object.fromEntries(products.map((p) => [`/products/${p.slug}`, LANDING[p.key].banner]))} />
      )}
      <Header products={products} />
      <main id="main">{children}</main>
      <Footer products={products} />
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <RevealProvider />
      <TrackingScripts tracking={settings.tracking} consentMode={settings.consentMode} />
      <ConsentBanner mode={settings.consentMode} />
    </>
  );
}
