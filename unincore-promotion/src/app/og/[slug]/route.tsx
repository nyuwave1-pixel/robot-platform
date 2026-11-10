import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { GUIDES } from "@/content/guides";
import { BRAND } from "@/data/brand";
import { SCENES } from "@/data/scenes";

/**
 * Stable Open Graph images (link previews in KakaoTalk, Instagram, iMessage …):
 * /og/home and /og/<product-slug>. Rendered once at build time in the site's
 * obsidian + gold look, with the official product photos (never a rendered stand-in).
 * Override per product with a real photo via CMS → SEO → OG image URL.
 */
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ slug: "home" }, ...DEFAULT_PRODUCTS.map((p) => ({ slug: p.slug })), ...GUIDES.map((g) => ({ slug: g.slug }))];
}

const size = { width: 1200, height: 630 };
const ASSETS = path.join(process.cwd(), "src/app/og/assets");
const GOLD = "#E9B94D";
const IVORY = "#F6EFE2";

const asset = (name: string) => readFile(path.join(ASSETS, name));
const photo = async (key: string) => `data:image/png;base64,${(await asset(`${key}.png`)).toString("base64")}`;

async function fonts() {
  const [regular, italic] = await Promise.all([asset("cormorant-garamond-latin-500-normal.woff"), asset("cormorant-garamond-latin-500-italic.woff")]);
  return [
    { name: "Cormorant", data: regular, weight: 500 as const, style: "normal" as const },
    { name: "Cormorant", data: italic, weight: 500 as const, style: "italic" as const },
  ];
}

const Logo = () => (
  <div style={{ display: "flex", fontSize: 30, letterSpacing: 9, color: IVORY }}>
    <span>UNI</span>
    <span style={{ color: GOLD, fontStyle: "italic" }}>&amp;</span>
    <span>CORE</span>
  </div>
);

const Card = ({ src, h, rotate = 0, shift = 0 }: { src: string; h: number; rotate?: number; shift?: number }) => (
  <div
    style={{
      display: "flex",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 30px 70px rgba(0,0,0,0.65), 0 0 60px rgba(233,185,77,0.25)",
      border: "1px solid rgba(233,185,77,0.35)",
      transform: `translateY(${shift}px) rotate(${rotate}deg)`,
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} height={h} width={Math.round(h * 0.8)} alt="" style={{ objectFit: "cover" }} />
  </div>
);

const frame = {
  width: "100%",
  height: "100%",
  display: "flex",
  padding: "64px 72px",
  fontFamily: "Cormorant",
  color: IVORY,
  background: "radial-gradient(ellipse 70% 90% at 78% 50%, #3a2a10 0%, #17120b 45%, #0b0907 100%)",
} as const;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = DEFAULT_PRODUCTS.find((x) => x.slug === slug);
  const opts = { ...size, fonts: await fonts() };

  // Guide share image: built automatically for every guide in src/content/guides.ts.
  const guide = GUIDES.find((x) => x.slug === slug);
  if (guide) {
    const img = await photo(guide.products[0]);
    return new ImageResponse(
      (
        <div style={frame}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "62%" }}>
            <Logo />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: GOLD }}>KOREAN SKINCARE GUIDE</div>
              <div style={{ display: "flex", fontSize: guide.h1.length > 34 ? 60 : 72, lineHeight: 1.02, marginTop: 16, fontStyle: "italic" }}>{guide.h1}</div>
            </div>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: GOLD }}>SHOP ON AMAZON.COM</div>
          </div>
          <div style={{ display: "flex", width: "38%", alignItems: "center", justifyContent: "flex-end" }}>
            <Card src={img} h={450} />
          </div>
        </div>
      ),
      opts,
    );
  }

  if (!p) {
    const [wash, mask, ampoule] = await Promise.all([photo("wash"), photo("mask"), photo("ampoule")]);
    return new ImageResponse(
      (
        <div style={frame}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "46%" }}>
            <Logo />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 21, letterSpacing: 6, color: GOLD }}>THE VITA C COLLECTION</div>
              <div style={{ display: "flex", flexDirection: "column", fontSize: 80, lineHeight: 0.98, marginTop: 18 }}>
                <span>{BRAND.hero.headline[0]}</span>
                <span style={{ fontStyle: "italic", color: GOLD }}>{BRAND.hero.headline[1]}</span>
              </div>
              <div style={{ display: "flex", fontSize: 30, marginTop: 22, color: "rgba(246,239,226,0.8)" }}>{BRAND.intro.reveal}</div>
            </div>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: GOLD }}>NOW ON AMAZON.COM</div>
          </div>
          <div style={{ display: "flex", width: "54%", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <Card src={wash} h={205} rotate={-5} shift={26} />
            <Card src={mask} h={240} />
            <Card src={ampoule} h={205} rotate={5} shift={26} />
          </div>
        </div>
      ),
      opts,
    );
  }

  const s = SCENES[p.key];
  const img = await photo(p.key);
  return new ImageResponse(
    (
      <div style={frame}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "60%" }}>
          <Logo />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: GOLD }}>{`${s.step.toUpperCase()} — ${s.verb.toUpperCase()}`}</div>
            <div style={{ display: "flex", fontSize: 80, lineHeight: 1, marginTop: 16, fontStyle: "italic" }}>{s.headline}</div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 22, color: "rgba(246,239,226,0.85)" }}>{p.name}</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: GOLD }}>SHOP ON AMAZON.COM</div>
        </div>
        <div style={{ display: "flex", width: "40%", alignItems: "center", justifyContent: "flex-end" }}>
          <Card src={img} h={470} />
        </div>
      </div>
    ),
    opts,
  );
}
