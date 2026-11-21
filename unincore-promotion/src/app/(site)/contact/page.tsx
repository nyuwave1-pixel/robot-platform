import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/cms";
import { SITE } from "@/content/site";

export const metadata = pageMetadata({ title: "Contact | UNI&CORE USA", description: "Get in touch with UNI&CORE about our Korean skincare, Amazon or TikTok Shop orders, or partnerships.", path: "/contact", absoluteTitle: true });

export default async function ContactPage() {
  const { contactEmail } = await getSettings();
  return (
    <LegalPage title="Contact" updated="November 17, 2026">
      <h2>Orders, shipping &amp; returns</h2>
      <p>Orders are placed and fulfilled through Amazon.com (vitamin C ampoule, sheet mask and enzyme powder wash) and TikTok Shop (serum mist). For order status, delivery or returns, please use <strong>Your Orders</strong> on Amazon or your order page in TikTok Shop, or contact the seller from the order details.</p>
      <h2>Product questions &amp; partnerships</h2>
      {contactEmail ? (
        <p>Email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. We usually reply within 2 business days.</p>
      ) : (
        <p>Visit our main brand site at <a href={SITE.mainSite}>{SITE.mainSite.replace("https://", "")}</a> for contact details.</p>
      )}
    </LegalPage>
  );
}
