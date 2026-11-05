# UNI&CORE VITA C 프로모션 사이트: 작업 인수인계

최종 업데이트: 2026-11-05 · 기준 커밋 `def408e` 이후

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 사이트 | https://promotion.unincore.com |
| 성격 | VITA C 3종 → **Amazon.com 구매로 보내는 정적 랜딩 사이트** (관리자/CMS 없음) |
| 제품 | Vita C Enzyme Powder Wash · Vita C Super Brightening Mask · Vita C 13.5 Super Brightening Ampoule |
| 코드 | GitHub `nyuwave1-pixel/robot-platform`, 브랜치 `claude/awesome-gauss-5kqwk2`, 폴더 `unincore-promotion/` (PR #2, Draft) |
| 호스팅 | Netlify 프로젝트 `unincore-promotion` (siteId `4a3fa453-4eb7-4f23-9855-816a3cc62589`, 팀 nyuwave1) |
| 도메인 | 후이즈 DNS: `promotion` CNAME → `unincore-promotion.netlify.app` · HTTPS Let's Encrypt 자동 |
| 분석 | GA4 `G-QDK6Q436G5` (계정 387197170 / 속성 527901588, us.unincore.com 쇼핑몰과 같은 속성) |
| 검색 등록 | Google Search Console(HTML 파일) · 네이버 서치어드바이저(메타 태그) 완료 |

## 2. 다른 PC에서 시작하기

필요한 것: **Node.js 22**, npm, (영상 작업 시) ffmpeg · Python 3 + Pillow + numpy.

### 방법 A: GitHub에서 받기 (권장)

```bash
git clone https://github.com/nyuwave1-pixel/robot-platform.git
cd robot-platform
git checkout claude/awesome-gauss-5kqwk2
cd unincore-promotion
npm install
npm run dev            # http://localhost:3100
```

### 방법 B: 압축 파일로 받기

```bash
unzip unincore-promotion.zip
cd unincore-promotion
npm install
npm run dev            # http://localhost:3100
```

압축 파일에는 git 이력이 없습니다. 수정 후 GitHub에 올리려면 방법 A로 받은 폴더에 변경분을 옮겨 커밋하세요.

### 확인 명령

```bash
npm run typecheck      # 타입 검사
npm test               # 단위 테스트 (22개)
NEXT_PUBLIC_GA4_ID=G-QDK6Q436G5 npm run build
npm start              # 다른 터미널에서 ↓
npm run qa             # Playwright E2E 115개 → qa-artifacts/qa-report.md
```

## 3. 폴더 구조

```
unincore-promotion/
├─ src/
│  ├─ app/(site)/            홈 page.tsx, products/[slug], 정책 페이지, layout
│  ├─ app/og/[slug]/         링크 미리보기 이미지(OG)
│  ├─ app/error.tsx          오류 화면 (자동 1회 새로고침)
│  ├─ content/products.ts    ★ 제품 문구·수치·성분·FAQ·아마존 링크·SEO·프로모션
│  ├─ content/site.ts        사이트 URL, 공지 문구, 추적 ID 기본값
│  ├─ data/brand.ts          홈 카피
│  ├─ data/scenes.ts         홈 제품 장면 카피
│  ├─ data/videos.ts         영상 목록 (FILMS, BRAND_FILMS, MOTION, PRODUCT_LOOP …)
│  ├─ components/product/    제품 페이지 (ProductLanding, AmazonPanel, OfficialDetail)
│  ├─ components/vitac/      홈 시네마틱 (Intro, ShaderStage, FilmLayer, ScrubFilm …)
│  ├─ components/site/       공용 (AmazonButton, Header, StickyCTA, TrackingScripts …)
│  └─ lib/                   analytics(GA4), amazon(ASIN 검사), seo(JSON-LD), perf …
├─ public/
│  ├─ products/              공식 제품 사진, 흰 배경 패키지, detail/ 공식 상세페이지 조각
│  ├─ films/                 홈 모션 영상, 제품 루프(*-loop)
│  └─ videos/vitac/          텍스처 루프, 브랜드 필름(films/)
├─ scripts/
│  ├─ qa.mjs                 E2E QA
│  └─ films/                 영상 재생성 스크립트 (build_ampoule_films.py, build_product_loops.py)
├─ docs/                     문서 (이 파일, GA4_SETUP, flow 프롬프트 등)
├─ netlify.toml              빌드 설정 + netlify.app → 도메인 301
└─ tests/core.test.ts        단위 테스트
```

## 4. 자주 하는 수정

| 하고 싶은 것 | 어디서 |
|---|---|
| 제품 문구, 성분, 사용법, FAQ, 테스트 수치 | `src/content/products.ts` |
| 아마존 링크 / ASIN | `src/content/products.ts`의 `asin`, `amazonUrl` (ASIN 불일치 링크는 테스트에서 걸러짐) |
| 채널별 Amazon Attribution 링크 | 각 제품 `attribution: { meta, google, email }` |
| 블랙프라이데이 등 프로모션 | `products.ts`의 `bfcm()` → `enabled: true`, 할인율, 기간 (미국 태평양 시간) |
| 검색 제목·설명·키워드 | 각 제품 `seo` (제목 70자, 설명 170자 이내) |
| 홈 카피 | `src/data/brand.ts`, `src/data/scenes.ts` |
| GA4 / GTM / Meta Pixel ID | Netlify 환경 변수 `NEXT_PUBLIC_GA4_ID` 등 → 재배포 |

문구 규칙: 미국 화장품 기준으로 "brighter-looking"처럼 **보이는 효과**만 씁니다. "whitening", 치료·완화 표현 금지. 수치는 출처가 있는 것만 (`status: "verified"`), 없는 것은 `"pending"`으로 두면 화면에 나오지 않습니다.

## 5. 배포

Netlify에 Git 자동 배포가 연결되어 있지 않습니다. 둘 중 하나로 배포합니다.

1. **Netlify CLI** (다른 PC에서 권장)
   ```bash
   npm i -g netlify-cli
   netlify login
   cd unincore-promotion
   netlify link --id 4a3fa453-4eb7-4f23-9855-816a3cc62589
   netlify deploy --build --prod
   ```
2. **Netlify 화면에서 Git 연결**: Site configuration → Build & deploy → Link repository → `robot-platform`, Base directory `unincore-promotion`, 브랜치 `claude/awesome-gauss-5kqwk2`(또는 병합 후 `main`). 이후 푸시할 때마다 자동 배포.

Netlify 환경 변수 (현재): `NEXT_PUBLIC_GA4_ID=G-QDK6Q436G5`, `NEXT_PUBLIC_SITE_URL=https://promotion.unincore.com`.

배포 전 체크: `npm run typecheck && npm test && npm run build` 통과.

## 6. 영상 다시 만들기

```bash
# 앰플/컬렉션 브랜드 필름 (13.5% 문구 없는 버전)
python3 scripts/films/build_ampoule_films.py --sources <원본 클립 폴더> --fonts <Cormorant woff 폴더> --work <작업 폴더>
# 제품 히어로 루프 (실제 사진 기반, 라벨 정확)
python3 scripts/films/build_product_loops.py
```

원본 Google Flow 클립은 이 저장소에 없습니다(용량). 새 제품 영상은 `docs/flow-product-prompts.md`의 프롬프트로 만듭니다.

## 7. 지금까지 완료한 것

- 시네마틱 홈 (인트로, three.js 셰이더, 스크롤 영상, 제품 장면), 제품 페이지 3개
- 공식 상세페이지(us.unincore.com) 문구·수치·이미지 반영, 미국용으로 "whitening" 문구와 타 제품 홍보 제거
- 앰플 13.5% 순수 비타민 C + 7일 인체적용시험(SKINMED, 21명) 수치, 세안제 pH 5–5.5
- 아마존 구매 패널, 모든 CTA → Amazon.com (새 탭)
- 실제 제품 사진 기반 히어로 루프 영상, 13.5% 문구 없이 재편집한 브랜드 필름
- SEO: 페이지별 메타, OG 이미지, JSON-LD, 사이트맵, 구글·네이버 등록
- GA4 이벤트 최적화 (`amazon_cta_click` 등), 디버그 모드 `?ga_debug=1`
- 성능: Lighthouse 모바일 홈 86–87, 데스크톱 97, SEO 100
- 관리자/CMS 제거 → 완전 정적 사이트, 오류 화면 자동 복구

## 8. 남은 일

| 할 일 | 필요한 것 |
|---|---|
| 블랙프라이데이 배너 켜기 | 제품별 실제 할인율·기간 (지금은 `enabled: false`) |
| Amazon Attribution 연결 | 셀러센트럴에서 만든 채널별 링크 |
| 아마존 링크 확인 | 3개 ASIN 페이지를 직접 열어 확인 (`asinVerified: true`로 변경) |
| GA4 관리 화면 설정 | `docs/GA4_SETUP.md` 체크리스트 (주요 이벤트, 맞춤 측정기준, 보존 14개월) |
| (선택) 부작용 신고 안내 | 미국용 연락 이메일 → Contact 페이지 |
| (선택) 라벨 정확한 AI 제품 영상 | Google Flow로 생성한 MP4 |

## 9. 관련 문서

- `README.md`: 개요, 실행, 콘텐츠 수정
- `docs/GA4_SETUP.md`: GA4 이벤트와 설정 체크리스트
- `docs/flow-product-prompts.md`: 제품 영상 Flow 프롬프트
- `docs/AMAZON_SEO_GUIDE.md`: 아마존 리스팅 문구 가이드 · 금지 표현
- `docs/SEO_REPORT.md`, `docs/DEPLOYMENT.md`, `docs/QA_REPORT.md`: 이전 버전 기준 참고 문서
