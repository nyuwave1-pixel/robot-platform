import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/cms";
import { SITE } from "@/content/site";

export const metadata = pageMetadata({ title: "Contact | UNI&CORE USA", description: "Get in touch with UNI&CORE about our Korean vitamin C skincare, Amazon orders or partnerships.", path: "/contact", absoluteTitle: true });

export default async function ContactPage() {
  const { contactEmail } = await getSettings();
  return (
    <LegalPage title="Contact" updated="November 3, 2026">
      <h2>Orders, shipping &amp; returns</h2>
      <p>All orders are placed and fulfilled through Amazon.com. For order status, delivery or returns, please use <strong>Your Orders</strong> on Amazon, or contact the seller from the order details page.</p>
      <h2>Product questions &amp; partnerships</h2>
      {contactEmail ? (
        <p>Email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. We usually reply within 2 business days.</p>
      ) : (
        <p>Visit our main brand site at <a href={SITE.mainSite}>{SITE.mainSite.replace("https://", "")}</a> for contact details.</p>
      )}
    </LegalPage>
  );
}
