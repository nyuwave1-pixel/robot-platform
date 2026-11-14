"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { TrackingSettings } from "@/content/types";
import { captureAttribution, configureAnalytics, track, trackingAllowed } from "@/lib/analytics";

/**
 * Loads GTM or GA4 (with Google Consent Mode v2) and the Meta Pixel.
 * - GTM set → GA4 should be configured inside GTM (we don't load gtag twice).
 * - Meta Pixel only loads when ad tracking is allowed (no opt-out, no GPC).
 */
export function TrackingScripts({ tracking, consentMode }: { tracking: TrackingSettings; consentMode: "opt-out" | "opt-in" }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const firstView = useRef(true);
  // The tag libraries are heavy; load them on the first interaction or after a short pause so they
  // don't compete with first paint. Events sent before that wait in dataLayer and are delivered on load.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    const go = () => setReady(true);
    const timer = window.setTimeout(go, 3000);
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, go));
    };
  }, []);
  const { gtmId, ga4Id, metaPixelId } = tracking;
  configureAnalytics({ consentMode, tagMode: gtmId ? "gtm" : ga4Id ? "gtag" : "none" });

  useEffect(() => {
    const update = () => {
      const ok = trackingAllowed(consentMode);
      setAllowed(ok);
      const state = ok ? "granted" : "denied";
      window.gtag?.("consent", "update", { analytics_storage: state, ad_storage: state, ad_user_data: state, ad_personalization: state });
    };
    update();
    window.addEventListener("uc-consent", update);
    return () => window.removeEventListener("uc-consent", update);
  }, [consentMode]);

  // SPA page views (first-party + GA4 via dataLayer; GA4 config has send_page_view off).
  useEffect(() => {
    captureAttribution();
    track("page_view");
    // The Pixel base code sends the first PageView itself; only send for client-side navigations.
    if (!firstView.current) window.fbq?.("track", "PageView");
    firstView.current = false;
  }, [pathname]);

  return (
    <>
      {!ready ? null : gtmId ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : ga4Id ? (
        // gtag('js') + gtag('config') are emitted in <head> by consentDefaultSnippet.
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
      ) : null}
      {ready && metaPixelId && allowed && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

