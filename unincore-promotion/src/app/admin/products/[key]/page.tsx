import { notFound } from "next/navigation";
import { getCmsFresh } from "@/lib/cms";
import { getSession } from "@/lib/admin-auth";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function EditProduct({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [{ products }, session] = await Promise.all([getCmsFresh(), getSession()]);
  const product = products.find((p) => p.key === key);
  if (!product || !session) notFound();
  return <ProductEditor key={product.key} product={product} role={session.role} />;
}
