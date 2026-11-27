# UNI&CORE 1ST BIRTHDAY CREAM — 글로벌 캠페인 배너 디자인 시스템

공식 사이트(birthday.unincore.com)의 브랜드 아이덴티티를 그대로 이어받아, **5개 캠페인 × 3개 언어(한국어·영어·간체 중국어) × 49개 규격(온라인 31 + 인쇄 18)** 의 배너를 하나의 엔진으로 생성·검수·출력하는 시스템입니다.

- **배너 엔진** (`src/rendering`, `src/campaigns`) — 규격의 비율(울트라와이드·와이드·정사각·세로·톨)에 따라 레이아웃을 새로 구성합니다. 단순 리사이즈가 아닙니다.
- **CLI 일괄 출력** (`npm run export`) — 온라인 RGB(JPG/PNG/SVG)와 인쇄 CMYK PDF(재단 여유 3mm, TrimBox, 글자 아웃라인)를 만듭니다.
- **자동 검수** (`npm run qa`) — 픽셀·mm 규격, 파일 용량, 텍스트 잘림·겹침, 안전영역, 제품 비율, 누락 글리프, 임상 각주, CMYK, QR 스캔을 검사합니다.

---

## 1. 빠른 시작

```bash
cd apps/unc-birthday-campaign
npm install
npm run export -- --jobs 3     # 전체 735종 출력 → exports/
npm run qa                     # exports/QA_REPORT.md
npm run sheets                 # exports/_sheets/ 검수용 컨택트 시트
```

부분 출력:

```bash
npx tsx scripts/export.ts --set online --lang ko --campaign skin-rebirth --size web-pc-main,sns-story
npx tsx scripts/export.ts --set print --lang en,zh --campaign clinical-beauty
```

Node 20 이상이 필요합니다. 인쇄용 CMYK 변환은 sharp(libvips + LittleCMS)를 사용하며, 기본 출력 프로파일은 Ghostscript의 `default_cmyk.icc`(코팅지 SWOP 계열, TAC 약 300%)입니다. 인쇄소 프로파일이 있으면 아래처럼 지정합니다.

```bash
UNC_CMYK_ICC=/path/JapanColor2001Coated.icc npm run export:print
```

## 2. 폴더 구조

```
apps/unc-birthday-campaign/
├─ public/assets/
│  ├─ logo/            공식 워드마크 (SVG, 원본 그대로)
│  ├─ products/        공식 제품·패키지 컷 (배경 제거 + 4K 업스케일, 형태·라벨 무변형)
│  ├─ backgrounds/     캠페인별 배경 플레이트 c01~c05 × wide/square/tall (제품 없는 무대 이미지)
│  ├─ ingredients/     성분 비주얼 (PDRN · 4GF · 레시틴 · 세라마이드)
│  └─ fonts/           서브셋 폰트 (Cormorant Garamond, Inter, Pretendard, Noto Serif/Sans SC)
├─ src/
│  ├─ rendering/       엔진: 타이포(opentype 아웃라인) · 레이아웃 · 제품 합성 · 효과 · 검수
│  ├─ campaigns/       5개 캠페인 컴포저 (아키타입별 레이아웃)
│  ├─ localization/    한·영·중 카피 (현지화 카피, 임상 각주, 28일 고지)
│  ├─ templates/       49개 규격 레지스트리 (안전영역·용량·dpi·재단 여유)
│  └─ export/          출력 (자산 인라인, 인쇄 CMYK PDF, 레이어 분리)
├─ scripts/            export · qa · sheets · preview
├─ docs/               디자인 시스템 · 플랫폼 규격 · 인쇄 가이드 · QA 체크리스트
└─ exports/            (생성물, git 제외) {lang}/{online|print}/{campaign}/…
```

출력 파일명은 `UNC_{캠페인}_{규격ID}_{가로x세로}_{언어}.{jpg|png|svg}`, 인쇄는 `…mm_{언어}_CMYK.pdf`와 `_RGB-preview.jpg`입니다.

## 3. 캠페인

| No | 캠페인 | 목적 | 핵심 비주얼 | 법적 표기 |
|---|---|---|---|---|
| 01 | SKIN RE:BIRTH | 브랜드 인지도 | 빛기둥 아래 블랙 미러 받침대 | — |
| 02 | THE 28 DAYS | 사용 스토리 | 골드 리플 + 28일 링(14일+14일) | 28일은 턴오버 일반 개념 기반 스토리텔링이며 개인 결과 비보장 (자동 삽입) |
| 03 | THE GOLDEN FORMULA | 성분 차별화 | 리퀴드 골드 + 성분 오브 4종 | 공식 성분 표기만 사용 |
| 04 | CLINICAL BEAUTY | 임상 신뢰 | 골드 데이터 그리드 + 결과 카드 | 시험기관·대상자 수·기간·측정 장비·p값·개인차 (자동 삽입) |
| 05 | THE MASTERPIECE | 구매 전환 | 오픈 기프트 박스 + 실크 + 마블 | — |

임상 수치(48.33% 볼 함몰 부피, 19.06% 목 주름 지수, 이상반응 0건)와 시험 조건은 공식 자료 그대로 고정되어 있으며 카피 파일에서도 수정하지 않습니다. 각주는 공간에 따라 전문 → 요약 → 최소형(시험기관·인원·기간·측정·p값·개인차 유지) 순으로 자동 선택됩니다.

## 4. 배너 커스터마이즈 (코드/CLI)

사이트·웹 에디터 없이 파일 단위로 조정합니다.

| 하고 싶은 것 | 방법 |
|---|---|
| 카피 수정 | `src/localization/copy.ts` (언어별, `**강조**` = 골드, `\n` = 줄바꿈) |
| 규격 추가·안전영역 변경 | `src/templates/sizes.ts` |
| 제품·배경·로고 교체, 위치·크기·톤 조정 | `RenderSpec.overrides` (`product.custom / dx / dy / scale`, `bg.custom / campaign / color / tint / brightness / effects / scrim`, `logo`, `text.scale / dx / dy`) |
| 특정 규격만 다시 출력 | `npx tsx scripts/export.ts --lang ko --campaign masterpiece --size web-pc-main` |
| 빠른 시안 확인 | `npx tsx scripts/preview.ts <campaign> <lang> <sizeId…|online|print>` → `.cache/preview/` |

## 5. 자동 검수 항목

렌더링할 때 검사하는 항목:

- `text-fit` 최소 가독 크기에서도 들어가지 않는 텍스트 (잘림)
- `overlap-text` / `overlap-product` 텍스트·CTA·로고 간, 또는 제품과의 겹침
- `outside-safe` / `outside-trim` 안전영역·재단선 이탈
- `product-aspect` 제품 이미지 비율 변형 (0.1% 이상이면 오류)
- `missing-glyph` 폰트에 없는 글자 (중국어·특수문자 포함)
- `claim-footnote` 임상 수치 사용 시 각주 누락
- `story-disclaimer` 28일 캠페인 고지 누락
- `product-dpi` 인쇄 크기에서 제품 이미지 해상도 부족

출력 후 `npm run qa`는 실제 파일을 다시 열어 픽셀·mm·TrimBox·BleedBox·CMYK·폰트 아웃라인·용량·QR 스캔까지 확인합니다. 자세한 내용은 `docs/QA_CHECKLIST.md`를 참고하세요.

## 6. 유료 도구 대체

| 용도 | 일반적인 유료 도구 | 이 시스템 (무료) |
|---|---|---|
| 레이아웃·타이포 | Adobe Illustrator / InDesign | 자체 엔진 + opentype.js (텍스트를 패스로 변환) |
| 래스터 렌더 | Photoshop | resvg (Rust SVG 렌더러) |
| CMYK 분판 | Acrobat Preflight / Photoshop | sharp(libvips + LittleCMS) + ICC 프로파일 |
| PDF 박스·메타 | Acrobat Pro | pdf-lib |
| 배치 리사이즈 | Figma 플러그인, Bannerbear | 아키타입 레이아웃 엔진 + CLI |
| 업스케일 | Topaz Gigapixel | AI 업스케일 (이번 작업은 Higgsfield 사용) · 무료 대안 Real-ESRGAN |
| 배경 제거 | remove.bg | Adobe/Higgsfield 도구 · 무료 대안 rembg |

## 7. 브랜드 보호 원칙

- 용기 형태, 골드 캡, 제품명, 로고, 패키지는 **원본 이미지 그대로 합성**합니다. AI는 제품이 없는 배경 플레이트에만 사용했습니다.
- 제품 이미지는 항상 원본 비율로 배치되며, 비율이 0.1% 이상 달라지면 검수 오류로 표시됩니다.
- 설문 수치는 표기하지 않습니다. 임상 수치는 시험 조건·대상자 수·개인차 안내와 함께만 노출됩니다.
