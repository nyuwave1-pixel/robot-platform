import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const ledger = readFileSync(join(root, "docs/ASSET_LICENSES.md"), "utf8");
const files = [
  ...readdirSync(join(root, "public/tex")).map((f) => `public/tex/${f}`),
  ...readdirSync(join(root, "public/audio")).map((f) => `public/audio/${f}`),
  ...readdirSync(join(root, "public/models")).filter((f) => f.startsWith("qn_") || f.startsWith("real_") || f === "signature.glb" || f.startsWith("guest_")).map((f) => `public/models/${f}`),
];

describe("무료 에셋 라이선스 대장", () => {
  it("외부 에셋 파일은 모두 대장에 있다", () => {
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) expect(ledger, `${f} 가 docs/ASSET_LICENSES.md 에 없음`).toContain("`" + f + "`");
  });
  it("대장의 라이선스는 상업 사용이 가능한 것만 쓴다", () => {
    const rows = ledger.split("\n").filter((l) => l.startsWith("| `public/"));
    expect(rows.length).toBe(files.length);
    // CC0 이거나, 이 프로젝트 계정으로 직접 생성한 에셋(Higgsfield 유료 플랜 — 상업 사용 가능)
    for (const r of rows) expect(r).toMatch(/\| (CC0( 1\.0)?|자체 생성 \(Higgsfield\)) \|/);
    expect(ledger).not.toMatch(/CC-BY-NC|NonCommercial/);
  });
  it("Higgsfield 디자인 캐릭터마다 모델 파일이 있다", async () => {
    const { DESIGNED_BODIES } = await import("../src/store/game");
    for (const b of DESIGNED_BODIES) expect(files).toContain(`public/models/${b}.glb`);
  });
  it("게임 코드가 쓰는 사운드 파일이 모두 있다", () => {
    const src = readFileSync(join(root, "src/audio/sound.ts"), "utf8");
    const names = [...src.matchAll(/"(ui_click|ui_open|ui_close|reward|pickup|error|heart|chime|bgm_\w+|amb_\w+)"/g)].map((m) => m[1]);
    for (const n of new Set(names)) expect(files).toContain(`public/audio/${n}.mp3`);
  });
});
