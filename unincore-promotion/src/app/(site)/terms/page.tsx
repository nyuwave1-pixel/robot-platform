import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Terms of Use | UNI&CORE USA", description: "Terms that apply when you use the UNI&CORE US promotion website.", path: "/terms", absoluteTitle: true });

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="November 3, 2026">
      <p>By using promotion.unincore.com (the &quot;Site&quot;) you agree to these terms. If you do not agree, please do not use the Site.</p>
      <h2>Purpose of the Site</h2>
      <p>The Site provides information about UNI&amp;CORE products. All purchases are completed on Amazon.com and are governed by Amazon&apos;s Conditions of Use, pricing, shipping and return policies.</p>
      <h2>Prices and promotions</h2>
      <p>Promotions shown on the Site describe offers available on Amazon.com during the stated period. Final prices, discounts and availability are determined by Amazon at checkout and may change without notice.</p>
      <h2>Intellectual property</h2>
      <p>All content on the Site — including text, graphics, logos and images — is owned by or licensed to UNI&amp;CORE and may not be reused without permission.</p>
      <h2>Third-party links</h2>
      <p>The Site links to third-party sites such as Amazon.com. We are not responsible for the content or practices of those sites.</p>
      <h2>Disclaimer of warranties</h2>
      <p>The Site is provided &quot;as is&quot;. To the fullest extent permitted by law, we disclaim all warranties, express or implied, regarding the Site.</p>
      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, UNI&amp;CORE is not liable for any indirect, incidental or consequential damages arising from your use of the Site.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. The &quot;Last updated&quot; date shows when they were last changed.</p>
    </LegalPage>
  );
}
