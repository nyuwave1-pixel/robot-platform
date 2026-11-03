# 데이터 구조

PostgreSQL 같은 RDB를 새로 도입하지 않고, 필요한 데이터를 **Redis(Upstash) 키-값** 몇 개로 관리합니다. 기본 콘텐츠는 코드(`src/content/products.ts`)에 있고, CMS는 그 위에 **덮어쓰기(override)**만 저장합니다. 그래서 저장소에 장애가 나도 사이트는 기본 콘텐츠로 계속 동작합니다.

## 키 목록

| 키 | 타입 | 내용 |
|---|---|---|
| `cms:product:ampoule` / `cms:product:mask` / `cms:product:wash` | JSON string | 제품 override (`ProductOverride`, `src/lib/schemas.ts`) |
| `cms:settings` | JSON string | `SiteSettings` (추적 ID, 공지, 동의 모드, 문의 이메일, updatedAt/By) |
| `cms:audit` | JSON string | 최근 변경 100건 `{at, user, target, action}` |
| `stats:YYYY-MM-DD` (US Pacific 날짜) | Hash, TTL 400일 | 이벤트 카운터 |

## 통계 해시 필드

`kind|event|dim[|dim2]` 형식입니다. 값은 정수 카운터입니다.

| kind | 예시 | 의미 |
|---|---|---|
| `e` | `e\|amazon_cta_click` | 이벤트 총계 |
| `p` | `p\|product_detail_view\|mask` | 제품별 |
| `ch` | `ch\|amazon_cta_click\|meta` | 채널별 |
| `pch` | `pch\|amazon_cta_click\|ampoule\|meta` | 제품 × 채널 |
| `dev` | `dev\|page_view\|mobile` | 기기별 |
| `cmp` | `cmp\|amazon_cta_click\|bfcm_2026` | UTM 캠페인별 |
| `src` | `src\|view_item\|facebook` | utm_source별 |
| `loc` | `loc\|amazon_cta_click\|wash\|sticky` | CTA 위치별 |

개인 식별 정보(IP, 쿠키 ID, 이메일)는 저장하지 않습니다. 캠페인과 소스 값은 소문자로 바꾸고 허용 문자와 길이(40~80자)를 제한해서 저장합니다.

## 제품 콘텐츠 모델 요약 (`src/content/types.ts`)

```ts
ProductContent {
  key, slug, published,
  asin, asinVerified, amazonUrl, attribution { default, meta, google, email },
  name, shortName, size, accent, routineStep,
  heroEyebrow, heroHeadline, heroSub, tagline, keyIngredient, highlights[], specs[], heroImage?,
  concerns[], benefits[], differentiators[], texture, howTo[], routineText, faqs[],
  claims[]       { value, label, source, status: verified|pending },
  ingredients[]  { name, inci, role, detail, status },
  beforeAfter[]  { before, after, labels, alt, status },
  videos[]       { src, poster, title, uploadDate, duration, status },
  promotion      { enabled, name, startsAt, endsAt, discountPct, headline, detail, couponNote, amazonUrl },
  price?         { amount, currency: "USD", verifiedAt },
  seo            { title, description, keywords[], ogImage? }
}
```

`status: "pending"`인 항목은 `publicView()`에서 걸러지므로 공개 페이지에 렌더링되지 않습니다.

## 다국어 확장 방법

`SITE.locales`에 `{code: "ko-KR", path: "/ko"}` 같은 항목을 추가하고, `app/(site)/[locale]` 세그먼트와 `ProductContent`의 문자열 필드를 로케일별로 분리합니다. `pageMetadata()`의 `alternates.languages`에 hreflang이 자동으로 추가되도록 확장하면 됩니다.
