# 광고 추적 및 전환 측정 설계

## 1. 측정 범위 원칙

| 데이터 | 출처 | 의미 |
|---|---|---|
| 랜딩 방문, 조회, Amazon 버튼 클릭 | 이 사이트(GA4 · Meta Pixel · 자체 대시보드) | 사이트 행동 |
| Amazon 상세 조회, 장바구니, **구매, 매출** | **Amazon Attribution** 리포트 | 실제 구매 전환 |

Amazon 구매는 Amazon에서 일어나므로 이 사이트는 **구매 이벤트를 만들지 않습니다.** `/api/track`은 `purchase` 같은 이벤트를 거부합니다(QA에서 확인). `amazon_cta_click`은 Meta Pixel에서 표준 `Purchase`/`InitiateCheckout`이 아닌 커스텀 이벤트 `AmazonCTAClick`으로 전송됩니다.

## 2. 이벤트

| 이벤트 | 발생 시점 | GA4 / dataLayer | Meta Pixel | CAPI |
|---|---|---|---|---|
| `page_view` | 페이지 진입 (SPA 이동 포함) | ✅ (`send_page_view:false` 후 수동 전송) | `PageView` | – |
| `product_detail_view` | 제품 랜딩 진입 | ✅ items[] 포함 | – | – |
| `view_item` | 제품 랜딩 진입 (GA4 이커머스 표준) | ✅ | `ViewContent` (content_ids=ASIN) | ✅ |
| `video_play` | UGC 영상 재생 | ✅ | `VideoPlay` (custom) | – |
| `amazon_cta_click` | Amazon 버튼 클릭 (`cta_location`: hero/sticky/final/offer/promo/card/shop/related) | ✅ | `AmazonCTAClick` (custom) | ✅ |
| `promotion_view` | 프로모션 노출 | ✅ | `PromotionView` (custom) | – |
| `faq_open` | FAQ 펼침 | ✅ | – | – |

공통 파라미터는 `event_id`(Pixel과 CAPI 중복 제거용), `channel`, `items[{item_id: ASIN, item_name, item_brand}]`, `product_key`입니다.

## 3. UTM과 채널

- 수집 항목은 `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, 외부 referrer입니다.
- 저장 위치는 `sessionStorage(uc_attr)`입니다. 새 태그 유입이 있으면 갱신하고, 사이트 내부를 이동해도 유지됩니다(QA에서 확인).
- 채널 판정 규칙(`src/lib/channel.ts`):
  - `meta`: fbclid 또는 utm_source가 facebook/instagram/fb/ig/meta/an/messenger
  - `google`: gclid 또는 google + cpc/ppc/paid
  - `email`: utm_medium=email 또는 newsletter/klaviyo
  - `organic`: 검색엔진 referrer 또는 google/bing 자연 유입
  - `direct`: 그 외
- 채널은 **Amazon Attribution 링크 선택**과 대시보드 집계에 쓰입니다.

## 4. Amazon Attribution 설정 순서

1. Amazon Advertising Console → **Attribution** → 광고주로 UNI&CORE 브랜드를 선택합니다.
2. Order 생성: Publisher(Facebook, Instagram, Google, Email), 제품 ASIN 3개를 선택합니다.
3. 생성된 **Attribution tag URL**을 제품/채널별로 복사합니다.
4. CMS → 제품 편집 → Attribution link(meta / google / email / default)에 붙여 넣습니다.
5. 테스트: 광고 URL(UTM 포함)로 접속 → Amazon 버튼에 마우스를 올려 `maas=` 파라미터가 들어간 URL인지 확인합니다.
6. 1~2일 뒤 Attribution 리포트(Clicks, DPV, ATC, Purchases, Sales)와 CMS 대시보드의 Amazon clicks를 캠페인별로 비교합니다.

> Meta 광고에서 "링크 클릭 → 랜딩 → Amazon 클릭 → Amazon 구매" 퍼널은 **Meta Ads Manager(랜딩 클릭/ViewContent/AmazonCTAClick) + Amazon Attribution(구매)** 두 리포트를 합쳐서 봐야 합니다.

## 5. GA4 / GTM 설정

- **GA4만 사용**: CMS → Settings → GA4 ID를 입력하면 gtag를 직접 로드합니다.
- **GTM 사용**: GTM ID를 입력합니다. 사이트는 `dataLayer.push({event: '<이벤트명>', ...})`만 실행합니다. GTM에서 다음을 설정합니다.
  1. Google 태그(GA4 측정 ID), 이벤트 매개변수 `send_page_view = false`
  2. 트리거: Custom Event `page_view|view_item|product_detail_view|video_play|amazon_cta_click|promotion_view|faq_open` (정규식)
  3. GA4 이벤트 태그: 이벤트명 `{{Event}}`, 매개변수 `items`, `channel`, `cta_location`, `product_key`
  4. Consent Mode는 사이트가 기본값과 업데이트를 이미 전송합니다(GTM의 "추가 동의 확인" 불필요)
- GA4 **맞춤 측정기준**으로 `channel`, `cta_location`, `product_key`를 등록합니다.
- GA4 **주요 이벤트(전환)**로 `amazon_cta_click`을 지정합니다.

## 6. Meta Pixel / Conversions API

- Pixel은 **추적이 허용된 방문자에게만** 로드됩니다(Opt-out 해제 상태이고 GPC 신호가 없을 때).
- CAPI: `META_CAPI_ACCESS_TOKEN`을 설정하면 `view_item`과 `amazon_cta_click`을 서버에서도 전송합니다. 같은 `event_id`로 Pixel과 중복이 제거됩니다. `_fbp`/`_fbc` 쿠키와 IP/UA를 사용하며 이메일 같은 개인정보는 전송하지 않습니다.
- 테스트: `META_CAPI_TEST_EVENT_CODE`를 설정하고 Events Manager → Test events에서 확인합니다.
- 권장 사항: Meta 도메인 인증과 Aggregated Event Measurement 우선순위를 `AmazonCTAClick` > `ViewContent`로 설정합니다.

## 7. 개인정보 (미국)

- 기본값은 **Opt-out** 모델(CCPA/CPRA 등 미국 주법의 관행)입니다. 배너에 "Opt out of sharing"이 있고, 푸터에 **Your Privacy Choices** 링크가 있습니다.
- **Global Privacy Control(GPC)**을 존중합니다. GPC 신호가 있으면 Consent Mode가 denied가 되고, Pixel을 로드하지 않으며, 배너도 띄우지 않습니다(QA에서 확인).
- Opt-in 모드로 전환할 수 있습니다(설정).
- 자체 통계(`/api/track`)는 쿠키나 식별자 없이 **집계 카운터만** 저장합니다(IP 저장 안 함, 400일 후 만료). 봇과 헤드리스 브라우저는 제외합니다.
