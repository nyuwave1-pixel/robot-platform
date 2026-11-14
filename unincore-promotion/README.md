# UNI&CORE USA Promotion Platform — `promotion.unincore.com`

Meta 광고 → 제품별 프로모션 랜딩 → Amazon 구매로 이어지는 미국 시장 전용 전환 플랫폼입니다.

```
Meta Ads (Facebook / Instagram) · Google · Email
        │  utm_* / fbclid / gclid
        ▼
promotion.unincore.com/products/<slug>   ← 제품별 독립 랜딩 (SEO · UGC · 임상 · 성분 · 사용법 · BFCM)
        │  amazon_cta_click (GA4 · Meta Pixel · 자체 대시보드)
        ▼
Amazon.com /dp/<ASIN>  (채널별 Amazon Attribution 링크)
```

## 구성

| 경로 | 내용 |
|---|---|
| `/` | 메인: Hero · Collection · 3-Step Routine · Brand Story · Amazon Shopping |
| `/products/vitamin-c-13-5-ampoule` | Vita C 13.5 Super Brightening Ampoule (ASIN B0HJRKRKT7) |
| `/products/vita-c-brightening-mask` | Vita C Super Brightening Mask (ASIN B0HGR6V48S) |
| `/products/vita-c-enzyme-powder-wash` | Vita C Enzyme Powder Wash (ASIN B0HGQYFF13) |
| `/privacy` `/terms` `/contact` `/disclaimer` | 정책 페이지 |
| `/?product=mask` | 광고용 단축 경로 → 제품 페이지로 이동 (UTM 보존) |
| `/sitemap.xml` `/robots.txt` `/og/<slug>` | SEO |

## 기술 스택과 선택 이유

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS**: 같은 저장소의 기존 robot-platform과 동일한 스택이며 Vercel에 그대로 배포됩니다.
- **완전 정적 아마존 랜딩 사이트**: 관리자(CMS)·저장소·서버 API가 없습니다. 모든 페이지가 빌드 때 정적 HTML로 만들어지고 Netlify CDN에서 제공됩니다.
- **모든 버튼은 아마존 공식 리스팅으로**: 첫 화면, 테스트 결과, 상세, 하단, 모바일 고정 버튼이 모두 Amazon.com으로 연결되며 GA4 `amazon_cta_click`으로 측정됩니다.
- **모션**: three.js 셰이더(첫 상호작용 후 로드), GSAP ScrollTrigger + Lenis, 실제 제품 사진 기반 루프 영상. `prefers-reduced-motion`이면 정지 화면만 보여줍니다.

기존 `robot-platform` 앱(basePath `/robot-platform`)과 코드·빌드·배포가 완전히 분리되어 있습니다. 루트 `tsconfig.json`도 이 폴더를 제외하도록 설정했습니다.

## 실행

```bash
cd unincore-promotion
npm install
npm run dev                   # http://localhost:3100
```

```bash
npm run typecheck && npm test && npm run build
```

```bash
# E2E QA (GA4 ID를 넣고 빌드 → 서버 실행 후)
NEXT_PUBLIC_GA4_ID=G-QDK6Q436G5 npm run build && npm start
npm run qa                        # → qa-artifacts/qa-report.md
```

## 콘텐츠 수정

관리자 화면이 없으므로 문구·수치·아마존 링크·프로모션은 코드에서 고칩니다.

| 무엇을 | 파일 |
|---|---|
| 제품 랜딩 페이지 문구·갤러리·성분·사용법·리뷰 | `src/content/landing.ts` |
| 제품 기본 정보, 아마존 URL/ASIN, SEO 제목·설명 | `src/content/products.ts` |
| 가이드 글 | `src/content/guides.ts` |
| 블랙프라이데이 등 프로모션 (할인율, 기간, `enabled`) | `src/content/products.ts`의 `bfcm()` / 각 제품 `promotion` |
| 홈 카피 | `src/data/brand.ts`, `src/data/scenes.ts` |
| GA4 / GTM / Meta Pixel ID | Netlify 환경 변수 `NEXT_PUBLIC_GA4_ID` 등 (`src/content/site.ts`) |

수정 → 커밋 → 배포하면 반영됩니다.

## 영상 (VITA C films)

| 위치 | 파일 | 용도 |
|---|---|---|
| `public/videos/vitac/{slot}.mp4 · .webm · -mobile.mp4 · -poster.webp` | brand-intro · citrus-macro · powder-wash · mask-essence · ampoule-texture · final-collection | `src/data/videos.ts`의 `FILMS` 슬롯 (텍스트 없는 6–8초 무한 루프) |
| `public/videos/vitac/films/{id}-16x9.mp4 · -9x16.mp4 · -poster.webp` | collection · wash · mask · ampoule | `BRAND_FILMS` — 영어 키네틱 타이포 브랜드 필름 (홈 `#film`, 제품 페이지 "The Film") |

- 제작: Google Flow(Omni 1.1 Flash) 생성 → FFmpeg 그레이딩·루프 처리 → Pillow 모션 타이포(Cormorant Garamond · Inter).
- 텍스처/시트러스 루프에는 패키지가 나오지 않습니다. `final-collection` 루프와 각 필름의 엔드카드는 `public/products`의 실제 제품 사진만 사용합니다.
- 필름 속 제품 장면은 실제 패키지 사진을 레퍼런스로 생성한 AI 영상입니다. 실사 UGC가 아니므로 "Real Routines"(`videos`) 섹션에는 넣지 않습니다.
- 화면 문구는 US 라벨 사실(성분, 용량, 사용 시간)과 확인된 수치(마스크 2% 비타민 C)만 사용하고, 앰플 "13.5% 순수 비타민 C"와 7일 인체적용시험 수치(SKINMED, 21명)는 브랜드 공식 상세페이지(us.unincore.com) 기준으로만 쓰며, `docs/AMAZON_SEO_GUIDE.md` 금지 표현을 따릅니다.

## 문서

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel 배포, DNS(CNAME), 환경변수, 출시 체크리스트
- [docs/GA4_SETUP.md](docs/GA4_SETUP.md): GA4 이벤트 구조와 관리 화면 설정 체크리스트
- [docs/flow-product-prompts.md](docs/flow-product-prompts.md): 라벨 정확한 제품 영상용 Google Flow 프롬프트
- [docs/TRACKING.md](docs/TRACKING.md): GA4 · GTM · Meta Pixel · CAPI · Amazon Attribution · UTM 설계
- [docs/SEO_REPORT.md](docs/SEO_REPORT.md): SEO 검수 보고서
- [docs/AMAZON_SEO_GUIDE.md](docs/AMAZON_SEO_GUIDE.md): Amazon 리스팅(내부 검색) 콘텐츠 가이드
- [docs/QA_REPORT.md](docs/QA_REPORT.md): 테스트 결과
