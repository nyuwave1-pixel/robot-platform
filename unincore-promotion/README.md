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
| `/admin` | CMS 대시보드 (로그인 필요) |
| `/?product=mask` | 광고용 단축 경로 → 제품 페이지로 이동 (UTM 보존) |
| `/sitemap.xml` `/robots.txt` `/og/<slug>` | SEO |

## 기술 스택과 선택 이유

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS**: 같은 저장소의 기존 robot-platform과 동일한 스택이며 Vercel에 그대로 배포됩니다.
- **ISR(5분) + 태그 재검증**: 페이지는 정적 HTML로 제공되고 CMS에서 저장하면 즉시 갱신됩니다. 첫 로드 JS는 약 114 kB입니다.
- **저장소: Upstash Redis REST (Vercel Marketplace)**: SDK 없이 `fetch`만 사용합니다. 저장소가 없어도 사이트는 기본 콘텐츠로 동작합니다.
- **GSAP / Framer Motion은 사용하지 않음**: 스크롤 등장 효과는 IntersectionObserver 하나와 CSS로 처리했습니다. LCP와 INP를 위해 의도적으로 제외했습니다(`prefers-reduced-motion` 지원).
- **추가 의존성은 `zod` 1개**(입력값 검증)입니다.

기존 `robot-platform` 앱(basePath `/robot-platform`)과 코드·빌드·배포가 완전히 분리되어 있습니다. 루트 `tsconfig.json`도 이 폴더를 제외하도록 설정했습니다.

## 실행

```bash
cd unincore-promotion
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                   # http://localhost:3100  (로컬은 ./.data 에 저장)
```

```bash
npm run typecheck && npm test && npm run build
```

```bash
# E2E QA (서버 실행 후)
STORAGE_DRIVER=file ADMIN_PASSWORD=... npm start
ADMIN_PASSWORD=... npm run qa     # → qa-artifacts/qa-report.md
```

## 영상 (VITA C films)

| 위치 | 파일 | 용도 |
|---|---|---|
| `public/videos/vitac/{slot}.mp4 · .webm · -mobile.mp4 · -poster.webp` | brand-intro · citrus-macro · powder-wash · mask-essence · ampoule-texture · final-collection | `src/data/videos.ts`의 `FILMS` 슬롯 (텍스트 없는 6–8초 무한 루프) |
| `public/videos/vitac/films/{id}-16x9.mp4 · -9x16.mp4 · -poster.webp` | collection · wash · mask · ampoule | `BRAND_FILMS` — 영어 키네틱 타이포 브랜드 필름 (홈 `#film`, 제품 페이지 "The Film") |

- 제작: Google Flow(Omni 1.1 Flash) 생성 → FFmpeg 그레이딩·루프 처리 → Pillow 모션 타이포(Cormorant Garamond · Inter).
- 텍스처/시트러스 루프에는 패키지가 나오지 않습니다. `final-collection` 루프와 각 필름의 엔드카드는 `public/products`의 실제 제품 사진만 사용합니다.
- 필름 속 제품 장면은 실제 패키지 사진을 레퍼런스로 생성한 AI 영상입니다. 실사 UGC가 아니므로 "Real Routines"(`videos`) 섹션에는 넣지 않습니다.
- 화면 문구는 US 라벨 사실(13.5%·2% 비타민 C, 성분, 용량, 사용 시간)만 사용하고 `docs/AMAZON_SEO_GUIDE.md` 금지 표현을 따릅니다.

## 문서

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel 배포, DNS(CNAME), 환경변수, 출시 체크리스트
- [docs/OPERATOR_MANUAL.md](docs/OPERATOR_MANUAL.md): 운영자 매뉴얼 (CMS, 프로모션, 링크, 검증 절차)
- [docs/TRACKING.md](docs/TRACKING.md): GA4 · GTM · Meta Pixel · CAPI · Amazon Attribution · UTM 설계
- [docs/SEO_REPORT.md](docs/SEO_REPORT.md): SEO 검수 보고서
- [docs/AMAZON_SEO_GUIDE.md](docs/AMAZON_SEO_GUIDE.md): Amazon 리스팅(내부 검색) 콘텐츠 가이드
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md): 데이터 구조 (CMS · 통계 키)
- [docs/QA_REPORT.md](docs/QA_REPORT.md): 테스트 결과
