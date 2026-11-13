import { NextResponse } from "next/server";
import { DEFAULT_CONFIG } from "@/lib/appConfig";
import { loadConfig } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 클라이언트가 쓰는 공개 운영 설정 (보정값·제품 링크·보관 기간 등, 비밀 정보 없음) */
export async function GET() {
  try {
    return NextResponse.json(await loadConfig(), { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return NextResponse.json(DEFAULT_CONFIG);
  }
}
