// 로컬 검수 서버: http://localhost:8899/birthday-review/*  — 시험용 PostgreSQL + 메모리 사진 저장소 (운영과 무관)
//   PROMO_TEST_PG_URL=postgres://user:pw@127.0.0.1:5432/review_local  npm run serve
//   설정 코드: local-setup-code  ·  사이트: SKIP 없이 `NEXT_PUBLIC_REVIEW_API=http://localhost:8899/birthday-review npm run dev` (apps/unicore-review)
import http from "node:http";
import fs from "node:fs";
import pg from "pg";
const cs = process.env.PROMO_TEST_PG_URL; if (!cs) throw new Error("PROMO_TEST_PG_URL 필요");
const PORT = Number(process.env.PORT || 8899);
const c = new pg.Client({ connectionString: cs }); await c.connect();
if (!(await c.query("select to_regnamespace('birthday_review') as s")).rows[0].s) {
  await c.query("CREATE ROLE anon NOLOGIN").catch(() => {}); await c.query("CREATE ROLE authenticated NOLOGIN").catch(() => {});
  await c.query(fs.readFileSync("./sql/001_init.sql", "utf8"));
  await c.query("UPDATE birthday_review.promotion_events SET event_status = 'OPEN'");
}
await c.end();
process.env.BR_ALLOWED_ORIGINS ||= "http://localhost:3100,http://127.0.0.1:3100";
const { startNodePlatform } = await import("../platform/node.ts");
startNodePlatform(cs);
const core = await import("../src/core.ts");
await core.q(`INSERT INTO app_config (key, value) VALUES ('setup_code', $1) ON CONFLICT (key) DO NOTHING`, [JSON.stringify({ hash: core.sha256("local-setup-code") })]);
const { handle } = await import("../src/app.ts");
http.createServer(async (req, res) => {
  const chunks = []; for await (const x of req) chunks.push(x);
  const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  if (!headers.get("x-forwarded-for")) headers.set("x-forwarded-for", req.socket.remoteAddress || "127.0.0.1");
  const r = await handle(new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) }), "/birthday-review");
  const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
  res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(PORT, () => console.log(`[review] http://localhost:${PORT}/birthday-review/public/config`));
