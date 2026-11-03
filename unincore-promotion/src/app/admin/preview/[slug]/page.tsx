import { notFound } from "next/navigation";
import { getCmsFresh } from "@/lib/cms";
import { ProductLanding } from "@/components/product/ProductLanding";

/** Shows the page with pending (unverified) content flagged in red. Never cached or indexed. */
export default async function Preview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getCmsFresh();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <div className="-mx-5 -my-8 bg-ivory">
      <div className="bg-red-600 px-5 py-2 text-center text-xs font-semibold uppercase tracking-widest text-white">
        Admin preview — red badges mark content hidden from the public page until verified
      </div>
      <ProductLanding product={product} related={products.filter((p) => p.slug !== slug)} preview />
    </div>
  );
}
