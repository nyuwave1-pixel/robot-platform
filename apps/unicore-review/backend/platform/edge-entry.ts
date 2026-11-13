// Supabase Edge Function 진입점 — build.mjs 가 이 파일을 묶어 supabase/functions/birthday-review/index.ts 를 만든다.
// @ts-nocheck
import { initDenoPlatform } from "./deno.ts";
import { handle } from "../src/app.ts";

Deno.serve(async (req) => {
  try { await initDenoPlatform(); }
  catch (e) {
    console.error("[review] init failed", String(e?.message || e).slice(0, 120));
    return new Response(JSON.stringify({ ok: false, error: { code: "UNAVAILABLE", message: "잠시 후 다시 시도해 주세요." } }), { status: 503, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": req.headers.get("origin") || "*" } });
  }
  return handle(req, "/birthday-review");
});
