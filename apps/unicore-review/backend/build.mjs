// Edge Function 번들: 소스(backend/src) → supabase/functions/birthday-review/index.ts (단일 파일)
// node:* 내장 모듈과 npm: 지정자는 Deno 가 직접 불러오므로 묶지 않는다.
import { build } from "esbuild";
await build({
  entryPoints: ["platform/edge-entry.ts"], outfile: "../supabase/functions/birthday-review/index.ts",
  bundle: true, minify: true, format: "esm", platform: "neutral", target: "es2022", charset: "utf8", legalComments: "none",
  external: ["node:*", "npm:*"], alias: { xlsx: "npm:xlsx@0.18.5" },
  banner: { js: "// 자동 생성 파일 — 직접 고치지 말 것. 원본: apps/unicore-review/backend (npm run build)\n// @ts-nocheck" },
});
console.log("built supabase/functions/birthday-review/index.ts");
