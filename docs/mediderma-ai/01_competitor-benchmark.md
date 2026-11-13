# 01. 글로벌 AI 피부 분석 경쟁사 벤치마크

- 대상 프로젝트: MEDIDERMA AI SKIN ANALYSIS (UNI&CORE / DERMA HOME 연동 웹 기반 사진 피부 분석)
- 조사 기준일: 2026-11-13
- 조사 방법: 각 사 공식 사이트·공개 기술 문서·공식 보도자료를 직접 열람(WebFetch)하거나 공식 도메인 검색 결과로 확인. 기억에 의존한 서술은 넣지 않았다.
- 표기 규칙
  - **[벤더 주장]**: 제조사 마케팅 문구이며 독립 검증 근거를 공개 자료에서 찾지 못한 내용
  - **[문서 확인]**: 공개 기술 문서(API 문서, 개발자 문서)에 명시된 내용
  - **공개 자료에서 확인 불가**: 이번 조사에서 열람한 공식 자료에 해당 내용이 없음(존재하지 않는다는 뜻이 아님)
  - 각 항목 끝의 `[S#]`는 문서 하단 출처 목록 번호

> 주의: 벤더 페이지는 수시로 바뀌며, 같은 회사 안에서도 페이지마다 수치가 다르다(예: 분석 항목 수, 학습 데이터 규모). 불일치는 숨기지 않고 그대로 적었다.

---

## 1. Perfect Corp — YouCam AI Skin Analysis

공식 제품 페이지와 YouCam API 개발자 문서(yce.perfectcorp.com)가 모두 공개되어 있어, 조사 대상 중 기술 사양이 가장 구체적으로 확인된다.

| 항목 | 확인 내용 |
|---|---|
| 얼굴 인식·랜드마크 | 제품 페이지는 "facial detection technology", "computer vision", "skin segmentation and feature detection" 수준으로만 설명. 랜드마크 개수·모델 구조는 공개 자료에서 확인 불가. 정면+좌+우 3장으로 "180° Full Face Mapping" 제공 [벤더 주장] [S1] |
| 영역별 분석 | [문서 확인] HD 모드에서 모공은 forehead / nose / cheek / whole, 주름은 forehead / glabellar / crowfeet / periocular / nasolabial / marionette / whole 로 하위 영역 점수 제공 [S2] |
| 분석 항목 | 제품 페이지는 "16 skin concerns"라고 쓰지만 나열된 이름은 15개(Spots, Dark Circles, Radiance, Eyebags, Tear Trough, Redness, Pores, Texture, Oiliness, Droopy Upper/Lower Eyelid, Wrinkles, Moisture, Firmness, Acne). API 제품 페이지는 "over 15" [S1][S4]. [문서 확인] API 출력 카테고리(SD): wrinkle, droopy_upper_eyelid, droopy_lower_eyelid, firmness, acne, moisture, eye_bag, dark_circle_v2, age_spot, radiance, redness, oiliness, pore, texture — 14개. HD는 동일 항목에 `hd_` 접두 [S2] |
| 점수 체계 | [문서 확인] 항목별 `raw_score`(1–100)와 `ui_score`(1–100 정수). 문서가 직접 "We adjust the raw scores to produce more favorable results"라고 명시 — 즉 화면용 점수는 사용자에게 유리하게 보정된 값. 종합 점수 `all`(1–100), `skin_age`("일반 인구 분포 대비 AI 추정 피부 나이") 제공 [S2] |
| 촬영 품질 검증 | [문서 확인] 입력 규격: 긴 변 ≤ 4096px, 짧은 변 ≥ 480px(SD) / ≥ 1080px(HD), 10MB 미만, jpg/png. 얼굴이 이미지 폭의 약 60–80%, 정면·무표정·입 다물고 눈 뜬 상태, 밝고 균일한 조명, 안경·앞머리·메이크업 제거 권장. 오류 코드: `error_below_min_image_size`, `error_src_face_too_small`, `error_src_face_out_of_bound`, `error_lighting_dark` 등. JS Camera Kit이 실시간으로 얼굴 유무, 위치(good / notgood / toosmall / outofboundary), 정면 여부, 조명(good / ok / notgood)을 판정하고 조건 충족 시 자동 촬영. HD 모드는 가로 2560px 이상 웹캠 요구 [S2] |
| 전후 비교·트래킹 | B2B 앱 "Skincare Pro"가 고객 프로필·분석 이력·전후 사진을 CRM에 저장하고 종합 점수로 경과 추적 [벤더 주장] [S5]. API 자체는 1회 분석 결과만 반환하며 시계열 비교 로직은 문서에서 확인 불가 [S2] |
| 시각화 | [문서 확인] 항목별 마스크 PNG(`output_mask_name`, `mask_urls`), `enable_mask_overlay` 옵션으로 원본에 합성한 단일 이미지 생성 [S2]. 3D 시각화는 공개 자료에서 확인 불가 |
| 시뮬레이션 | "AI Skin Simulation" API(최대 7개 피부 고민에 대한 전후 시뮬레이션, 강도 100단계 조절), 클리닉용 "Aesthetic Simulator"(27종 시술 시뮬레이션) [벤더 주장] [S5][S6] |
| 추천·구매 연결 | "Recommender"가 맞춤 루틴·제품 추천 생성 [벤더 주장]. 추천 규칙의 구체적 로직은 공개 자료에서 확인 불가 [S1] |
| API/SDK·과금 | [문서 확인] REST API(S2S), Bearer 토큰, 파일 생성 → presigned URL 업로드 → task 실행 → 폴링. 5 QPS 제한. SD/HD 항목 혼용 불가. 과금은 unit 차감 방식: SD 1–4개 항목 9 unit, SD 5–7개 항목 12 unit(성공 시에만 차감). HD unit 단가와 unit의 화폐 가격은 이번 조사에서 확인 불가(가격 페이지 열람 실패) [S2]. Skincare Pro는 월 $199부터, Aesthetic Simulator는 라이선스당 월 $160부터로 표기 [S5] |
| 개인정보·이미지 저장 | [문서 확인] 업로드 파일 24시간 보관, 결과는 완료 후 24시간 보관(문서 내 다른 대목에는 "결과 파일 7일 유효, 다운로드 링크 약 2시간" 서술도 있어 불일치) [S2]. SDK 개인정보처리방침: AWS 클라우드 서버에 저장, 일본 등 타국 이전 가능, "필요한 최단 기간" 보관 후 삭제/익명화. 생체정보(biometric)·온디바이스 처리·학습 활용 여부는 방침에 명시 없음 [S3]. 제품 페이지는 "fully GDPR and HIPAA compliant"(Vanta 인증 배지) [벤더 주장] [S1] |
| 정확도 주장 | "95% clinical accuracy", "95% test-retest reliability rate"(의학 연구 인용), "over 80% correlation with physician evaluations", "70,000장 이상의 medical-grade 이미지로 학습" [벤더 주장] [S1][S4]. 재현성 수치는 ICC·Cronbach's alpha 기반이라고 자사 페이지에서 설명 [S5]. 근거 수준: 자사 인용 연구. 해당 논문 원문은 이번 조사에서 직접 확인하지 못함. 경쟁사 비교표(자사 "High" vs 타사 "Low")는 자체 작성 자료 |

**핵심 시사점**: 공식 문서가 "표시용 점수는 유리하게 보정한다"고 스스로 밝히고 있다. 점수의 절대값보다 동일 조건 반복 측정의 일관성이 실질 가치라는 뜻이다.

---

## 2. Haut.AI — Face Skin Analysis 3.0 / LIQA / SkinGPT

공개 개발자 문서(docs.saas.haut.ai, docs.liqa.haut.ai)가 상세하다. 특히 촬영 품질 검증과 익명화 설계가 문서로 확인된다.

| 항목 | 확인 내용 |
|---|---|
| 얼굴 인식·랜드마크 | [문서 확인] Face Metrics 2.0에 "Facial Landmarks", "Quality"가 기술 알고리즘으로 별도 존재. 랜드마크 개수·모델은 공개 자료에서 확인 불가 [S9] |
| 영역별 분석 | [문서 확인] whole face, forehead, nose, left/right eye, perioral, left/right cheek, under-eye, T-zone, U-zone. 일부 항목만 영역별 값 제공(예: 모공 수 — nose/forehead/양 볼, 붉은기 — nose/forehead/perioral/양 볼) [S8] |
| 분석 항목 | [문서 확인] Face Skin Analysis 3.0: Breakouts, Dark Circles, Eyes Age, Hydration, ITA, Lines, Perceived Age, Pigmentation, Pores, Quality, Redness, Sagging, Skin Tone, Skin Type, Under Eye Puffiness, Uniformness. 유료 "Advanced Parameters"로 세부 항목(구진/농포/여드름 후 색소침착, 기미/주근깨/점/일광흑자, 주름 부위별 개수·길이, 확대 모공, 자극 등) 제공 [S8]. 마케팅 페이지는 "150+ biomarkers", "94 algorithms", "20+ metrics", "15+ metrics" 등 서로 다른 수치를 사용 [S7][S12] |
| 점수 체계 | [문서 확인] score 1–100, grade 1–5, skin condition tag, 예측 나이(Perceived Age, Eyes Age), ITA(−90°~+90°)와 L\*a\*b\* 값 [S8]. 구버전 Face Metrics 2.0에서는 Hydration·Uniformness가 "(experimental)"로 표기되어 있었고, 2.0은 2026년 말 지원 종료 예정 [S9] |
| 촬영 품질 검증 | [문서 확인] LIQA(Live Image Quality Assurance): 웹 컴포넌트(`<hautai-liqa>`) 형태의 스마트 카메라. 신체 부위 가시성, 프레임 내 위치, 조명 강도·방향을 실시간 평가. 프리셋 `face`(정면 1장), `face-180`(정면·좌·우 3장), `hair`. 조명 검증 강도 옵션(default / strict / adaptive / none). 결과물은 JPEG(품질 100%) [S10]. 분석 API의 Quality 파라미터: 얼굴·피부 검출, 머리 자세, 해상도, 블러, 가림, 안경, 앞머리, 노출, 조명 균일도, 그림자 + 1–100 품질 점수. "저품질 이미지도 분석은 중단되지 않으며 임계값은 사용자가 정해야 함" [S8]. 권장 입력 2500×2500px 이상, 얼굴이 프레임의 85% 이상 [S8]. LIQA 요구 사양: iOS 16+/Android 12+, WebAssembly, 데스크톱은 테스트 용도로만 권장 [S11][S10]. "LIQA 사용 시 87%의 이미지가 분석 가능 품질, 안내문만 제공 시 32%" [벤더 주장, 연구 출처 미명시] [S7][S12] |
| 전후 비교·트래킹 | [문서 확인] Subject 단위로 데이터를 묶는 구조(Consumer App에서는 기기+브라우저 지문으로 자동 식별, API에서는 수동 식별) [S13]. 임상 연구용 Studies 기능 존재 [S13]. 소비자용 진행 추적 전용 화면은 마케팅 페이지에서 "지표를 시간에 따라 추적 가능" 수준으로만 언급 [S12] |
| 시각화 | [문서 확인] 항목별 "vector mask for detected features", `predicted_images`(original / anonymised / aligned) [S8]. 히트맵·3D는 공개 자료에서 확인 불가 |
| 시뮬레이션 | SkinGPT: 생성형 AI로 제품·성분·노화·환경 효과를 사진에 시뮬레이션. "3백만 데이터 포인트로 학습", "과학 데이터 기반" [벤더 주장]. 제품 페이지에서 "시뮬레이션 결과이며 보장되지 않음"이라는 고지 문구는 확인되지 않았고, 정확도 지표·동료심사 근거도 제시되지 않음 [S14] |
| 추천·구매 연결 | [문서 확인] Recommendation System 2.0: Product Inventory(쇼핑몰 상품 가져오기) + Product Tags(제품이 다루는 피부 고민) + User Tags(분석 결과에서 나온 피부 타입·고민)를 매칭. 결과는 Routine view(단계별 루틴) 또는 List view(적합도 순). 세부 규칙은 문서에 없음 [S15]. Shopify·WooCommerce 상품 자동 동기화, Skin.Chat에서 장바구니 담기 [벤더 주장] [S7][S12] |
| API/SDK·과금 | [문서 확인] SaaS 대시보드 + REST API(Swagger 공개), LIQA 라이선스 키, iframe/링크/QR 임베드, WebView 기반 네이티브 통합 가이드 [S10][S13]. 일부 기능(추천 API, LIQA 라이브러리 등)은 Professional 플랜 전용 [S11][S15]. 가격은 "사용량 기반", 금액 비공개 [S7][S12] |
| 개인정보·이미지 저장 | [문서 확인] Haut.AI는 GDPR상 processor, 고객사가 controller. 데이터는 DPA 유효 기간 동안 보관하되 고객이 보관 기간을 제어. Advanced+ 플랜은 데이터셋별 최소 24시간 보관 설정, Professional 플랜은 모든 알고리즘 처리 직후 삭제 가능 [S16]. LIQA는 "Skin Atlas" 방식으로 **사용자 기기에서** 이미지를 익명화(피부 마스크 밖이 투명한 정렬 얼굴 PNG) 가능하며, 분석 API는 익명화 이미지 입력을 지원 [S10][S8]. LIQA는 liveness·생체 인증 기능을 제공하지 않는다고 명시 [S10]. "얼굴 이미지를 클라우드에 보관하지 않음", "GDPR 제9조 충족" [벤더 주장 — 같은 페이지 안에서 "의무를 줄여준다"는 표현과 혼재] [S12] |
| 정확도 주장 | "98% clinical-grade diagnostic accuracy" [벤더 주장 — 연구명·표본·측정 방식 미공개] [S7][S12]. 학습 데이터는 "3M+ data points", "3백만 장", 문서에서는 "2천만 장 이상"으로 서로 다름 [S7][S8]. [문서 확인] "알고리즘은 임상 평가 기준에 대해 검증됨", "의료기기로 인증되지 않음", "전문 의료 조언을 대체하지 않음", 수치 정확도는 문서에 없고 담당자 문의로 안내 [S8][S17]. 자체 벤치마크 사이트 SkinBench 운영(결과 내용은 이번 조사에서 미확인) [S7] |

**핵심 시사점**: (1) 품질 검사 결과를 분석 중단이 아니라 "품질 점수 + 플래그"로 돌려주는 구조, (2) 기기 내 익명화 후 피부 픽셀만 서버 전송하는 구조는 MEDIDERMA의 프라이버시 설계에 직접 참고할 만하다. 단, 구현을 복제하는 것이 아니라 원칙만 참고한다.

---

## 3. Revieve — AI Skin Diagnostics / Skin Advisor

공식 사이트는 마케팅 중심이며 공개 개발자 문서는 찾지 못했다. 최초 요청 URL(`/products/ai-skincare-advisor`)은 404였고, 현재 구조의 기술 소개·FAQ 페이지에서 확인했다.

| 항목 | 확인 내용 |
|---|---|
| 얼굴 인식·랜드마크 | "computer vision" 수준 언급. 구체 기술은 공개 자료에서 확인 불가 [S18] |
| 영역별 분석 | T-Zone, Cheek-Zone, U-Zone 평가 [벤더 주장] [S18] |
| 분석 항목 | "200+ AI-powered skin health metrics"(과거 보도자료는 100+/120+, Boots 사례는 "약 20개 주요 지표 + 200개 이상 하위 지표"). 범주: 노화, 수분, 색소, 민감성, 피부 타입, 전반적 피부 건강. 브랜드별 커스텀 지표 추가 가능 [벤더 주장] [S18][S20] |
| 점수 체계 | "per-attribute skin scores" 수준만 확인. 척도·산식은 공개 자료에서 확인 불가 [S18] |
| 촬영 품질 검증 | 조명, 안경, 얼굴 위치에 대한 실시간 셀피 가이드, 원형 촬영 가이드 UI [벤더 주장]. 임계값·오류 조건은 공개 자료에서 확인 불가 [S18][S19] |
| 전후 비교·트래킹 | Skin Advisor가 "시간에 따른 진행 추적" 지원 [벤더 주장] [S19]. 비교 알고리즘(정렬·조명 보정 등)은 공개 자료에서 확인 불가 |
| 시각화 | 결과의 "clear visual representation", LiveAR 오버레이 [벤더 주장]. 마스크·히트맵 사양은 공개 자료에서 확인 불가 [S18][S21] |
| 시뮬레이션 | Skin Transformation Experience: Day 1 → Week 12 전후 슬라이더, 주차별 예상 개선 표시. 페이지에서 "projected skin results", "a representation of potential cosmetic effects", "Not a guarantee of results", "Not a clinical efficacy measurement, medical device"로 고지. 다만 예상 이미지 라벨이 "Week 12 — Results"여서 실제 결과로 오인될 여지가 있음(조사자 관찰) [S21] |
| 추천·구매 연결 | 추천 엔진이 "피부 진단, 얼굴 분석, 소비자 의도, 선호"를 결합. 제품 데이터를 피부 고민에 매핑하고 결과를 SKU·상품 상세 페이지로 연결 [벤더 주장] [S19][S20] |
| API/SDK·과금 | "Website Integration, Mobile Integration, In-Store Diagnostics, API Integration", "no-code plug-ins and optional APIs" [벤더 주장]. 공개 API 문서와 가격은 확인 불가(데모 예약 안내) [S18][S19] |
| 개인정보·이미지 저장 | FAQ: "고객 이미지는 안전하게 처리되며 모델 학습에 사용되지 않고 고객사 간 공유되지 않음", "Biometric data is never stored", "GDPR·CCPA 준수", 데이터 소유권은 브랜드 [벤더 주장] [S19]. 개인정보처리방침: 고객사가 controller, Revieve는 processor. 방침 자체는 임베드 솔루션에서 처리되는 데이터에 적용되지 않으며 이미지 보관 기간은 명시 없음 [S22] |
| 정확도 주장 | "dermatologist-grade precision", "matching professional tools in accuracy", "scientifically validated", "15M+ 이미지로 학습", "모든 Fitzpatrick 타입 포함" [벤더 주장 — 연구·수치 근거 미공개] [S18][S19] |

---

## 4. Canfield Scientific — VISIA Skin Analysis (VISIA 3D)

소프트웨어 서비스가 아니라 전용 촬영 장비 기반 시스템이다. 웹 사진 분석이 따라갈 수 없는 영역(편광·UV 촬영, 고정 자세)이 무엇인지 보여주는 기준점으로 본다. 최초 요청 URL은 404였고 현재 제품 페이지에서 확인했다.

| 항목 | 확인 내용 |
|---|---|
| 얼굴 인식·랜드마크 | 알고리즘 수준 설명은 공개 자료에서 확인 불가. 2026-03 보도자료는 "AI-driven VISIA skin analysis"라고만 표현 [S24] |
| 영역별 분석 | 좌·우·정면 표준 뷰 및 3D 전체 얼굴 촬영 [S23][S24]. 영역 분할 방식은 공개 자료에서 확인 불가 |
| 분석 항목 | Spots, Wrinkles, Texture, Pores, UV Spots, Brown Spots, Red Areas, Porphyrins — 8개 [S23] |
| 촬영 조건 | **표준광, 교차편광, UV 조명**으로 표면·표면 아래 상태 기록. RBX 기술로 Red·Brown 성분 분리. 자동 초점, 자동 화이트밸런스 보정, 높이 조절 리프트, 헤드레스트로 자세 고정, "guided client positioning" [S23][S24] |
| 점수 체계 | TruSkin Age: "세계 최대 피부 특징 데이터베이스"와 비교해 피부 상태·나이 평가 [벤더 주장]. 현재 제품 페이지에서 percentile 표기는 확인되지 않음 [S23] (독립 연구에서는 percentile·feature count·absolute score 출력을 다룸 [S25]) |
| 전후 비교·트래킹 | 좌우 나란히 비교 또는 비교 슬라이더, 그래프·수치 제공, 두 이미지를 동시에 확대·이동 [S23] |
| 시각화 | 3D 색상 거리 맵(윤곽 변화), 원클릭 부피 차이 측정, Gray Mode, Contouring [S23] |
| 시뮬레이션 | 다인종 노화 연구 기반 80세까지 노화 시뮬레이션, 3D Sculptor 시술 결과 시뮬레이션 [벤더 주장] [S23] |
| 추천·구매 연결 | Industry Brand Library에서 200개 이상 스킨케어 제품·시술 선택, 맞춤 인쇄 리포트. 온라인 구매 연결은 공개 자료에서 확인 불가 [S23] |
| API/SDK·과금 | Windows/Mac 워크스테이션 소프트웨어, 별매 iPad 앱. 공개 API/SDK와 가격은 확인 불가(영업 문의) [S23] |
| 개인정보·이미지 저장 | 로컬 저장 구조. "클라우드 스토리지(Azure, AWS, Google Cloud 등)는 데이터 저장용으로 지원하지 않으며 백업 용도로만 사용 가능" [S23] |
| 정확도 주장 | 제품 페이지에 정량 정확도 수치 없음. 독립 연구(Henseler, 단일 기관, 참가자 19명 규모)가 재현성·정밀도를 평가하여 "만족스러움"으로 결론 — 표본이 작고 피부과 전문의 등급과의 비교가 아닌 점에 유의 [S25]. VISIA를 측정 도구로 쓴 스킨케어 임상 논문 존재 [S26] |

---

## 5. 기타 솔루션

### 5-1. L'Oréal × ModiFace — Vichy SkinConsult AI

- 분석 항목: 눈가 주름, 탄력 저하, 잔주름, 광채 부족, 다크스팟, 깊은 주름, 모공 — 노화 징후 7개 [S27]
- 학습 데이터: L'Oréal R&I의 Skin Aging Atlas 연구에서 나온 임상 이미지 6,000장 + 4가지 조명 조건에서 촬영한 스마트폰 셀피 4,500장 이상(아시아·백인·아프리카계 미국 여성 3개 그룹). Atlas 연구는 프랑스·중국·일본·인도·미국의 20–80세 남녀 4,000명 대상 [벤더 공식 발표] [S27]
- 검증 주장: "피부과 전문의와 함께 개발", "표정·촬영 조건(조명, 휴대폰 위치)이 달라도 정확한 결과" [벤더 주장 — 수치 미공개] [S27]
- 추천: 피부 강점·우선순위 안내 후 맞춤 제품 루틴 제안 [S27]
- 출시: 2019년 1월 캐나다 [S27]
- 랜드마크, 품질 검증 세부, API, 가격, 이미지 저장 정책: 공개 자료에서 확인 불가
- 참고: 조사한 공식 자료는 2019년 발표문이며 현재 버전 사양은 확인하지 못했다(L'Oréal 제품 소개 URL은 404).

### 5-2. Neutrogena Skin360

- **공식 사이트(skin360.neutrogena.com) 직접 열람은 403으로 실패.** 아래는 공식 도메인 검색 결과 요약과 언론 보도에 근거한다.
- "100,000개 이상의 피부 픽셀로 2,000개 이상의 얼굴 속성 분석", "1만 장 이상의 실제 인물 이미지 데이터베이스" [벤더 주장] [S28]
- 웹 기반(앱 설치 불필요). 계정이 필요 없어 도구 안에 결과가 저장되지 않으며, 주요 고민·점수·추천 제품을 이메일로 발송 [S28]
- 개인정보: "얼굴 이미지를 보관하지 않으며 처리 후 스캔을 삭제" [벤더 주장] [S28]
- 기술 파트너: Perfect Corp 기술 사용으로 보도됨 [S29]
- 언론 보도에 따르면 Neutrogena는 Skin360이 의사 진료를 대체한다고 주장하지 않음 [S29]

---

## 6. 경쟁사 비교표

| 구분 | Perfect Corp | Haut.AI | Revieve | Canfield VISIA | L'Oréal SkinConsult AI |
|---|---|---|---|---|---|
| 형태 | 클라우드 API + SDK + B2B 앱 | SaaS + API + 웹 카메라 컴포넌트 | 임베드 플러그인 + API | 전용 촬영 장비 + 데스크톱 SW | 자사 브랜드 웹 도구 |
| 입력 | 스마트폰/웹캠 RGB 사진 | 스마트폰 RGB 사진(1장 또는 3장) | 셀피 | 표준광·교차편광·UV 다중 촬영 | 셀피 |
| 분석 항목 수 | 14(문서) / 15–16(마케팅) | 16개 파라미터(문서) + 고급 세부 항목 | "200+ 지표"(주장) | 8 | 7 |
| 점수 척도 | 1–100 (raw / 보정 ui) | score 1–100, grade 1–5 | 확인 불가 | TruSkin Age, 수치·그래프 | 확인 불가 |
| 영역별 분석 | 모공 4영역, 주름 7영역(HD) | 11개 영역 | T/Cheek/U zone(주장) | 좌·우·정면, 3D | 확인 불가 |
| 촬영 품질 검증 | 실시간 위치·정면·조명 판정 + 오류 코드 | LIQA 실시간 가이드 + Quality 점수(1–100) | 실시간 가이드(주장) | 하드웨어로 조건 고정 | 다조건 학습으로 대응(주장) |
| 시각화 | 항목별 마스크 PNG, 오버레이 | 벡터 마스크, 정렬·익명화 이미지 | AR 오버레이(주장) | 3D 색상 거리 맵, 슬라이더 | 확인 불가 |
| 전후 비교 | Skincare Pro CRM 이력 | Subject 단위 데이터셋, Studies | "진행 추적"(주장) | 나란히/슬라이더 비교, 그래프 | 확인 불가 |
| 가상 시뮬레이션 | Skin Simulation API | SkinGPT(생성형) | Skin Transformation(12주 예상) | 노화·시술 시뮬레이션 | 확인 불가 |
| 추천·구매 | Recommender | 태그 매칭 추천 + Shopify/WooCommerce | SKU·PDP 연결 | 제품·시술 라이브러리, 인쇄 리포트 | 제품 루틴 |
| 공개 API 문서 | 있음(상세) | 있음(상세) | 찾지 못함 | 없음 | 없음 |
| 가격 공개 | unit 차감 규칙만 공개, 앱은 월 $199~ | 비공개(사용량 기반) | 비공개 | 비공개 | 해당 없음 |
| 이미지 보관 | 업로드·결과 24시간(문서) | 고객 제어, 처리 직후 삭제 옵션, 기기 내 익명화 | "생체정보 미저장"(주장) | 로컬 저장, 클라우드 미지원 | 확인 불가 |
| 정확도 근거 수준 | 자사 인용 연구(ICC 등), 원문 미확인 | 수치 주장만, 방법 미공개 | 수치 근거 미공개 | 소규모 독립 연구 존재 | 자사 발표, 수치 미공개 |
| 의료기기 아님 고지 | 확인 불가 | 문서에 명시 | 시뮬레이션 페이지에 명시 | 확인 불가 | 확인 불가 |

---

## 7. 실제 구현 가능한 기술 vs 검증이 필요한 기술

아래 분류는 경쟁사 공개 문서에서 확인된 사실(무엇을 입력으로 받고 무엇을 출력하는가)에 근거한 **조사자의 판단**이다.

### 7-1. RGB 웹 사진만으로 구현 가능한 기술

| 기술 | 근거 | MEDIDERMA 구현 메모 |
|---|---|---|
| 얼굴 검출·랜드마크·피부 영역 분할 | Perfect Corp, Haut.AI 모두 일반 RGB 사진에서 수행 [S2][S8] | 브라우저 내 추론(WebAssembly/WebGL)으로 가능. Haut.AI LIQA가 웹 컴포넌트로 동작하는 것이 선례 [S10] |
| 촬영 품질 검증(얼굴 크기·위치·정면 여부·밝기·조명 균일도·블러·가림·안경·앞머리) | 두 회사 문서에 검사 항목과 오류 코드가 명시됨 [S2][S8] | 가장 먼저 만들 기능. 통과/실패가 아니라 품질 점수를 결과와 함께 저장 |
| 영역별(이마·코·볼·눈가·입가·T/U존) 지표 산출 | Haut.AI 11개 영역, Perfect Corp 하위 영역 [S2][S8] | 랜드마크 기반 ROI 정의로 구현 |
| 붉은기·색소·균일도·모공·결·주름의 **가시성 지수** | 모든 경쟁사가 RGB에서 산출 | "측정값"이 아닌 "사진에서 보이는 정도의 지수"로 명명. 색공간(L\*a\*b\*) 기반 지표는 Haut.AI ITA 출력이 선례 [S8] |
| 마스크·오버레이 시각화 | 두 회사 모두 마스크 이미지 반환 [S2][S8] | Canvas 오버레이로 구현 |
| 동일인 전후 비교(정렬 후 나란히/슬라이더) | VISIA의 비교 슬라이더, 동시 확대·이동 [S23] | 랜드마크 정렬 + 촬영 품질이 유사한 쌍만 비교 허용 |
| 태그 매칭 방식 제품·케어 추천 | Haut.AI 문서의 Product Tags ↔ User Tags 매칭 [S15] | 규칙 기반으로 시작하면 설명 가능성 확보 |
| 기기 내 전처리·익명화 | Haut.AI LIQA의 기기 내 익명화 [S10] | 원본 얼굴을 서버에 올리지 않는 구조가 기술적으로 가능 |

### 7-2. 검증 또는 하드웨어가 필요한 기술

| 기술 | 이유 | 권장 처리 |
|---|---|---|
| 수분·유분·탄력·콜라겐의 **실측** | RGB 사진은 표면 외관만 담는다. Haut.AI는 구버전에서 Hydration을 "experimental"로 표기했고 [S9], VISIA는 표면 아래 정보를 위해 교차편광·UV 조명을 따로 쓴다 [S23] | "사진 기반 추정"으로 표기하거나 제외. 실측을 주장하려면 측정 기기(코니오미터 등)와의 상관 연구 필요 |
| UV 스팟, 포르피린, 표면 아래 색소·혈관 | VISIA의 UV·편광 촬영 전용 항목 [S23] | 웹 사진으로는 제공하지 않음 |
| 피부 나이 | Perfect Corp는 "일반 인구 분포 대비 AI 추정" [S2], VISIA는 자체 DB 비교 [S23]. VISIA 독립 연구에서도 재촬영 간 수 년 단위 차이 보고 [S25] | 참고용 추정치로만 제공하거나 초기 버전에서 제외 |
| "임상 등급", "피부과 전문의 수준", "N% 정확도" 표현 | 조사한 모든 벤더가 수치를 내세우지만 방법·표본을 공개한 경우가 드물다 [S1][S12][S18] | 자체 검증 연구(반복 측정 재현성, 전문가 등급과의 일치도) 전에는 사용 금지 |
| 다양한 피부톤에서의 동등 성능 | 벤더들은 "모든 피부톤 지원"을 주장하나 근거 수치 미공개 [S12][S19] | 한국인 피부톤 중심으로 먼저 검증하고 지원 범위를 명시 |
| 조명·기기 변화에 강건한 시계열 추적 | 장비형(VISIA)은 하드웨어로 조건을 고정한다 [S23]. 웹에서는 조건이 매번 달라진다 | 촬영 조건 일치 여부를 함께 표시하고, 조건이 다르면 수치 변화 해석을 제한 |
| 제품·기기 사용 효과 시뮬레이션 | Revieve는 "보장 아님·임상 효능 측정 아님"을 고지 [S21], Haut.AI SkinGPT 페이지에서는 고지 문구가 확인되지 않음 [S14] | 임상 데이터 없이는 제공하지 않거나 "가상 시뮬레이션"을 이미지 위에 상시 표기 |
| 질환 판별(여드름 중증도 진단, 기미 진단 등) | Haut.AI 문서도 "의료기기 인증 아님, 의료 조언 대체 불가" 명시 [S8][S17] | 진단 표현 금지. 국내 의료기기·표시광고 규제는 별도 법무 검토 필요(본 조사 범위 밖) |

---

## 8. MEDIDERMA 차별화 시사점

1. **기기 연동 케어 가이드가 공백 지대다.** 조사한 경쟁사의 추천은 모두 "제품(SKU) 추천"이거나 클리닉 시술 추천이다. 분석 결과를 홈케어 디바이스의 모드(RF / 초음파 / 이온토포레시스), 부위, 사용 빈도 안내로 연결하는 사례는 공개 자료에서 확인되지 않았다. 영역별 지표 → DERMA HOME 부위별 케어 루틴 매핑이 고유 가치가 될 수 있다. 단, 기기 효능 표현은 자사 임상·인증 범위 안에서만 사용한다.
2. **온디바이스 처리와 프라이버시를 기본값으로.** Perfect Corp는 서버 업로드 후 24시간 보관, Haut.AI는 기기 내 익명화 옵션, Neutrogena는 "처리 후 삭제", VISIA는 로컬 저장이다. MEDIDERMA는 랜드마크·품질 검사·지수 산출을 브라우저 안에서 수행하고 원본 사진을 서버로 보내지 않는 구조를 기본으로 하면 가장 강한 프라이버시 포지션을 갖는다. 얼굴 이미지는 민감정보 성격이 있으므로 저장이 필요한 기능(전후 비교)은 명시적 동의와 삭제 기능을 전제로 한다.
3. **가상 시뮬레이션의 정직한 표기.** 경쟁사 시뮬레이션은 "Results" 같은 라벨로 실제 결과처럼 읽힐 여지가 있다. MEDIDERMA는 실제 촬영 비교(사실)와 가상 시뮬레이션(예상)을 화면에서 분리하고, 시뮬레이션 이미지에는 워터마크 수준의 상시 표기를 넣는다.
4. **보정하지 않은 점수와 품질 표시.** Perfect Corp 문서가 밝히듯 업계는 표시용 점수를 유리하게 보정한다. MEDIDERMA는 점수 산식의 의미("사진에서 보이는 정도")와 촬영 품질 등급을 함께 보여주고, 조건이 다른 두 사진의 수치 비교에는 경고를 띄우는 방식으로 신뢰를 확보할 수 있다.
5. **항목 수 경쟁을 하지 않는다.** "200+ 지표", "150+ 바이오마커" 같은 수치는 벤더 내부에서도 일관되지 않는다. 검증 가능한 소수 지표(붉은기, 색소, 균일도, 모공, 결, 주름 가시성)와 반복 측정 재현성 공개가 더 방어 가능한 주장이다.
6. **UI는 복제하지 않는다.** 원형 촬영 가이드, 전후 슬라이더 같은 일반 패턴은 업계 공통이지만, 특정 벤더의 화면 구성·문구·점수 표현을 그대로 가져오지 않는다. 참고 대상은 기능 원칙(품질 검사 항목, 데이터 구조)에 한정한다.
7. **초기 검증 계획을 개발과 함께 설계한다.** 최소한 (a) 동일인·동일 조건 반복 촬영 재현성, (b) 조명·기기 변화에 대한 민감도, (c) 전문가 육안 등급과의 일치도를 측정해야 정확도 관련 문구를 쓸 수 있다.

---

## 9. 조사 한계

- Perfect Corp API 가격 페이지(yce.perfectcorp.com/pricing)와 Skin Simulation 제품 페이지는 본문이 로드되지 않아 unit의 화폐 가격과 HD unit 단가를 확인하지 못했다.
- Perfect Corp가 인용하는 검증 연구의 논문 원문은 확인하지 못했다.
- Revieve는 공개 개발자 문서를 찾지 못해 대부분 마케팅 페이지·FAQ 기반이다.
- Canfield는 요청 URL이 404여서 현재 제품 페이지(visia-complexion-analysis)와 2026-03 보도자료로 대체했다. VISIA 독립 연구는 검색 결과 요약 수준으로만 확인했다.
- Neutrogena Skin360 공식 페이지는 403으로 직접 열람하지 못했다.
- L'Oréal 자료는 2019년 공식 발표문이며 현재 사양이 아니다.
- Miravex, Aysa는 이번 조사에서 다루지 않았다.
- WebFetch는 페이지를 요약 모델로 읽기 때문에 인용 문구의 세부 표현은 개발 착수 전 원문에서 재확인이 필요하다.

---

## 10. 출처 목록

**Perfect Corp**
- [S1] AI Skin Diagnostic 제품 페이지 — https://www.perfectcorp.com/business/products/ai-skin-diagnostic
- [S2] YouCam API 개발자 문서(AI Skin Analysis 엔드포인트, 입력 규격, 오류 코드, 출력, unit, 보관 기간, JS Camera Kit) — https://yce.perfectcorp.com/document/index.html
- [S3] SDK Privacy Policy — https://www.perfectcorp.com/business/SDK/privacy
- [S4] AI Skin Analysis API 제품 페이지 — https://yce.perfectcorp.com/ai-api/products/ai-skin-analysis-and-api
- [S5] Skincare Pro — https://www.perfectcorp.com/business/solutions/online-service/skincare-pro / Aesthetic Simulator — https://www.perfectcorp.com/business/solutions/online-service/aesthetic-simulation
- [S6] AI Skin Simulation API — https://yce.perfectcorp.com/ai-api/products/ai-skin-simulation-api

**Haut.AI**
- [S7] 공식 홈페이지 — https://haut.ai/
- [S8] 문서: Face Skin Analysis 3.0 — https://docs.saas.haut.ai/haut.ai/haut.ai-features/algorithms/face-skin-analysis-3-0
- [S9] 문서: Face Metrics 2.0 — https://docs.saas.haut.ai/haut.ai/haut.ai-features/algorithms/face-metrics-2-0
- [S10] LIQA 개발자 문서 — https://docs.liqa.haut.ai/ (전체 번들: https://docs.liqa.haut.ai/llms-full.txt)
- [S11] 문서: LIQA(요구 사양·라이선스) — https://docs.saas.haut.ai/haut.ai/haut.ai-features/liqa.md
- [S12] AI Skin Analysis 제품 페이지 — https://haut.ai/product/ai-skin-analysis
- [S13] 문서 인덱스(구조, Subject, API) — https://docs.saas.haut.ai/ / Swagger — https://saas.haut.ai/api/swagger/
- [S14] SkinGPT 제품 페이지 — https://haut.ai/product/skingpt
- [S15] 문서: Recommendation System 2.0 — https://docs.saas.haut.ai/haut.ai/haut.ai-features/product-recommendation-system-2.0.md
- [S16] 문서: Data protection and compliance — https://docs.saas.haut.ai/haut.ai/legal/legal.md
- [S17] 문서: Algorithms(FAQ, 의료기기 아님) — https://docs.saas.haut.ai/haut.ai/haut.ai-features/algorithms.md

**Revieve**
- [S18] AI Skin Diagnostics 기술 페이지 — https://www.revieve.com/technologies/ai-skin-diagnostics
- [S19] FAQ — https://www.revieve.com/faqs
- [S20] Boots 사례 보도자료 — https://www.revieve.com/insider/news/boots-and-revieve-launch-an-ai-skincare-advisor-experience-to-support-customers-on-their-unique-skincare-journey
- [S21] Skin Transformation Experience — https://www.revieve.com/platform/skincare/skin-transformation-experience
- [S22] Privacy Policy — https://www.revieve.com/privacy-policy

**Canfield Scientific**
- [S23] VISIA 3D 제품 페이지 — https://www.canfieldsci.com/imaging-systems/visia-complexion-analysis/
- [S24] 보도자료(2026-03-25) — https://www.canfieldsci.com/in-the-news/stories/canfield-scientific-premieres-next-generation-visia-skin-analysis.-now-in-3d.
- [S25] 독립 연구(Henseler, VISIA 재현성·정밀도) — https://books.publisso.de/en/journals/iprs/volume11/iprs000165 , https://books.publisso.de/en/journals/iprs/volume11/iprs000169 , https://books.publisso.de/en/journals/iprs/volume12/iprs000177
- [S26] VISIA를 사용한 스킨케어 임상 논문 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9762177/

**기타**
- [S27] L'Oréal 공식 발표(ModiFace 피부 진단) — https://www.loreal.com/en/news/research-innovation/loreal-and-modiface-an-artificial-intelligencepowered-skin-diagnostic
- [S28] Neutrogena Skin360 공식 사이트(직접 열람 403, 검색 결과 요약으로 확인) — https://skin360.neutrogena.com
- [S29] Fortune 보도(2024-02-29) — https://fortune.com/2024/02/29/face-scanning-ai-apps-are-giving-cosmetics-companies-deeper-connections-and-selling-points-with-customers/
