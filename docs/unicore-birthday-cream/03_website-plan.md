# 03. 전체 웹사이트 기획안 (STRATEGY · DESIGN SYSTEM · CONTENT)

## 1. 브랜드 스토리 설계

### 1.1 핵심 메시지 위계
| 레벨 | 문구 | 역할 |
|---|---|---|
| L0 Brand Line | **피부의 첫 번째 생일** / YOUR SKIN HAS A BIRTHDAY. | 사이트 전체 관통 |
| L1 Product | 1ST BIRTHDAY CREAM — SKIN RE:BIRTH | 제품 정체성 |
| L2 Promise | 피부의 시간을 되돌려 새로운 피부의 생일을 맞이하다 | 스토리 전제 |
| L3 Proof | 28일 스토리 → 4대 성분 → 3세대 PDRN → 임상 데이터 → 사용 만족도 | 신뢰 구축 |
| L4 Action | 제품 구매하기 / 상세정보 / 브랜드 소개 | 전환 |

### 1.2 서사 구조 (3막)
1. **CELEBRATION (인트로 ~ S01)** — 어둠 속 촛불 하나. 생일을 축하하는 의식. 감정 진입.
2. **REVELATION (S02 ~ S09)** — 28일, 제품, 임상, 성분, 과학. 왜 "다시 태어남"인지 증명.
3. **AFFIRMATION (S10 ~ S12)** — 사용자의 목소리, 사용법, 다시 촛불. 구매로 귀결.

전환 모티프: **촛불 불꽃 = 황금 입자 = 성분 분자 = 제품 캡 반사광**. 모든 장면 전환은 황금 입자가 다음 오브젝트로 재조립되는 방식으로 통일(TRIONN식 "하나의 연속 샷" 감각).

## 2. 정보 구조 (IA)

```
/                      단일 롱폼 페이지 (인트로 오버레이 + 12 섹션)
  #birthday            S01 Hero
  #28days              S02
  #product             S03 (3D 인스펙터)
  #clinical            S04
  #masterpiece         S05
  #ingredients         S06 (4 서브 장면)
  #pdrn                S07
  #science             S08
  #moisture            S09
  #reviews             S10
  #how-to-use          S11
  #rebirth             S12 + CTA
/clinical-notes        임상 시험 상세 주석 페이지 (텍스트, SEO)
/ingredients           전성분 · 성분 설명 (텍스트, SEO)
/brand                 유니앤코어 브랜드 소개 (구매 CTA 보조)
```

상단 내비게이션은 숨김형 "챕터 인덱스"(우측 세로 도트 + 챕터명)로 처리. 모바일은 하단 고정 CTA 바 + 챕터 드로어.

## 3. 디자인 시스템

### 3.1 컬러 토큰 (CSS Custom Properties)
```css
:root{
  --bg-midnight:#080706;  --bg-obsidian:#17110F;  --bg-bronze:#38231C;
  --gold:#C6A16A;         --gold-metal:#E5C58D;   --gold-deep:#8F6B3A;
  --ivory:#F4EFE7;        --white:#FFFFFF;        --green-deep:#11291D;
  --flame:#FFB86B;        --flame-core:#FFF1C9;   /* 촛불 전용, 골드와 구분 */
  --glass:rgba(244,239,231,.06);
}
```
사용 규칙: 골드는 화면 면적의 **10% 이하**. 큰 면은 블랙 3종, 골드는 숫자·윤곽·분자·CTA·커서에만. 배경은 섹션별로 Midnight → Obsidian → Bronze → Deep Green(S06-04/S09) → Midnight로 **스크롤 연동 보간**.

### 3.2 타이포그래피
| 역할 | 서체 | 크기(Desktop / Mobile) | 처리 |
|---|---|---|---|
| Display EN | Cormorant Garamond 300/400 italic | clamp(64px, 11vw, 200px) / 44px | 3D Extrude(Text3D) 또는 메탈릭 CSS 그라데이션 |
| Headline KO | Pretendard Variable 200→600 가변 | 48~96px / 30~40px | Variable weight 애니메이션(가늘게 등장 → 굵어짐) |
| Sub EN | Inter 400, tracking .2em, uppercase | 12~14px | 캐릭터 리빌 |
| Body KO | Pretendard 400, line-height 1.8 | 16~18px / 15px | 마스크 리빌(라인 단위) |
| Numeric | Cormorant Garamond 300 + tabular | 160~320px / 96px | 카운트업 + 메탈릭 |
Neue Montreal은 유료 라이선스이므로 **Inter로 대체**(사용자가 라이선스 보유 시 교체). 모든 폰트 셀프호스팅, `font-display: swap`, 서브셋(KS X 1001 + 사용 문자).

### 3.3 모션 토큰
| 토큰 | 값 | 사용 |
|---|---|---|
| ease-cinematic | cubic-bezier(.16,1,.3,1) | 대부분의 등장 |
| ease-metal | cubic-bezier(.7,0,.2,1) | 카메라 돌리·회전 |
| dur-reveal | 1.2s | 텍스트 리빌 |
| scrub-lag | 0.8~1.2 | ScrollTrigger scrub |
| pin-length | 섹션당 200~400vh | 스크럽 길이 |
| stagger-char | 0.018s | 캐릭터 리빌 |
`prefers-reduced-motion`: 스크럽 → 단순 위치 고정, 3D 자동회전 정지, 파티클 50개 이하, 영상 자동재생 금지.

### 3.4 컴포넌트 인벤토리
`IntroOverlay`, `SoundGate`, `SkipButton`, `ProgressRail`, `ChapterIndex`, `KineticHeadline`(SplitText), `MetalText`, `Counter3D`, `ProductInspector`(R3F), `SceneCanvas`(공유 캔버스 + `View` 포털), `ParticleField`, `GiftBox`, `MoleculeCluster`, `SkinLayerDiagram`, `ClinicalBar3D`, `ReviewCardStack`, `StepTimeline`, `VideoBlock`(포스터·폴백·레이지), `MagneticButton`, `GoldCursor`, `StickyCTA`(모바일), `Footnote`(임상 주석).

## 4. 콘텐츠 데이터 구조 (하드코딩 금지)

```
src/data/
  product.ts      브랜드·제품명·용량·구매URL·3D모델URL·이미지
  copy.ts         섹션별 카피(ko/en), 출처 플래그(source: 'package'|'detail-page'|'directive'|'pending')
  clinical.ts     수치·시험기관·n·기간·측정법·주석, verified:boolean
  ingredients.ts  4대 성분 + PDRN 세대 비교 + 수분/장벽, claims와 evidence 분리
  reviews.ts      4주 만족도 5항목, n, 문항 원문
  howto.ts        3 STEP
  videos.ts       intro-cake, product-film, macro-*, ending (src, poster, aspect, duration, source: 'canva'|'upload'|'placeholder')
  audio.ts        큐 시트
  seo.ts          title/description/OG/JSON-LD(Product, Organization, FAQ)
```

**검수 게이트**: `verified:false`인 임상·순도·만족도 데이터는 빌드 시 자동으로 "검증 중" 상태로 렌더(숫자 미노출). 원본 대조 후 플래그를 바꿔야만 숫자가 노출됩니다.

### 4.1 표현 가이드라인(법규·지시문 반영)
- 28일: "일반적으로 알려진 피부 턴오버 개념을 바탕으로 한 스토리텔링" 각주. 의학적 단정 금지.
- 임상: "인체적용시험 결과이며 개인차가 있을 수 있습니다" 상시 각주 + 시험 조건 패널. 만족도(설문)와 기기 측정 개선율은 **다른 아이콘·다른 색**으로 시각 분리.
- 성분 작용 시각화(S08): "개념 시각화" 라벨 상시 표기.
- 치료·보장 표현 금지, 화장품법 표시광고 가이드 준수(의약품 오인 표현 배제).

## 5. 섹션별 기획 요약 (스토리보드는 04 문서)

| # | 섹션 | 핵심 오브젝트 | 인터랙션 | 핀 길이 | 데이터 소스 |
|---|---|---|---|---|---|
| I-01 | Birthday Cake Intro | 영상(Canva/생성) 또는 Three.js 케이크 폴백 | 진행률, 스킵 | – | videos.introCake |
| I-02 | Sound Gate | 버튼 3종 | 클릭 → 오디오 활성 | – | audio |
| I-03 | Product Film | 영상 + 불꽃 전환 셰이더 | 스킵 | – | videos.productFilm |
| S01 | Skin Has a Birthday | 3D 타이포 + 촛불 + 파티클 | 마우스 시차, 스크롤 회전 | 250vh | copy |
| S02 | The 28 Days | 3D 숫자 28, 14+14 링 | 스크럽 회전 | 300vh | copy |
| S03 | Product Reveal | 제품 GLB 인스펙터 | 드래그·휠·터치·스크롤 카메라 | 400vh | product |
| S04 | Clinical Data | 3D 바·숫자 카운트업(48.33% / 19.06% / 이상반응 0건) | 스크럽, 각주 패널 토글 | 350vh | clinical |
| S05 | The Masterpiece | 선물상자 리깅 | 스크럽 개봉 | 300vh | product |
| S06 | 4 Key Ingredients | 분자 4장면(수평 스크롤) | 수평 스크럽, 호버 설명 | 500vh | ingredients |
| S07 | PDRN Technology | 구체 3개 → 골드 강조 | 스크럽 | 300vh | ingredients.pdrn |
| S08 | Skin Science | 피부 단면 레이어 | 스크럽 레이어 분리, 핫스팟 | 300vh | ingredients + clinical |
| S09 | Moisture & Barrier | 물결 셰이더 + 매크로 영상 | 스크럽 | 250vh | videos.macro |
| S10 | User Experience | 3D 카드 스택 | 스크럽 순차 등장 | 250vh | reviews |
| S11 | How to Use | 3 STEP + 영상 | 스크럽 | 250vh | howto |
| S12 | Final + CTA | 제품 + 소멸 파티클 | 마그네틱 버튼 | 200vh | product.purchaseUrl |
| S13 | Skincare Guide (표시 순서는 S11과 S12 사이) | 6 STEP 라인업 타임라인(낮/밤) | 호버·탭 제품 카드 | 일반 섹션 | lineup.ts |

총 스크롤 길이 약 36~40 화면 높이(데스크톱). 모바일은 60% 수준으로 압축.

## 6. 사용자 경험 흐름

```
진입 → [재방문? 인트로 생략 토글] → I-01 케이크(0~8s) → I-02 사운드 게이트(사용자 클릭)
→ I-03 제품 필름(원본 영상 or 폴백 모션) → 크로스페이드 → S01 Hero (스크롤 힌트)
→ 챕터 인덱스로 자유 이동 가능 → S12 CTA → 외부 구매 페이지(새 탭)
```
모든 단계에 `SKIP`(44px 이상 터치 타깃). 인트로 총 길이 상한 25초, 재방문 시 `localStorage.introSeen` 로 생략 제안.

## 7. SEO · 접근성
- SSR 텍스트: 모든 카피·수치·각주는 HTML에 존재(캔버스는 `aria-hidden`), 섹션은 `<section aria-labelledby>`.
- JSON-LD: `Product`(name, brand, size 50g, offers→구매URL), `Organization`, `FAQPage`(사용법·성분 Q&A).
- OG 이미지: 제품 실사 기반 1200×630 정적 + 동적 생성 라우트.
- 한국어 키워드: 버스데이 크림, 유니앤코어, PDRN 크림, 인삼 PDRN, 탄력 크림, 피부 재생 크림(광고법 검토 후 확정).
- 접근성: 키보드로 인스펙터 회전(방향키), 포커스 가시성, 명도 대비 4.5:1(골드 텍스트는 작은 크기에서 아이보리로 대체).

## 8. 상세페이지 원본(261102 수정본) 대조 후 확정·변경 사항
| 구분 | 내용 |
|---|---|
| 카피 확정 | 인트로·히어로·28일·마스터피스·PDRN·4GF·펩타이드·시카·우레아·HOW TO USE 전 구간 원문 확보(`01_asset-analysis.md` 2절). 사이트 카피는 원문 그대로, 영문 보조 카피(YOUR SKIN HAS A BIRTHDAY 등)만 지시문 기준 추가 |
| 섹션 추가 | **S13 Skincare Guide**(6 STEP 라인업, 낮/밤 루틴) — 상세페이지 마지막 섹션. 브랜드 소개·교차 판매 역할 |
| S04 확장 | 「4주동안 피부 이상반응 0건」(21명) 추가. 설문(D-04 300명)은 **가데이터로 명시되어 있어 수치 미노출**, 메시지만 사용 |
| S06 성분 보강 | ③ 펩타이드에 **카퍼트라이펩타이드-1** 병기, ④ 시카에 **자작나무껍질추출물·병풀 유래 3종·베타-글루칸** 서브 레이어, 「핵심 성분이 많을수록 매일 편안하게 사용해야 하니까」 브리지 카피 |
| S07 카피 | 1세대 **연어** PDRN(동물 유래, 외부 환경에 민감한 한계) / 2세대 식물성(순도·함량 편차) / 3세대 인삼(99% 유효성분 보존) — 상세페이지 컬러(핑크·연두·골드) 그대로 3D 구체 머티리얼에 매핑 |
| S08 카피 | 「볼륨 다음은 재건입니다」를 S08 Skin Science 도입 헤드라인으로 사용(상세페이지 흐름과 동일) |
| S10 | 만족도 5항목 원문 + 각주(주관 설문, n=21) |
| 영상 | 데스크톱 16:9 / 모바일 9:16 **원본 2종 확보** → I-03 제품 필름 플레이스홀더 해제. 케이크 인트로 영상(I-01)만 신규 제작 대상 |
| 로고 | 영상 엔딩 프레임의 `III` 심볼 + UNI&CORE 세리프 워드마크 확인. 벡터 파일 요청 중 |
| 법규 플래그 | 「노벨상 받은 성분」「보톡스 펩타이드로 알려진」 → 표시광고 검토 플래그. 「피부 재생」류 표현은 사이트 카피에서 사용하지 않음(원문에도 「다시 태어나는」 비유만 존재) |
