import { ImageResponse } from "next/og";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { ACCENT } from "@/lib/accent";

/**
 * Stable Open Graph image URLs: /og/home and /og/<product-slug>.
 * Override per product with a real photo via CMS → SEO → OG image URL.
 */
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ slug: "home" }, ...DEFAULT_PRODUCTS.map((p) => ({ slug: p.slug }))];
}

const size = { width: 1200, height: 630 };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = DEFAULT_PRODUCTS.find((x) => x.slug === slug);

  if (!p) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #FBE3C2 0%, #FBF8F3 55%, #F9E1D5 100%)", padding: 72, fontFamily: "serif", color: "#1D1B18" }}>
          <div style={{ display: "flex", fontSize: 36, letterSpacing: 6, fontWeight: 600 }}>
            <span>UNI</span>
            <span style={{ color: "#E98A15", fontStyle: "italic" }}>&amp;</span>
            <span>CORE</span>
          </div>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1, maxWidth: 900 }}>Discover the Science of Beautiful Skin</div>
          <div style={{ display: "flex", fontSize: 26, fontFamily: "sans-serif", color: "#4A4540" }}>Korean vitamin C skincare · Available on Amazon.com</div>
        </div>
      ),
      size,
    );
  }

  const a = ACCENT[p.accent];
  const big = p.keyIngredient.match(/\d+(\.\d+)?%/)?.[0] ?? "C";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: `linear-gradient(135deg, ${a.hexLight} 0%, #FBF8F3 60%)`, padding: 72, fontFamily: "serif", color: "#1D1B18" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "68%" }}>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>
            <span>UNI</span>
            <span style={{ color: a.hex, fontStyle: "italic" }}>&amp;</span>
            <span>CORE</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#7A726A", fontFamily: "sans-serif" }}>{p.heroEyebrow}</div>
            <div style={{ display: "flex", fontSize: 68, lineHeight: 1.02, marginTop: 18 }}>{p.heroHeadline}</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, fontFamily: "sans-serif", color: "#4A4540" }}>{`${p.name} · Shop on Amazon`}</div>
        </div>
        <div style={{ display: "flex", width: "32%", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 280, height: 280, borderRadius: 999, background: a.hex, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 92, fontStyle: "italic" }}>{big}</div>
        </div>
      </div>
    ),
    size,
  );
}
