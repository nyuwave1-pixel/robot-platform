// products.ts 를 그대로 읽어 PRODUCT_ITEM_DATABASE.md 를 생성 (문서와 코드가 어긋나지 않게)
import { build } from "esbuild";
import fs from "node:fs";
const out = new URL("../node_modules/.cache-db.mjs", import.meta.url).pathname;
await build({ entryPoints: ["src/data/_dbentry.ts"], bundle: true, format: "esm", outfile: out, logLevel: "silent" });
const { PRODUCTS, ROUTINES, MODES } = await import(out);
const L = [];
L.push(`# Product Item Database`, ``,
`> 이 문서는 \`src/data/products.ts\` · \`src/data/devices.ts\` 에서 **자동 생성**된다 (\`npm run docs:db\`). 직접 고치지 말고 데이터 파일을 수정한다.`, ``,
`## 출처와 수집 방법`,
`- 수집일: 2026-11-11`,
`- https://www.unincore.com — 공개 상품 목록(전체 48종 · 더마 디바이스 2종), 공개 상세 페이지의 상품코드, **상품정보제공고시**(이미지로 게시된 표를 사람이 읽어 옮김)`,
`- https://dermahome.unincore.com , \`/guide/\` — 모드 설명, 루틴 표(모드·분·제품 조합), 부위별 방향, 케어 라인 소개`,
`- https://derma-partners.unincore.com — 디바이스 사양 표기(RF 1,000,000Hz · 울트라소닉 800kHz~1MHz · 이온토포레시스 2-WAY), 라운지 공간 구성`,
`- 로그인·비공개 API 는 사용하지 않았다. 모두 비로그인 브라우저로 볼 수 있는 페이지다.`, ``,
`## 실데이터와 게임 데이터의 구분`,
`| 구분 | 필드 | 원칙 |`, `|---|---|---|`,
`| 실데이터 | name, nameEn, category, productCode, mallSeq, priceKRW, volume, ingredients, keyIngredients, howTo, functional, maker, officialNote, modes | 공식 표기 그대로. 임의 수정·번역·효능 창작 금지 |`,
`| 게임 데이터 | rarity, coinPrice, unlock, theme, shape, colors | 게임 기획 수치. 등급은 수집 희귀도이며 품질·효능 순위가 아님 |`, ``,
`- \`verified: true\` = 상품정보제공고시까지 대조한 항목 (**${PRODUCTS.filter(p=>p.verified).length}종**). \`false\` = 이름·카테고리·가격·이미지·상품코드만 확인. 게임 도감에도 같은 구분이 표시된다.`,
`- \`keyIngredients\` 는 전성분 표기 안에서 고른 것이다. 성분의 효능 설명은 넣지 않았다.`,
`- \`nameEn\` 은 더마홈 사이트에 영문 표기가 있는 케어 라인 4종에만 있다. 그 외 제품은 승인된 번역이 없어 모든 언어에서 한글 공식명으로 표시한다.`,
`- \`modes\` 는 더마홈 공식 루틴 표에 그 제품이 등장하는 모드다.`,
`- "하이드레이팅 스킨 **베**리어 세럼 미스트"(목록 표기)와 "…스킨 **배**리어…"(고시 표기)처럼 공식 페이지 안에서 표기가 다른 경우 **쇼핑몰 목록 표기**를 따랐다.`,
`- 액티브 리커버 쿨 젤은 목록 150ml / 고시 150g 로 다르게 적혀 있다. 이름은 목록, 용량은 고시를 따랐다.`, ``);
const cats = ["스킨케어", "더마 디바이스", "헬스케어", "리빙", "브랜드 아이템"];
for (const c of cats) {
  const ps = PRODUCTS.filter((p) => p.category === c);
  L.push(`## ${c} (${ps.length})`, ``, `| Product ID | 제품명 | 상품코드 | seq | 공식몰 표시가 | 용량 | 케어 모드 | 등급 | 게임 가격 | 해금 | 검증 |`, `|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const p of ps) L.push(`| \`${p.id}\` | ${p.name} | ${p.productCode ?? "—"} | ${p.mallSeq} | ${p.priceKRW ? p.priceKRW.toLocaleString("ko-KR") + "원" : "가격문의"} | ${p.volume ?? "—"} | ${p.modes.length ? p.modes.map((m) => m.toUpperCase()).join(" · ") : p.finisher ? "마무리" : "—"} | ${p.rarity} | ${p.coinPrice ? p.coinPrice + "🪙" : "—"} | ${p.unlock.stage ? "STAGE " + p.unlock.stage : p.unlock.lounge ? "LOUNGE " + p.unlock.lounge : "—"} | ${p.verified ? "✔" : "기본"} |`);
  L.push(``);
}
L.push(`## 상세 (상품정보제공고시 대조 완료 항목)`, ``);
for (const p of PRODUCTS.filter((p) => p.verified && p.ingredients)) {
  const rs = ROUTINES.filter((r) => r.steps.some((s) => s.products.includes(p.id)));
  L.push(`### ${p.name}`, `- Product ID: \`${p.id}\` · 상품코드 ${p.productCode} · 이미지 \`public/products/${p.mallSeq}.webp\``,
    `- 용량: ${p.volume} · 제조업자: ${p.maker} · 기능성 화장품: ${p.functional ? "심사(보고) 필" : "해당사항 없음"}`,
    `- 사용 방법: ${p.howTo}`, p.officialNote ? `- 공식 소개(더마홈): ${p.officialNote}` : null,
    `- 주요 성분(전성분에서 발췌): ${p.keyIngredients.join(", ")}`, `- 전성분: ${p.ingredients}`,
    `- 추천 디바이스 모드: ${p.modes.length ? p.modes.map((m) => MODES[m].label).join(", ") : p.finisher ? "루틴 마무리" : "없음(클렌징·진열)"}`,
    `- 관련 루틴/퀘스트: ${rs.length ? rs.map((r) => r.ko).join(", ") : "—"}`,
    `- 게임: ${p.rarity} · ${p.coinPrice}🪙 · 연출 테마 \`${p.theme}\`(판타지 연출, 효능 표현 아님)`, ``);
}
L.push(`## 공식 루틴 → 게임 미션`, ``, `| 루틴 | 구분 | 스텝 (모드 · 공식 분 · 제품) | 부위 | 미스트 마무리 | 해금 |`, `|---|---|---|---|---|---|`);
for (const r of ROUTINES) L.push(`| ${r.ko} | ${r.group.ko} | ${r.steps.map((s) => `${s.mode.toUpperCase()} ${s.minutes}분 · ${s.products.map((id) => PRODUCTS.find((p) => p.id === id).name.split(" ").slice(0, 3).join(" ")).join(" / ")}`).join(" → ")} | ${r.zones.join(", ")} | ${r.mistFinish ? "예" : "—"} | ${r.unlock.stage ? "STAGE " + r.unlock.stage : r.unlock.lounge ? "LOUNGE " + r.unlock.lounge : "—"} |`);
L.push(``, `공식 사이트에는 두피 3종·바디 3종 루틴이 있으나 스텝 구성이 같아 게임에는 각 1종씩만 넣었다. 요청서 예시의 "MORNING / PREMIUM BEAUTY ROUTINE"은 공식 가이드에 없는 조합이어서 넣지 않았다.`, ``,
`## 아직 수집하지 않은 것`,
`- 스킨케어 7종(퍼스트 벌스데이 크림, 글루타글로우 앰플, 선크림, 클렌징 오일, 타이트업 쿠션·리필, 샴푸)의 상품정보고시`,
`- 헬스케어·리빙·브랜드 아이템 29종과 더마10 패키지의 상품코드·상세`,
`- DERMA HOME 설명서의 강도 단계·권장 시간(사이트에는 "설명서를 따른다"고만 되어 있음)`, ``);
fs.writeFileSync("docs/PRODUCT_ITEM_DATABASE.md", L.filter((x) => x !== null).join("\n"));
console.log("written", PRODUCTS.length);
