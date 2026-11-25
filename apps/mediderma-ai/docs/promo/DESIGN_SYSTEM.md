# DESIGN_SYSTEM — MEDIDERMA Experience

## 1. 컬러 (CSS Variables)

`/experience` 루트에 `.theme-experience` 스코프로 정의한다. 사이트 공통 SKIN IQ 테마(`:root`)와 기술 장면용 `.theme-dark` 는 그대로 둔다.

```css
.theme-experience {
  --x-deep-black: 8 9 9;        /* #080909 */
  --x-obsidian: 18 21 21;       /* #121515 */
  --x-graphite: 32 38 36;       /* #202624 */
  --x-medical-green: 23 61 50;  /* #173D32 */
  --x-deep-emerald: 16 42 36;   /* #102A24 */
  --x-champagne: 200 168 117;   /* #C8A875 */
  --x-soft-gold: 229 208 167;   /* #E5D0A7 */
  --x-ivory: 243 241 234;       /* #F3F1EA */
  --x-white: 255 255 255;
  /* 제품 패키지 실측 컬러 (자료 수령 후 추가) */
  --x-product-1: var(--x-champagne);
  --x-product-2: var(--x-ivory);
  /* 역할 */
  --x-bg: var(--x-deep-black);
  --x-fg: var(--x-ivory);
  --x-accent: var(--x-champagne);
  --x-line: 255 255 255 / 0.08;
}
.theme-experience[data-mode="light"] { --x-bg: var(--x-ivory); --x-fg: 8 9 9; --x-accent: var(--x-medical-green); }
```

- 장면별로 `data-mode` 를 dark ↔ light 로 바꿔 제품 스토리에 맞춰 전환(예: 성분 장면 = 밝은 아이보리 연구실, 인트로·재결합 = 어둠).
- 대비: 본문 4.5:1, 대형 헤드라인 3:1 이상 — 자동 측정 스크립트로 검사. Champagne Gold 글자는 Deep Black 위에서만 본문 사용(대비 8.9:1), Ivory 위에서는 장식·대형 글자만.

## 2. 타이포그래피

| 용도 | 영문 | 한글 | 크기(모바일 → PC) |
|---|---|---|---|
| 디스플레이(3D) | Neue Montreal(구매 시) → Inter Display 대체 | — | 64 → 200px, 자간 -0.04em |
| 세리프 포인트 | Cormorant Garamond Italic | — | 32 → 96px |
| 헤드라인 | Inter 600 | Pretendard 700 / SUIT 700 | 28 → 56px |
| 본문 | Inter 400 | Pretendard 400 | 15 → 18px, 행간 1.65 |
| 라벨·수치 | Inter 500, tabular-nums, 대문자 자간 0.24em | Pretendard 500 | 11 → 13px |

- 웹폰트는 `next/font` 로 self-host, 한글은 사용 글자만 서브셋(첫 화면 ≤ 80KB).
- 한글 3D 지오메트리는 무겁다 → 영문 헤드라인만 Text3D, 한글은 CSS 3D 깊이 글자(DepthText) 또는 SDF 텍스트(troika).

## 3. 모션 원칙

- 같은 등장 효과를 반복하지 않는다. 문장 성격별 모션 매핑:

| 문장 성격 | 모션 |
|---|---|
| 브랜드 선언 (THE FUTURE OF BEAUTY) | 3D 압출 글자가 깊이(z)에서 날아와 정렬 |
| 과학 키워드 (SKIN SCIENCE) | 입자 타이포 — 글자가 입자로 흩어졌다 재결합 |
| 성분 (ADVANCED FORMULA) | 금속 셰이더 글자 표면에 빛이 흐름 |
| 정밀성 (PRECISION BEAUTY) | 글자 띠가 제품을 감싸며 회전(원통 좌표) |
| 수치·근거 | 카운트업 + 고정폭 숫자, 출처 각주 |
| 설명 문단 | 줄 단위 마스크 리빌 (과하지 않게) |

- 이징: `cubic-bezier(0.16, 1, 0.3, 1)` 기본, 스크럽 장면은 선형 + 0.1~0.3s 스무딩.
- `prefers-reduced-motion`: 스크럽·입자·회전 끄고 정지 레이아웃 + 페이드만.

## 4. 재질·빛

- 제품: 물리 기반 재질(MeshPhysicalMaterial — 유리 transmission·clearcoat, 금속 뚜껑 metalness/roughness), HDRI 는 절차적 Lightformer(외부 HDR 다운로드 없음).
- 빛의 스캔: 화면 공간 스윕 라이트 + 림 라이트(Champagne).
- 배경: 미세 입자(GPU 인스턴싱), 아주 낮은 필름 그레인.

## 5. PC / 태블릿 / 모바일 규칙

| 항목 | 모바일 (≤767) | 태블릿 (768~1199) | PC (≥1200) |
|---|---|---|---|
| 그리드 | 4칼럼, 여백 20px | 8칼럼, 32px | 12칼럼, 최대 1440, 48px |
| 고정 장면 높이 | 100svh | 100svh | 100vh |
| 3D 해상도 | DPR ≤ 1.5, 그림자 끔, 입자 1/3 | DPR ≤ 1.75 | DPR ≤ 2 |
| 회전 입력 | 한 손가락 가로 드래그(세로는 스크롤) | 터치+펜 | 마우스 드래그·휠 줌 |
| 줌 | 핀치 1.0~1.8 | 핀치 | 휠 1.0~2.2 |
| 커서 | — | — | 커스텀 커서(상태 라벨) |
| 영상 | 720p ≤ 5MB, 세로형 크롭 | 1080p | 1080p/4K 선택 |
| 텍스트 | 3D 헤드라인 최대 2줄, 본문 15px | | |

- 터치 대상 최소 44×44px, 하단 안전 영역(`env(safe-area-inset-bottom)`).
- 가로 스크롤 금지, 9개 언어 모두 360px 에서 글자 잘림 0건(자동 검사).
