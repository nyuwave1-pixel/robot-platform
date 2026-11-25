import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/cms";
import { PrivacyChoicesLink } from "@/components/site/ConsentBanner";

export const metadata = pageMetadata({ title: "Privacy Policy | UNI&CORE USA", description: "How UNI&CORE's US promotion site collects, uses and protects information, and how to exercise your privacy choices.", path: "/privacy", absoluteTitle: true });

export default async function PrivacyPage() {
  const { contactEmail } = await getSettings();
  return (
    <LegalPage title="Privacy Policy" updated="November 3, 2026">
      <p>This policy explains how UNI&amp;CORE (&quot;we&quot;, &quot;us&quot;) handles information on promotion.unincore.com (the &quot;Site&quot;). The Site introduces our products and links to Amazon.com, where purchases are made. We do not sell products on this Site and do not collect payment information.</p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Usage data:</strong> pages viewed, buttons clicked (for example, &quot;Shop on Amazon&quot;), device type, and campaign parameters in the URL (such as utm_source or utm_campaign).</li>
        <li><strong>Cookies and similar technologies:</strong> if enabled, Google Analytics / Google Tag Manager and the Meta Pixel may set cookies to measure ad performance and site usage.</li>
        <li>We do not ask for your name, email, address or payment details on this Site.</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To understand which products and campaigns are most helpful to visitors.</li>
        <li>To measure and improve our advertising on platforms such as Facebook and Instagram.</li>
        <li>To keep the Site secure and working properly.</li>
      </ul>
      <h2>Purchases on Amazon</h2>
      <p>When you click through to Amazon.com, Amazon&apos;s own privacy notice applies. Amazon may share aggregated, non-identifying campaign reports with us through Amazon Attribution. We do not receive your Amazon account or order details.</p>
      <h2>Your privacy choices</h2>
      <p>You can opt out of the sale or sharing of personal information for targeted advertising at any time. We also honor the Global Privacy Control (GPC) browser signal as a valid opt-out. Residents of California, Colorado, Connecticut, Virginia, Texas, Oregon and other states with consumer privacy laws may have additional rights to access, correct or delete personal information.</p>
      <p><PrivacyChoicesLink className="font-semibold text-ink underline" /></p>
      <h2>Data retention</h2>
      <p>Aggregated statistics on this Site are kept for up to 400 days. Third-party tools retain data according to their own settings and policies.</p>
      <h2>Children</h2>
      <p>The Site is not directed to children under 13, and we do not knowingly collect information from them.</p>
      <h2>Contact</h2>
      <p>{contactEmail ? <>Questions about this policy: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</> : <>Questions about this policy can be sent through the <a href="/contact">Contact</a> page.</>}</p>
    </LegalPage>
  );
}
