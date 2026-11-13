// 아주 작은 라우터: "METHOD /path/:id" → 핸들러. 공통 오류 처리·CSRF 검사 포함
import { errorResponse, fail, allowedOrigins, testOrigins } from "./core.ts";

/** 변경 요청은 전용 헤더 필수 + Origin 이 있으면 허용 목록만 (세션은 쿠키가 아닌 Bearer 토큰이라 CSRF 대상은 아니지만 한 겹 더 둔다) */
function checkCsrf(req: Request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  if (req.headers.get("x-br-csrf") !== "1") fail(403, "CSRF", "허용되지 않은 요청입니다.");
  const origin = req.headers.get("origin");
  if (origin && ![...allowedOrigins(), ...testOrigins()].includes(origin)) fail(403, "ORIGIN", "허용되지 않은 출처입니다.");
}

export type Ctx = { req: Request; url: URL; params: Record<string, string> };
type Handler = (c: Ctx) => Promise<Response>;
type Route = { method: string; re: RegExp; keys: string[]; h: Handler };

export function router(prefix: string) {
  const routes: Route[] = [];
  const add = (method: string, path: string, h: Handler) => {
    const keys: string[] = [];
    const re = new RegExp("^" + path.replace(/:([a-zA-Z]+)/g, (_m, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
    routes.push({ method, re, keys, h });
  };
  const handle = async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      const sub = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || "/" : url.pathname;
      checkCsrf(req);
      let pathMatched = false;
      for (const r of routes) {
        const m = sub.match(r.re);
        if (!m) continue;
        pathMatched = true;
        if (r.method !== req.method) continue;
        const params: Record<string, string> = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        return await r.h({ req, url, params });
      }
      return fail(pathMatched ? 405 : 404, pathMatched ? "METHOD" : "NOT_FOUND", pathMatched ? "허용되지 않은 방식입니다." : "없는 경로입니다.");
    } catch (e) {
      return errorResponse(e);
    }
  };
  return { get: (p: string, h: Handler) => add("GET", p, h), post: (p: string, h: Handler) => add("POST", p, h),
    patch: (p: string, h: Handler) => add("PATCH", p, h), del: (p: string, h: Handler) => add("DELETE", p, h), handle };
}
export const idParam = (c: Ctx, k = "id") => { const n = Number(c.params[k]); if (!Number.isInteger(n) || n <= 0) fail(400, "BAD_ID", "잘못된 번호입니다."); return n; };
