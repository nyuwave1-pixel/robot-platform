import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Disclaimer | UNI&CORE USA", description: "Cosmetic product, test result and Amazon pricing disclaimers for the UNI&CORE US promotion website.", path: "/disclaimer", absoluteTitle: true });

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="November 3, 2026">
      <h2>Cosmetic products</h2>
      <p>UNI&amp;CORE products are cosmetics. They are intended to cleanse, beautify and improve the appearance of the skin, and are not intended to diagnose, treat, cure or prevent any disease. These statements have not been evaluated by the Food and Drug Administration.</p>
      <h2>Test results</h2>
      <p>Where we show results from product testing, they describe the specific study conditions (such as panel size and duration) noted alongside the result. Individual results vary.</p>
      <h2>Before &amp; after images</h2>
      <p>Before-and-after images are shown only when they come from documented product testing or from customers who gave permission. Results are not guaranteed.</p>
      <h2>Patch testing</h2>
      <p>Always patch test a new product on a small area of skin. Discontinue use if irritation occurs and consult a dermatologist if it persists.</p>
      <h2>Amazon</h2>
      <p>Products are sold on Amazon.com. Prices, discounts, shipping and availability are set and displayed by Amazon. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.</p>
    </LegalPage>
  );
}
