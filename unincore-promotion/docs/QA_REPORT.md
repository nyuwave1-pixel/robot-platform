# 테스트 결과 (광고 전환 이벤트 포함)

실행일 2026-11-03 · Next.js 15.5.4 production build (`next start`) · Chromium (Playwright)

## 요약

| 구분 | 결과 |
|---|---|
| TypeScript (`npm run typecheck`) | ✅ 오류 0 |
| 단위 테스트 (`npm test`, Vitest) | ✅ 27 / 27 |
| E2E QA (`npm run qa`) | ✅ 134 / 134 |
| Production build | ✅ 정적/ISR 생성 (메인 114 kB, 제품 116 kB First Load JS) |

### 단위 테스트 범위
- Amazon 링크: 3개 제품 모두 자기 ASIN과 매핑, 다른 ASIN·비 Amazon 호스트·http 거부, Attribution 파라미터 보존, 채널별/기본 링크 선택, 잘못된 링크는 안전하게 대체
- 프로모션: BFCM 경계 시각(PST 11/19 00:00 시작, 11/30 23:59:59까지), 비활성 또는 0%면 꺼짐, 앰플 20% 유지(30% 미적용)
- 채널 판정: facebook/ig/fbclid → meta, gclid/cpc → google, email, organic, direct
- 검증 게이트: +35.6%, pH 5–5.5, 10M+ 등 미검증 수치는 공개 화면에 나오지 않음
- CMS 검증: ASIN 불일치 저장 거부, 종료일이 시작일보다 앞서면 거부, 추적 ID 형식 검사
- SEO: 제품별 title과 description이 고유하고 길이 제한을 지킴
- 관리자 세션: 서명 위조와 만료 토큰 거부

### 출시 전 실제 계정으로 확인할 항목 (이번 환경에서는 불가)
- [ ] Amazon 상품 페이지 3개와 ASIN 매핑 육안 확인 (이번 환경에서는 amazon.com 접근 차단)
- [ ] Amazon Attribution 링크 클릭 → Attribution 리포트에 클릭 집계
- [ ] GA4 DebugView에서 7개 이벤트 수신 확인
- [ ] Meta Events Manager에서 PageView / ViewContent / AmazonCTAClick 수신, CAPI 중복 제거(event_id)
- [ ] promotion.unincore.com DNS와 SSL
- [ ] PageSpeed Insights 모바일 Core Web Vitals

## E2E 상세 결과

**134/134 passed**

| Result | Check | Detail |
|---|---|---|
| ✅ | / returns 200 | 200 |
| ✅ | / unique title | UNI&CORE \| Korean Vitamin C Skincare — Shop on Amazon |
| ✅ | / unique meta description | 150 chars |
| ✅ | / canonical | https://promotion.unincore.com/ |
| ✅ | / OG + Twitter card |  |
| ✅ | / indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | / exactly one H1 | 1 |
| ✅ | / all images have alt |  |
| ✅ | / hreflang alternates |  |
| ✅ | / JSON-LD parses | BreadcrumbList, Organization, WebSite |
| ✅ | home has Organization + WebSite schema |  |
| ✅ | /products/vitamin-c-13-5-ampoule returns 200 | 200 |
| ✅ | /products/vitamin-c-13-5-ampoule unique title | Vitamin C 13.5% Ampoule Serum \| UNI&CORE Korean Skincare |
| ✅ | /products/vitamin-c-13-5-ampoule unique meta description | 149 chars |
| ✅ | /products/vitamin-c-13-5-ampoule canonical | https://promotion.unincore.com/products/vitamin-c-13-5-ampoule |
| ✅ | /products/vitamin-c-13-5-ampoule OG + Twitter card |  |
| ✅ | /products/vitamin-c-13-5-ampoule indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /products/vitamin-c-13-5-ampoule exactly one H1 | 1 |
| ✅ | /products/vitamin-c-13-5-ampoule all images have alt |  |
| ✅ | /products/vitamin-c-13-5-ampoule hreflang alternates |  |
| ✅ | /products/vitamin-c-13-5-ampoule JSON-LD parses | Product, BreadcrumbList, FAQPage, Organization, WebSite |
| ✅ | /products/vitamin-c-13-5-ampoule has Product + BreadcrumbList + FAQPage schema |  |
| ✅ | /products/vita-c-brightening-mask returns 200 | 200 |
| ✅ | /products/vita-c-brightening-mask unique title | Vitamin C Sheet Mask (5 Pack) \| UNI&CORE Brightening Face Mask |
| ✅ | /products/vita-c-brightening-mask unique meta description | 161 chars |
| ✅ | /products/vita-c-brightening-mask canonical | https://promotion.unincore.com/products/vita-c-brightening-mask |
| ✅ | /products/vita-c-brightening-mask OG + Twitter card |  |
| ✅ | /products/vita-c-brightening-mask indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /products/vita-c-brightening-mask exactly one H1 | 1 |
| ✅ | /products/vita-c-brightening-mask all images have alt |  |
| ✅ | /products/vita-c-brightening-mask hreflang alternates |  |
| ✅ | /products/vita-c-brightening-mask JSON-LD parses | Product, BreadcrumbList, FAQPage, Organization, WebSite |
| ✅ | /products/vita-c-brightening-mask has Product + BreadcrumbList + FAQPage schema |  |
| ✅ | /products/vita-c-enzyme-powder-wash returns 200 | 200 |
| ✅ | /products/vita-c-enzyme-powder-wash unique title | Enzyme Powder Face Wash with Bromelain \| UNI&CORE Korean Cleanser |
| ✅ | /products/vita-c-enzyme-powder-wash unique meta description | 165 chars |
| ✅ | /products/vita-c-enzyme-powder-wash canonical | https://promotion.unincore.com/products/vita-c-enzyme-powder-wash |
| ✅ | /products/vita-c-enzyme-powder-wash OG + Twitter card |  |
| ✅ | /products/vita-c-enzyme-powder-wash indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /products/vita-c-enzyme-powder-wash exactly one H1 | 1 |
| ✅ | /products/vita-c-enzyme-powder-wash all images have alt |  |
| ✅ | /products/vita-c-enzyme-powder-wash hreflang alternates |  |
| ✅ | /products/vita-c-enzyme-powder-wash JSON-LD parses | Product, BreadcrumbList, FAQPage, Organization, WebSite |
| ✅ | /products/vita-c-enzyme-powder-wash has Product + BreadcrumbList + FAQPage schema |  |
| ✅ | /privacy returns 200 | 200 |
| ✅ | /privacy unique title | Privacy Policy \| UNI&CORE USA |
| ✅ | /privacy unique meta description | 115 chars |
| ✅ | /privacy canonical | https://promotion.unincore.com/privacy |
| ✅ | /privacy OG + Twitter card |  |
| ✅ | /privacy indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /privacy exactly one H1 | 1 |
| ✅ | /privacy all images have alt |  |
| ✅ | /privacy hreflang alternates |  |
| ✅ | /privacy JSON-LD parses | Organization, WebSite |
| ✅ | /terms returns 200 | 200 |
| ✅ | /terms unique title | Terms of Use \| UNI&CORE USA |
| ✅ | /terms unique meta description | 64 chars |
| ✅ | /terms canonical | https://promotion.unincore.com/terms |
| ✅ | /terms OG + Twitter card |  |
| ✅ | /terms indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /terms exactly one H1 | 1 |
| ✅ | /terms all images have alt |  |
| ✅ | /terms hreflang alternates |  |
| ✅ | /terms JSON-LD parses | Organization, WebSite |
| ✅ | /contact returns 200 | 200 |
| ✅ | /contact unique title | Contact \| UNI&CORE USA |
| ✅ | /contact unique meta description | 94 chars |
| ✅ | /contact canonical | https://promotion.unincore.com/contact |
| ✅ | /contact OG + Twitter card |  |
| ✅ | /contact indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /contact exactly one H1 | 1 |
| ✅ | /contact all images have alt |  |
| ✅ | /contact hreflang alternates |  |
| ✅ | /contact JSON-LD parses | Organization, WebSite |
| ✅ | /disclaimer returns 200 | 200 |
| ✅ | /disclaimer unique title | Disclaimer \| UNI&CORE USA |
| ✅ | /disclaimer unique meta description | 99 chars |
| ✅ | /disclaimer canonical | https://promotion.unincore.com/disclaimer |
| ✅ | /disclaimer OG + Twitter card |  |
| ✅ | /disclaimer indexable robots meta | index, follow, max-image-preview:large, max-snippet:-1 |
| ✅ | /disclaimer exactly one H1 | 1 |
| ✅ | /disclaimer all images have alt |  |
| ✅ | /disclaimer hreflang alternates |  |
| ✅ | /disclaimer JSON-LD parses | Organization, WebSite |
| ✅ | ampoule: hero/final/sticky CTAs present | hero,offer,final,sticky |
| ✅ | ampoule: all own CTAs go to amazon.com/B0HJRKRKT7 |  |
| ✅ | ampoule: CTAs open in a new tab |  |
| ✅ | ampoule: unverified claims are not shown publicly |  |
| ✅ | mask: hero/final/sticky CTAs present | hero,offer,final,sticky |
| ✅ | mask: all own CTAs go to amazon.com/B0HGR6V48S |  |
| ✅ | mask: CTAs open in a new tab |  |
| ✅ | mask: unverified claims are not shown publicly |  |
| ✅ | wash: hero/final/sticky CTAs present | hero,offer,final,sticky |
| ✅ | wash: all own CTAs go to amazon.com/B0HGQYFF13 |  |
| ✅ | wash: CTAs open in a new tab |  |
| ✅ | wash: unverified claims are not shown publicly |  |
| ✅ | ?product=mask routes to the mask landing page | /products/vita-c-brightening-mask |
| ✅ | ad routing keeps all UTM params + fbclid |  |
| ✅ | product_detail_view beacon sent with UTM + channel | {"e":"product_detail_view","p":"mask","ch":"meta","src":"facebook","med":"paid_social","cmp":"bfcm_2026","cnt":"ugc_a","dev":"desktop","path":"/products/vita-c- |
| ✅ | view_item + page_view beacons sent |  |
| ✅ | campaign attribution persists across internal navigation | {"e":"product_detail_view","p":"ampoule","ch":"meta","src":"facebook","med":"paid_social","cmp":"bfcm_2026","cnt":"ugc_a","dev":"desktop","path":"/products/vita |
| ✅ | amazon_cta_click beacon (product, placement, channel) | {"e":"amazon_cta_click","p":"ampoule","loc":"hero","ch":"meta","src":"facebook","med":"paid_social","cmp":"bfcm_2026","cnt":"ugc_a","dev":"desktop","path":"/pro |
| ✅ | Amazon opened in new tab with correct ASIN | https://www.amazon.com/UNI-CORE-Brightening-Glutathione-Stabilized/dp/B0HJRKRKT7/ |
| ✅ | faq_open beacon |  |
| ✅ | mobile sticky CTA hidden over hero, shown mid-page, hidden at final CTA/footer | true/false/true |
| ✅ | no horizontal scroll on mobile |  |
| ✅ | GPC signal → Consent Mode default denied | {"analytics_storage":"denied","ad_storage":"denied","ad_user_data":"denied","ad_personalization":"denied","wait_for_update":500} |
| ✅ | GPC → no cookie banner shown |  |
| ✅ | sitemap.xml lists home + 3 products |  |
| ✅ | sitemap excludes /admin |  |
| ✅ | robots.txt disallows /admin + /api and points to sitemap |  |
| ✅ | unknown URL → 404 |  |
| ✅ | unknown product → 404 |  |
| ✅ | OG image renders (PNG) |  |
| ✅ | /api/track rejects unknown events (no fake 'purchase') |  |
| ✅ | security headers set |  |
| ✅ | /admin requires login |  |
| ✅ | admin API without session → 401 |  |
| ✅ | cross-site login POST blocked (CSRF) |  |
| ✅ | wrong admin password rejected |  |
| ✅ | admin login → dashboard |  |
| ✅ | dashboard shows Amazon clicks section |  |
| ✅ | dashboard recorded this run's product views + Amazon clicks | 14 / 9 / 1 / 11.1% |
| ✅ | CMS rejects Amazon link with the wrong ASIN | {"path":"amazonUrl","message":"URL points to ASIN B0HGR6V48S, but this product is B0HJRKRKT7."} |
| ✅ | CMS saves product override | {"ok":true} |
| ✅ | CMS edit appears on the public page |  |
| ✅ | live promotion shows banner + offer |  |
| ✅ | promotion_view event fired |  |
| ✅ | ended promotion → page returns to regular layout |  |
| ✅ | verified claim becomes visible publicly |  |
| ✅ | admin reset restores defaults |  |
| ✅ | default headline restored |  |
| ✅ | settings rejects invalid GA4 ID |  |
| ✅ | admin preview shows pending claims flagged |  |
