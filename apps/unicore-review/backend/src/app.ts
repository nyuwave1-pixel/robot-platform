// 요청 진입점 — 고객용 공개 API(/public/*) + 관리자 API(/admin/*). 실행 환경(Edge Function / Node 시험)과 무관하다.
//   GET    /public/config          이벤트 상태·작성 기준·동의 문서
//   POST   /public/uploads?type=   사진 1장 업로드(본문=이미지 바이너리) → 업로드 번호·토큰
//   DELETE /public/uploads/:id     접수 전 사진 삭제 (x-br-upload-token)
//   POST   /public/submit          후기 접수 → 접수 번호
//   POST   /public/lookup          접수 번호 + 휴대폰 번호로 내 접수 확인
//   POST   /public/revise          수정 요청을 받은 후기 다시 제출
//   *      /admin/*                관리자 (routes.ts)
import { ok, fail, errorResponse, readJson, ApiError } from "./core.ts";
import { router } from "./router.ts";
import { registerPromoRoutes } from "./routes.ts";
import * as P from "./public.ts";

const BODY_LIMIT = 5.5 * 1024 * 1024;
const adminRouter = router("/admin");
registerPromoRoutes(adminRouter);

function cors(origin: string | null, kind: string): Record<string, string> {
  if (!origin || kind === "DENY") return { vary: "Origin" };
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-br-csrf, x-br-upload-token, x-br-filename",
    "access-control-expose-headers": "content-disposition",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}
function withHeaders(res: Response, extra: Record<string, string>): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  h.set("x-content-type-options", "nosniff");
  return new Response(res.body, { status: res.status, headers: h });
}
async function publicRoute(req: Request, url: URL, sub: string, kind: "PROD" | "TEST" | "DENY"): Promise<Response> {
  if (req.method === "GET" && sub === "/config") return ok(P.publicConfig(await P.eventBySlug()));
  if (req.method === "GET") return fail(404, "NOT_FOUND", "없는 경로입니다.");
  // 변경 요청: 허용 출처 + 전용 헤더 필수 (다른 사이트의 폼·스크립트로는 붙일 수 없다)
  if (kind === "DENY") fail(403, "ORIGIN", "허용되지 않은 출처입니다.");
  if (req.headers.get("x-br-csrf") !== "1") fail(403, "CSRF", "허용되지 않은 요청입니다.");
  const isTest = kind === "TEST";
  if (req.method === "POST" && sub === "/uploads") {
    if (Number(req.headers.get("content-length") || 0) > BODY_LIMIT) fail(413, "IMAGE_TOO_LARGE", "이미지 용량이 너무 큽니다.");
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length > BODY_LIMIT) fail(413, "IMAGE_TOO_LARGE", "이미지 용량이 너무 큽니다.");
    let filename = "";
    try { filename = decodeURIComponent(req.headers.get("x-br-filename") || ""); } catch { /* 이름 없이 저장 */ }
    return ok(await P.saveUpload(req, String(url.searchParams.get("type") || "").toUpperCase(), bytes, filename), 201);
  }
  const m = sub.match(/^\/uploads\/(\d+)$/);
  if (req.method === "DELETE" && m) return ok(await P.deleteUpload(Number(m[1]), req.headers.get("x-br-upload-token") || ""));
  if (req.method === "POST" && sub === "/submit") return ok(await P.submitReview(req, await readJson(req, 64 * 1024), isTest), 201);
  if (req.method === "POST" && sub === "/lookup") return ok(await P.lookup(req, await readJson(req, 4 * 1024)));
  if (req.method === "POST" && sub === "/revise") return ok(await P.revise(req, await readJson(req, 64 * 1024)));
  return fail(404, "NOT_FOUND", "없는 경로입니다.");
}

/** basePath: 함수가 붙는 경로 앞부분 (Supabase 는 "/birthday-review") */
export async function handle(req: Request, basePath = ""): Promise<Response> {
  const origin = req.headers.get("origin");
  const kind = P.originKind(origin);
  const headers = cors(origin, kind);
  if (req.method === "OPTIONS") return new Response(null, { status: kind === "DENY" ? 403 : 204, headers });
  const url = new URL(req.url);
  let path = url.pathname;
  const i = basePath ? path.indexOf(basePath) : -1;
  if (i >= 0) path = path.slice(i + basePath.length) || "/";
  try {
    if (path.startsWith("/public/") || path === "/public") return withHeaders(await publicRoute(req, url, path.slice("/public".length).replace(/\/$/, "") || "/", kind), headers);
    if (path.startsWith("/admin/") || path === "/admin") {
      const u2 = new URL(url.toString()); u2.pathname = path;
      // 본문 스트림을 그대로 넘기기 위해 URL 만 바꾼 요청을 만든다
      const r2 = new Request(u2.toString(), { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer() });
      return withHeaders(await adminRouter.handle(r2), headers);
    }
    if (path === "/" || path === "/health") return withHeaders(ok({ service: "unicore-birthday-review", time: new Date().toISOString() }), headers);
    return withHeaders(errorResponse(new ApiError(404, "NOT_FOUND", "없는 경로입니다.")), headers);
  } catch (e) {
    // 같은 번호로 동시에 들어온 접수 중 진 쪽 — 유일 인덱스 위반을 중복 접수 안내로 바꾼다
    if ((e as any)?.code === "23505" && String((e as any)?.constraint || "").includes("birthday_reviews_phone_uq")) {
      return withHeaders(errorResponse(new ApiError(409, "DUPLICATE", "이 휴대폰 번호로 이미 접수된 후기가 있습니다.")), headers);
    }
    return withHeaders(errorResponse(e), headers);
  }
}
