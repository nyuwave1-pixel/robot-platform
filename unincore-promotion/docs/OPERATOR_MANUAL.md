# 운영자 매뉴얼 — UNI&CORE Promotion CMS

접속: `https://promotion.unincore.com/admin`

| 계정 | 권한 |
|---|---|
| `admin` | 모든 기능: ASIN 변경/검증, 추적 ID, 설정, 제품 초기화 |
| `editor` | 콘텐츠, Amazon/Attribution 링크, 프로모션, FAQ, SEO, 미디어 |

모든 변경은 대시보드 하단의 **Recent changes**에 기록됩니다.

---

## 1. 가장 중요한 원칙: "검증된 것만 공개"

이메일 브리프의 수치 중 원본 자료가 아직 확인되지 않은 항목은 모두 **Pending verification** 상태로 등록되어 있습니다. Pending 항목은 **공개 페이지에 표시되지 않습니다.**

| 제품 | Pending 항목 | 공개 전 필요한 자료 |
|---|---|---|
| 앰플 | 한국 판매 100,000+ 병 | 판매 집계 단위와 기간 |
| 앰플 | 광채 +35.6% / 탄력 +14.3% / 색소 지표 7.2% (7일) | 인체적용시험 성적서(시험기관, 번호, 피험자 수, 측정 항목명) |
| 앰플 | Glutathione 성분 | 미국 라벨 INCI 목록 |
| 마스크 | 한국 누적 1,000만 개 | 박스가 아닌 실제 판매 단위 기준인지 |
| 마스크 | 7일 사용 효과 | 마스크 자체의 시험 자료 (없으면 사용 금지) |
| 파우더 워시 | pH 5~5.5 | 미국 라벨 또는 pH 시험성적서 |
| 파우더 워시 | 비타민 C 유도체 | 미국 라벨 INCI 명칭 |

**확인 방법**

1. 제품 편집 화면에서 해당 항목의 **Source / footnote**에 출처를 정확히 입력합니다(예: "Human application test, KC Lab report #2026-0123, n=21, 7 days").
2. 수치와 표현을 성적서와 비교해 그대로 맞춥니다. 측정 항목명을 바꾸면 안 됩니다.
3. Status를 **Verified (public)**로 바꾸고 Save합니다. 각주로 출처가 공개 페이지에 함께 표시됩니다.
4. **Preview (incl. pending)** 버튼으로 공개 전 화면을 확인할 수 있습니다. Pending 항목은 빨간 배지로 표시됩니다.

> 31일·50°C 안정도 그래프는 실측 데이터가 없어서 만들지 않았습니다. 데이터를 받으면 개발팀에 요청하십시오.

## 2. Amazon 링크 관리

제품 편집 → **Publishing & Amazon links**

- **ASIN**: 모든 링크는 이 ASIN을 가리켜야 합니다. 다른 ASIN이 들어간 URL은 **저장이 거부됩니다**(잘못된 상품 연결 방지).
- **ASIN verified**: 관리자가 실제 Amazon 페이지에서 제품명, 용량, 이미지를 확인한 뒤 체크합니다.
- **Amazon product URL**: 기본 구매 링크입니다.
- **Amazon Attribution link — default / meta / google / email**: Amazon Attribution(Advertising Console)에서 만든 태그 URL을 그대로 붙여 넣습니다. `maas=`, `ref_=aa_maas`, `tag=` 같은 파라미터는 **그대로 보존**됩니다.
  - 방문자가 Facebook/Instagram 광고(utm_source=facebook·instagram 또는 fbclid)로 왔다면 `meta` 링크
  - Google Ads(gclid)로 왔다면 `google` 링크
  - 이메일로 왔다면 `email` 링크
  - 그 외에는 `default` 링크 → 없으면 product URL
- 저장 전에 링크 아래에 ✓/✗ 검증 결과가 바로 표시됩니다.

## 3. BFCM 프로모션

제품 편집 → **Promotion**

| 항목 | 현재 기본값 |
|---|---|
| 기간 | 2026-11-19 00:00 ~ 2026-11-30 23:59 (US Pacific) |
| 할인 | 파우더 워시 20% · 마스크 20% · 앰플 20% |
| 앰플 30% | **미적용**. 확정되면 앰플의 Discount %를 30으로 바꾸고 Headline 문구도 수정 |

- 기간이 되면 상단 띠 배너, 할인 오퍼 블록, 모바일 하단 버튼 문구, 메인 카드의 "20% off" 배지가 **자동으로 표시**됩니다. 종료되면 일반 화면으로 **자동 전환**됩니다. 캐시된 페이지도 브라우저가 1분마다 다시 확인합니다.
- 이 사이트는 할인율 문구만 표시하며 **가격을 계산하지 않습니다.** 최종 가격은 Amazon에서 표시됩니다.
- **시작 전에 Amazon에 Deal/쿠폰이 실제로 등록되었는지 반드시 확인하십시오.** 등록되지 않았다면 "Promotion enabled"를 끕니다.
- 딜 전용 Amazon URL이 있으면 "Promo-specific Amazon URL"에 입력합니다. 프로모션 기간 동안 우선 사용됩니다.

## 4. 이미지와 영상

- **제품 사진**(Hero → Product photo URL): 투명 배경 PNG/WebP, 4:5 비율, 1600px 이상. 입력하지 않으면 일러스트 패키지 이미지가 표시됩니다.
  - 허용 호스트: `*.unincore.com`, Vercel Blob(`*.public.blob.vercel-storage.com`) 또는 저장소의 `/public` 경로
- **Before & After**: 시험 원본 사진만 사용합니다(보정 금지). Day 0/Day 7 라벨, 대체 텍스트(alt), 캡션을 함께 입력합니다.
- **UGC 영상**: MP4(H.264), 세로 9:16, 8MB 이하 권장. 포스터 이미지와 업로드일(YYYY-MM-DD)은 필수입니다. **사용 권한(크리에이터 동의)을 확인한 뒤** Verified로 전환합니다.
- 영상과 Before/After는 Verified 항목이 1개 이상일 때만 해당 섹션이 나타납니다.

## 5. SEO

제품 편집 → **SEO**

- Title은 60자, Description은 155자 이내를 권장합니다. 아래에 구글 검색 결과 미리보기가 표시됩니다.
- 키워드를 반복해서 나열하지 말고 자연스러운 문장으로 작성합니다.
- **Verified Amazon price**: Amazon에 표시된 실제 가격만 입력합니다. 구조화 데이터(Product offers)에만 사용되며, 모르면 비워 둡니다.
- 제품을 **Published 해제**하면 페이지가 404가 되고 sitemap에서도 자동으로 빠집니다.

## 6. UTM 링크 만들기

**UTM Links** 메뉴 → 랜딩 페이지와 채널을 고르고 campaign, content, term을 입력한 뒤 복사합니다.

권장 규칙:

| 파라미터 | 예시 |
|---|---|
| utm_source | `facebook`, `instagram`, `google`, `newsletter` |
| utm_medium | `paid_social`, `cpc`, `email` |
| utm_campaign | `bfcm_2026`, `ampoule_launch_q4` |
| utm_content | `ugc_video_a`, `carousel_ba` (Meta 동적 파라미터 `{{ad.name}}` 사용 가능) |
| utm_term | `women_25_44`, `lookalike_1pct` |

광고별로 제품 페이지 URL을 따로 지정하는 것이 가장 좋습니다. 단축 경로 `/?product=ampoule|mask|wash`도 사용할 수 있으며, 모든 UTM 파라미터가 유지됩니다.

## 7. 대시보드 보는 법

- **Product page views**: 제품 페이지 조회수 / **Amazon clicks**: Amazon 버튼 클릭 수 / **CTR** = 클릭 ÷ 조회
- 제품, 채널(meta/google/email/organic/direct), UTM 캠페인, utm_source, 기기, 버튼 위치(hero/sticky/final/offer…)별로 볼 수 있습니다.
- 집계 기준일은 **US Pacific** 날짜입니다.
- ⚠️ 이 숫자는 **랜딩 페이지 클릭**입니다. **Amazon 구매나 매출이 아닙니다.** 실제 구매와 매출은 Amazon Attribution 리포트에서 확인하고, 같은 캠페인 기준으로 나란히 비교하십시오.
- GA4와 Meta Ads Manager에서도 같은 이벤트명으로 확인할 수 있습니다(docs/TRACKING.md).

## 8. 설정 (관리자)

- GA4 / GTM / Meta Pixel ID를 설정합니다. GTM을 쓰면 GA4 태그는 **GTM 안에서** 설정합니다(중복 집계 방지).
- Consent mode: 미국 기본값은 **Opt-out**입니다(추적은 켜져 있고 방문자가 거부하거나 GPC 신호를 보내면 중단). 더 엄격하게 운영하려면 Opt-in을 선택합니다.
- 상단 공지 띠와 공개 문의 이메일을 설정합니다(이메일이 비어 있으면 Contact 페이지는 메인 사이트로 안내).

## 9. 문제 해결

| 증상 | 조치 |
|---|---|
| 저장 시 "Storage is not configured" | Vercel에 Upstash Redis가 연결되었는지 확인 (DEPLOYMENT.md 2단계) |
| 저장했는데 페이지가 그대로임 | 몇 초 후 새로고침합니다. 그래도 같으면 브라우저 캐시를 지우고 확인합니다 |
| "URL points to ASIN …" 오류 | 다른 제품 링크를 붙여 넣은 것입니다. 링크를 다시 확인합니다 |
| 로그인 "Too many attempts" | 10분 뒤 다시 시도합니다 |
| 제품을 원래 상태로 되돌리기 | 관리자 계정 → 제품 편집 → Reset |
