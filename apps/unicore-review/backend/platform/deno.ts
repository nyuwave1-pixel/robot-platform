// 운영 실행 환경: Supabase Edge Function (Deno)
//  - DB: SUPABASE_DB_URL 로 직접 연결, 전용 스키마 birthday_review 만 사용
//  - 사진: Supabase Storage 비공개 버킷(서비스 키로만 접근 — 공개 URL 없음)
//  - 암호화 키: DB 의 무작위 값(app_config.key_salt) + 서비스 키의 SHA-256. 둘 중 하나만으로는 복호화할 수 없다.
//    ※ 서비스 키(JWT secret)를 교체하면 기존 암호문(휴대폰·주소)을 읽지 못한다. 교체 전에 BR_SECRET_KEY 로 고정해 둘 것.
// @ts-nocheck  (Deno 전역·npm: 지정자는 Node 타입 검사 대상이 아님)
import pg from "npm:pg@8.11.3";
import { createHash } from "node:crypto";
import { setPlatform } from "../src/platform.ts";

pg.types.setTypeParser(1082, (v) => v);
const E = (n) => Deno.env.get(n) || "";
const BUCKET = "birthday-review-images";
let ready = null;

export function initDenoPlatform() {
  if (ready) return ready;
  ready = (async () => {
    const pool = new pg.Pool({ connectionString: E("SUPABASE_DB_URL"), max: 4, idleTimeoutMillis: 20000, options: "-c search_path=birthday_review" });
    pool.on("error", () => {});
    const base = E("SUPABASE_URL").replace(/\/$/, "") + "/storage/v1/object/" + BUCKET + "/";
    const key = E("SUPABASE_SERVICE_ROLE_KEY");
    const auth = { authorization: "Bearer " + key, apikey: key };
    let secret;
    if (E("BR_SECRET_KEY").length >= 32) secret = createHash("sha256").update(E("BR_SECRET_KEY")).digest();
    else {
      const r = await pool.query("SELECT value->>'v' AS v FROM app_config WHERE key = 'key_salt'");
      if (!r.rows[0]?.v || !key) throw new Error("secret material missing");
      secret = createHash("sha256").update(r.rows[0].v + "|" + key).digest();
    }
    setPlatform({
      env: E, pool, secret,
      storage: {
        async put(k, data, mime) {
          const r = await fetch(base + k, { method: "POST", headers: { ...auth, "content-type": mime, "x-upsert": "true", "cache-control": "no-store" }, body: data });
          if (!r.ok) throw new Error("storage put " + r.status);
        },
        async get(k) {
          const r = await fetch(base + k, { headers: auth });
          if (r.status === 404 || r.status === 400) return null;
          if (!r.ok) throw new Error("storage get " + r.status);
          return new Uint8Array(await r.arrayBuffer());
        },
        async del(k) {
          const r = await fetch(base + k, { method: "DELETE", headers: auth });
          if (!r.ok && r.status !== 404 && r.status !== 400) throw new Error("storage del " + r.status);
        },
      },
    });
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
