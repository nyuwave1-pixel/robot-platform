import { getProducts, getSettings } from "@/lib/cms";
import { TrackingScripts } from "@/components/site/TrackingScripts";
import { ConsentBanner } from "@/components/site/ConsentBanner";
import { RevealProvider } from "@/components/site/RevealProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JsonLd } from "@/components/site/JsonLd";
import { consentDefaultSnippet } from "@/lib/consent-snippet";
import { organizationLd, websiteLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, products] = await Promise.all([getSettings(), getProducts()]);
  return (
    <>
      {/* Must run before any tag: defines gtag + Consent Mode defaults (honors GPC). */}
      <script dangerouslySetInnerHTML={{ __html: consentDefaultSnippet(settings.consentMode) }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      {settings.announcement.enabled && settings.announcement.text && (
        <div className="bg-cream text-center text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">
          <p className="container-site py-2">{settings.announcement.text}</p>
        </div>
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
