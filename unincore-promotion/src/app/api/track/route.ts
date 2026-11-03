import { NextResponse, type NextRequest, after } from "next/server";
import { recordEvent, sanitize } from "@/lib/stats";
import { forwardToMetaCapi } from "@/lib/meta-capi";
import { getSettings } from "@/lib/cms";
import { SITE } from "@/content/site";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|preview|monitor/i;

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > 4096) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > 4096) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const t = sanitize(raw);
  if (!t) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  after(async () => {
    try {
      await recordEvent(t);
    } catch (err) {
      console.error("[track]", err);
    }
    const { tracking } = await getSettings();
    await forwardToMetaCapi(t, {
      pixelId: tracking.metaPixelId,
      ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined,
      ua,
      url: `${SITE.url}${t.path || "/"}`,
      fbp: req.cookies.get("_fbp")?.value,
      fbc: req.cookies.get("_fbc")?.value,
    });
  });
  return new NextResponse(null, { status: 204 });
}
