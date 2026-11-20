// 시험·로컬 검수용 실행 환경: 지정한 PostgreSQL + 메모리 사진 저장소
import pg from "pg";
import { createHash } from "node:crypto";
import { setPlatform } from "../src/platform.ts";

pg.types.setTypeParser(1082, (v: string) => v);   // DATE 는 문자열 그대로
export const files = new Map<string, Uint8Array>();
export function startNodePlatform(connectionString: string) {
  const pool = new pg.Pool({ connectionString, max: 10, options: "-c search_path=birthday_review" });
  setPlatform({
    env: (n) => process.env[n] || "",
    pool: pool as any,
    storage: { put: async (k, d) => { files.set(k, d); }, get: async (k) => files.get(k) || null, del: async (k) => { files.delete(k); } },
    secret: createHash("sha256").update(process.env.BR_SECRET_KEY || "local-test-only-key").digest(),
  });
  return pool;
}
