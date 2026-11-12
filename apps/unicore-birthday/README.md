# UNI&CORE 1ST BIRTHDAY CREAM — Immersive Brand Experience

독립 Next.js 15 앱 (`apps/unicore-birthday`). 기획·스토리보드는 `docs/unicore-birthday-cream/` 참조.

## 실행
```bash
cd apps/unicore-birthday
npm install
npm run dev          # http://localhost:3100  (predev 가 Drive 원본 영상을 받아 변환 — 수 분 소요)
SKIP_ASSETS=1 npm run dev   # 영상 없이 UI만 볼 때
```

## 에셋 파이프라인
`scripts/fetch-assets.mjs` 가 빌드 전에 실행되어 `public/media/`(git 제외)를 생성합니다.
- 시네마틱 필름 v1 → `film/film_1080.mp4`, `film_720.mp4`, `film_scrub_720.mp4`(GOP 12, 스크롤 스크럽용)
- 스틸 22컷 → `stills/*.webp|jpg` (타임코드는 `docs/.../09_cinematic-film-analysis.md`)
- 세로 필름(모바일 인트로), 임상강조 16:9(보조)
- 원본은 Google Drive 링크 공개 파일이며 ID는 `.env.example` 참조. 실패해도 빌드는 계속되고 포스터/폴백으로 동작합니다.

## 구조
- `src/data/*` — 상세페이지 원문 카피, 임상(verified 플래그), 성분, 만족도, 사용법, 라인업, 영상 구간, SEO. **하드코딩 금지, 이 파일만 수정.**
- `src/features/intro` — 필름 인트로(12초 사운드 게이트, 스킵, 기억, 폴백)
- `src/features/video/FilmScrub` — 필름 구간을 스크롤 진행률로 스크럽
- `src/features/scenes` — R3F: 용기 인스펙터(프로시저럴 모델+디칼), 골드 파티클, PDRN 구체
- `src/components/sections` — S01~S13
- `src/features/scroll` — Lenis + GSAP ScrollTrigger, 섹션 진행률 훅

## 쿼리 파라미터
- `?intro=1` 인트로 강제 재생, `?intro=0` 건너뛰기

## 환경변수
`.env.example` 참조. `NEXT_PUBLIC_PURCHASE_URL`(한국) / `NEXT_PUBLIC_PURCHASE_URL_US`(USA) 미설정 시 `src/data/product.ts` 의 기본 상품 URL을 사용합니다.
- `NEXT_PUBLIC_PROMO=off` — 출시기념 4+2 띠 배너 숨김 (문구·가격·오픈 시각은 `src/data/promo.ts`)
- `NEXT_PUBLIC_GA_ID` — GA4 측정 ID. 설정 시 클릭 이벤트가 GA4 로도 전송됩니다.

## 방문·클릭 집계
- **Vercel Web Analytics** — `src/components/Analytics.tsx` 에서 항상 마운트. Vercel 대시보드 → 프로젝트 `unicore-birthday-cream` → Analytics 탭 → Enable 후 **새 배포가 한 번 있어야** `/_vercel/insights/script.js` 가 활성화됩니다. (Hobby 플랜은 페이지뷰만, 커스텀 이벤트는 Pro)
- **GA4** — `NEXT_PUBLIC_GA_ID` 설정 시 `@next/third-parties` 로 gtag 로드.
- 이벤트는 `src/lib/track.ts` 의 `track()` 한 곳에서 두 곳에 동시에 전송:
  - `buy_click { placement: final|sticky|promo_bar, region: kr|us, locale }`
  - `promo_bar_close { locale }`
- 주의: 이 프로젝트는 Ignored Build Step 으로 `apps/unicore-birthday` 변경이 없는 커밋·재배포(Redeploy)는 취소됩니다. 강제로 새 배포가 필요하면 이 디렉터리 안의 파일을 바꿔 커밋하세요.
