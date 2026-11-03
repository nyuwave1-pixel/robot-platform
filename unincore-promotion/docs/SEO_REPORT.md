# SEO 검수 보고서 (2026-11-03)

자동 검사(`npm run qa`)와 코드 검토 결과입니다. 원본 결과는 [QA_REPORT.md](QA_REPORT.md)에 있습니다.

## 1. 페이지별 메타데이터

| URL | Title | Description (길이) |
|---|---|---|
| `/` | UNI&CORE \| Korean Vitamin C Skincare — Shop on Amazon | Shop UNI&CORE Korean vitamin C skincare on Amazon: a 13.5% vitamin C ampoule… (150) |
| `/products/vitamin-c-13-5-ampoule` | Vitamin C 13.5% Ampoule Serum \| UNI&CORE Korean Skincare | Meet the UNI&CORE Vita C 13.5 Super Brightening Ampoule — a 13.5% pure vitamin C serum… |
| `/products/vita-c-brightening-mask` | Vitamin C Sheet Mask (5 Pack) \| UNI&CORE Brightening Face Mask | UNI&CORE Vita C Super Brightening Mask: a Korean vitamin C sheet mask with 2% pure vitamin C… |
| `/products/vita-c-enzyme-powder-wash` | Enzyme Powder Face Wash with Bromelain \| UNI&CORE Korean Cleanser | UNI&CORE Vita C Enzyme Powder Wash: a gentle Korean enzyme face cleanser with bromelain… |
| `/privacy` `/terms` `/contact` `/disclaimer` | 각각 고유 | 각각 고유 |

모든 페이지에서 확인한 항목(QA 자동 검사 통과):

- ✅ 고유한 `<title>`과 meta description
- ✅ `canonical` = `https://promotion.unincore.com/<path>`
- ✅ Open Graph(title, description, image 1200×630, locale en_US)와 Twitter `summary_large_image`
- ✅ `robots: index, follow, max-image-preview:large` (관리자 페이지는 `noindex` + `X-Robots-Tag`)
- ✅ `hreflang` en-US와 x-default (ko/ja/es를 추가할 때 `SITE.locales`와 `pageMetadata` 확장)
- ✅ H1은 페이지당 1개, 섹션은 H2, 카드와 항목은 H3
- ✅ 모든 `<img>`에 alt (장식용 이미지는 `alt=""`, 일러스트 패키지는 `role="img"` + `aria-label`)
- ✅ 보조 메타데이터 `meta keywords` (Google은 순위에 사용하지 않음)

## 2. 구조화 데이터 (JSON-LD)

| 페이지 | 스키마 |
|---|---|
| 전체 | `Organization`, `WebSite` |
| 메인 | `BreadcrumbList` |
| 제품 | `Product`(name, brand, sku=ASIN, image, description, url), `BreadcrumbList`, `FAQPage`, `VideoObject`(Verified 영상이 있을 때) |

**참고 사항**

- `Product.offers`는 CMS에 **확인된 Amazon 가격**을 입력했을 때만 출력합니다. `aggregateRating`/`review`는 Amazon 리뷰를 옮겨 오면 정책 위반이므로 출력하지 않습니다. 그래서 Google 리치 결과 테스트에서 "offers/review/aggregateRating 중 하나 필요" **경고**가 나올 수 있습니다. 오류가 아니며 색인에는 영향이 없습니다.
- `FAQPage`: 2023년 이후 Google은 FAQ 리치 결과를 정부·의료 권위 사이트에만 표시합니다. 마크업은 페이지 내용과 같고 정책을 위반하지 않으며, Bing과 AI 검색에서 활용됩니다.
- 출시 후 [Rich Results Test](https://search.google.com/test/rich-results)와 [Schema Validator](https://validator.schema.org/)에서 각 URL을 검사하십시오.

## 3. 기술 SEO

- ✅ `sitemap.xml`: 메인, 제품 3개(이미지 포함), 정책 페이지 4개. 비공개 제품은 자동으로 제외
- ✅ `robots.txt`: `/admin`, `/api/` 차단 + sitemap 경로 안내
- ✅ 존재하지 않는 URL과 제품은 404, `noindex`
- ✅ 정적 HTML(ISR) 제공. 크롤러는 JS 없이도 모든 콘텐츠와 Amazon 링크를 볼 수 있음
- ✅ 이미지: `next/image`로 AVIF/WebP 자동 변환과 반응형 `srcset` 적용, 첫 화면 외 이미지는 지연 로딩
- ✅ 폰트: `next/font`로 자체 호스팅, `display: swap` (CLS 방지)
- ✅ 보안 헤더: HSTS, nosniff, Referrer-Policy, X-Frame-Options
- ✅ 내부 링크: 헤더/푸터 → 제품 3개, 제품 간 "Complete the Routine" 상호 링크, 브레드크럼
- ✅ 모바일 가로 스크롤 없음, 모바일 하단 고정 CTA는 히어로와 마지막 CTA/푸터 구간에서 자동으로 숨김

## 4. 성능 (빌드 결과)

| 경로 | First Load JS |
|---|---|
| `/` | 114 kB |
| `/products/*` | 116 kB |
| 정책 페이지 | 102~108 kB |

애니메이션 라이브러리(GSAP/Framer Motion) 없이 CSS와 IntersectionObserver만 사용합니다. 첫 화면 요소는 즉시 표시되어 LCP를 지연시키지 않습니다. `prefers-reduced-motion`이면 모든 모션을 끕니다.
배포 후 PageSpeed Insights(모바일)로 LCP < 2.5s, INP < 200ms, CLS < 0.1을 확인하십시오. 실제 제품 사진은 1600px 이하 WebP로 업로드하는 것을 권장합니다.

## 5. 키워드 매핑

| 페이지 | 주요 검색 의도 | 반영 위치 |
|---|---|---|
| 메인 | UNI&CORE, Korean skincare, K beauty skincare, Korean beauty products, vitamin C skincare, Korean brightening skincare | title, description, H1/H2, 브랜드 스토리 |
| 앰플 | vitamin C 13.5 serum, vitamin C ampoule, pure vitamin C serum, brightening ampoule, Korean vitamin C serum, skin radiance serum | title("Vitamin C 13.5% Ampoule Serum"), H1, 성분, 차별점 |
| 마스크 | vitamin C face mask, brightening sheet mask, Korean vitamin C mask, vitamin C sheet mask, hydrating face mask | title("Vitamin C Sheet Mask"), 효익, 사용법 |
| 파우더 워시 | enzyme powder wash, enzyme face cleanser, powder face wash, bromelain cleanser, foaming powder cleanser, daily exfoliating cleanser | title("Enzyme Powder Face Wash with Bromelain"), 성분, FAQ |

키워드를 나열하지 않고 미국 소비자가 쓰는 자연스러운 문장 안에 녹였습니다. 화장품 표현 규정(FDA)에 따라 "brighter-looking", "radiant-looking"처럼 **외관 표현**만 사용했습니다.

## 6. 남은 작업 (출시 전)

1. Search Console(도메인 속성)과 Bing Webmaster를 등록하고 인증 값을 환경변수에 넣은 뒤 sitemap을 제출
2. 실제 제품 사진과 OG 이미지 등록
3. 검증된 임상/판매 수치를 공개(콘텐츠 깊이와 신뢰도 향상)
4. UGC 영상 등록(VideoObject 리치 결과 대상)
