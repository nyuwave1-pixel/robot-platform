# GA4 설정 체크리스트 (promotion.unincore.com)

- 속성: 계정 `387197170` / 속성 `527901588` (측정 ID `G-QDK6Q436G5`, us.unincore.com 쇼핑몰과 같은 속성)
- 사이트 코드에서 보내는 데이터는 이미 최적화되어 있습니다. 아래는 **GA4 관리 화면에서 직접 클릭해야 하는 설정**입니다.

## 1. 사이트가 보내는 이벤트

| GA4 이벤트 | 언제 | 주요 파라미터 |
|---|---|---|
| `page_view` | 페이지 방문(화면 전환 포함) | `content_group` |
| `view_item` | 제품 페이지 조회 (GA4 전자상거래 표준) | `items`, `product_key` |
| `product_detail_view` | 제품 페이지 조회 (자체 집계용) | `product_key`, `channel` |
| `amazon_cta_click` | 아마존 구매 버튼 클릭 | `product_key`, `cta_location`, `link_url`, `link_domain`, `channel` |
| `official_details_open` | "공식 상세페이지 보기" 펼침 | `product_key` |
| `faq_open` | FAQ 질문 펼침 | `label`(질문) |
| `video_start` | 브랜드 영상 재생 | `label`(영상 제목) |
| `view_promotion` | 블랙프라이데이 등 프로모션 노출 | `product_key` |

모든 이벤트 공통: `content_group`(home / product / info), `channel`(meta / google / email / organic / direct), `event_id`.
`cta_location` 값: hero, sticky, final, offer, results, details, amazon-panel, related, scene, ritual, collection.

## 2. 주요 이벤트(전환) 지정 — 꼭 하세요

관리 → 데이터 표시 → **이벤트** → `amazon_cta_click` 행의 **주요 이벤트로 표시** 켜기.
(이벤트가 한 번 이상 들어와야 목록에 보입니다. 사이트에서 아마존 버튼을 한 번 눌러 보세요.)

## 3. 맞춤 측정기준 등록 — 보고서에서 제품·위치별로 보려면 필요

관리 → 데이터 표시 → **맞춤 정의** → 맞춤 측정기준 만들기 (범위: **이벤트**)

| 측정기준 이름 | 이벤트 매개변수 |
|---|---|
| Product | `product_key` |
| CTA location | `cta_location` |
| Channel | `channel` |
| Link domain | `link_domain` |

`content_group`은 GA4 기본 측정기준 **콘텐츠 그룹**으로 자동 수집되므로 등록하지 않아도 됩니다.

## 4. 데이터 보관 기간

관리 → 데이터 수집 및 수정 → **데이터 보존** → 이벤트 데이터 보존 **14개월**로 변경 (기본 2개월).

## 5. 프로모션 사이트만 보기

쇼핑몰과 같은 속성이므로 보고서에서 필터를 쓰세요.
- 보고서 → 필터 추가 → **호스트 이름** = `promotion.unincore.com`
- 자주 본다면: 탐색 → 자유 형식 → 세그먼트 "호스트 이름 = promotion.unincore.com" 저장

## 6. 내부 트래픽 제외 (선택)

관리 → 데이터 스트림 → 스트림 선택 → 태그 설정 구성 → **내부 트래픽 정의**에 사무실 IP 추가 →
관리 → 데이터 필터 → "Internal Traffic" 필터를 **활성**으로 변경.

## 7. 실시간 확인 / 디버그

- 보고서 → **실시간**: 사이트 접속 후 1분 안에 표시됩니다.
- 관리 → **DebugView**: 사이트 주소 뒤에 `?ga_debug=1`을 붙여 접속하면 그 브라우저 탭의 이벤트가 파라미터와 함께 실시간으로 보입니다.
  예) https://promotion.unincore.com/products/vitamin-c-13-5-ampoule?ga_debug=1

## 8. 광고 캠페인 링크

Meta·Google 광고 링크에는 UTM을 꼭 붙이세요. 예: `https://promotion.unincore.com/?product=mask&utm_source=facebook&utm_medium=paid_social&utm_campaign=bfcm_2026` (`?product=`는 해당 제품 페이지로 바로 이동합니다).
UTM이 붙은 방문은 `channel` 값과 GA4 기본 "세션 소스/매체"에 모두 반영됩니다.

## 참고: 아마존 이후 구매는 GA4에 안 보입니다

구매는 Amazon.com에서 일어나므로 GA4가 알 수 없습니다. 실제 판매 기여는 **Amazon Attribution** 링크로 측정하세요.
Attribution 링크를 만들어 주시면 `src/content/products.ts`의 `attribution`에 채널별(meta / google / email)로 넣고, 사이트가 방문자 채널에 맞는 링크로 자동 연결합니다.
