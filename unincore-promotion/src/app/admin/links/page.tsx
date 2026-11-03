import { getCmsFresh } from "@/lib/cms";
import { SITE } from "@/content/site";
import { UtmBuilder } from "@/components/admin/UtmBuilder";

export default async function LinksPage() {
  const { products } = await getCmsFresh();
  return <UtmBuilder siteUrl={SITE.url} products={products.map((p) => ({ slug: p.slug, name: p.name, key: p.key }))} />;
}
