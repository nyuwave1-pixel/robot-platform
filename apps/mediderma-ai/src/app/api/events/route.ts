import { NextResponse, after } from "next/server";
import { sanitizeEvent } from "@/lib/events";
import { getStore } from "@/server/store";
import { deviceType, forwardToPlatform } from "@/server/platform";

export const runtime = "nodejs";

/** 익명 이용 통계 수집. IP 는 저장하지 않고 CDN 이 붙여 준 국가 코드만 기록한다. */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 2000) return NextResponse.json({ ok: false }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ev = sanitizeEvent(body);
  if (!ev) return NextResponse.json({ ok: false }, { status: 400 });
  const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "ZZ").slice(0, 2).toUpperCase();
  // 통합 관리자(UNI&CORE) 익명 집계 전달 — 응답을 보낸 뒤 실행되어 이용자 대기 시간에 영향이 없다
  const ua = req.headers.get("user-agent");
  // 기기 종류는 브라우저가 보낸 값을 믿지 않고 서버가 판별한다
  if (ev.type === "visit") ev.props = { ...ev.props, device: deviceType(ua) };
  else if (ev.props) delete ev.props.device;
  after(() => forwardToPlatform(ev, country, ua));
  try {
    await (await getStore()).addEvent(ev, country);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
