# Claude Code 요청 프롬프트 — "피부의 첫 번째 생일" 프로모션 페이지

> 아래 블록을 그대로 Claude Code 에 붙여 넣으면 됩니다. 같은 폴더의 PLAN.md(기획서)를 함께 읽도록 되어 있습니다.
> `[ ]` 표시는 자료를 받은 뒤 채울 부분입니다.

```text
역할: 당신은 수상 경력이 있는 크리에이티브 테크놀로지스트이자 시니어 프론트엔드 엔지니어다.
목표: MEDIDERMA SKIN IQ 사이트(apps/mediderma-ai, Next.js 15 App Router, React 19, Tailwind, three.js/@react-three/fiber/drei 설치됨)에
      UNI&CORE "퍼스트 벌스데이 크림" 프로모션 페이지를 /birthday 경로로 만든다.
      콘셉트: "Skin's First Birthday — 내 피부의 첫 번째 생일".
먼저 읽을 것: apps/mediderma-ai/docs/birthday-promo/PLAN.md (기획서), 첨부 상세페이지 이미지 [경로], 제품 영상 [경로], 제품 사진 [경로].

━━ 0. 작업 방식 ━━
1) PLAN.md 를 읽고, 상세페이지 이미지에서 문구·성분·수치·색을 추출해 docs/birthday-promo/CONTENT.md 로 정리한다(수치는 원문 그대로, 출처 표기).
2) 장면별 디자인 시안(정지 화면)을 먼저 만들어 보여 주고 승인 후 구현한다.
3) 장면 하나를 완성할 때마다 모바일(390px)·데스크톱(1440px) 스크린샷과 Lighthouse 모바일 점수를 확인한다.
4) 기존 기능·페이지는 수정하지 않는다. 브랜드는 MEDIDERMA SKIN IQ(브랜드 블루 #1F74BE).

━━ 1. 진입 시퀀스 ━━
[0] 생일 케이크 인트로 영상(Canva 제작, /public/birthday/intro-{mobile,desktop}.mp4): 무음 자동재생, playsinline, 포스터 이미지.
    중앙에 "선물 열기" 버튼 → 이 탭이 소리 재생 허용 제스처다.
[1] 버튼을 누르면 제품 영상(/public/birthday/film-*.mp4)을 소리와 함께 재생. 우상단 음소거 토글·건너뛰기.
[2] 영상 종료/건너뛰기 → 촛불 모양 원형 clip-path 가 커지며 상세 페이지 공개.
- 두 번째 방문부터 인트로 생략(localStorage), "인트로 다시 보기" 버튼 제공.
- prefers-reduced-motion·Save-Data·저사양(GPU 없음)에서는 영상 대신 포스터와 짧은 페이드.
- 자동 소리 재생을 시도하지 말 것(브라우저 정책). 반드시 사용자 탭 이후 재생.

━━ 2. 스크롤 스크럽 장면 (GSAP ScrollTrigger scrub + pin, Lenis 관성 스크롤) ━━
S1 FIRST BIRTHDAY — 초대형 3D 타이포("FIRST / BIRTHDAY")가 깊이에서 날아와 정렬, 스크롤에 따라 글자가 좌우로 갈라지며 그 사이로 제품이 회전 등장.
S2 초를 끄세요 — 제품 위 촛불. 길게 누르기(pointerdown 유지) 동안 불꽃이 커지고 진동 피드백, 놓으면 연기 파티클 → 콘페티 → 뚜껑 열림. (trionn.com 의 "hold to blast" 계열 인터랙션)
S3 제품 360° — 드래그로 회전(가로 드래그만, 세로는 스크롤), 스크롤하면 자동 한 바퀴. 커서 라벨 "드래그해서 돌려보기".
S4 성분이 켜진다 — PDRN → 성장인자 4종(EGF·IGF·FGF·KGF) → 펩타이드 2종. 성분명은 스크램블(해독) 텍스트로 등장, 크림 속에서 3D 분자 구조(InstancedMesh)가 떠오른다.
S5 텍스처 — 크림 질감 이미지 시퀀스(WebP 60~90장)를 스크롤로 프레임 스크럽. [자료 대기]
S6 근거 — 인체적용시험 수치 카운트업, 원문·조건·출처 표기. [CONTENT.md 기준]
S7 매일 밤의 의식 — 사용법 3단계(진주알 1개 → 얼굴 → 목, 아래에서 위로), SVG 손동작 경로 드로잉.
S8 연결 — "내 피부 SKIN IQ 확인하기"(/analyze), "공식몰에서 보기"(공식 상품 URL).
배경색은 스크롤에 따라 Candle Night #0E0B10 → Cream Silk #F7F1EA 로 연속 전환.
포인터를 따라 휘는 금빛 선 필드(WebGL 셰이더, "touch the lines" 계열)를 S1~S2 배경에 둔다.

━━ 3. 3D ━━
- 기본: @react-three/fiber 로 병을 코드 모델링(LatheGeometry + 뚜껑 + 라벨 CylinderGeometry), 제품 사진을 라벨 텍스처로 입힌다. 환경광은 drei Environment + Lightformer(외부 HDR 다운로드 없이).
- 비교: 제품 정면 사진으로 이미지→3D(GLB) 생성을 시도하고, 품질이 낫다면 Draco 압축 GLB(≤1.5MB)로 교체.
- 3D 텍스트: 영문 헤드라인은 drei Text3D(실제 지오메트리), 한글·다국어 문장은 기존 CSS 3D DepthText 컴포넌트 재사용.
- 3D·셰이더·GSAP 는 이 페이지에서만, 장면 진입 직전에 동적 import.

━━ 4. 컬러·타이포 ━━
Candle Night #0E0B10 / Cream Silk #F7F1EA / Birthday Blush #F2C6C2 / Champagne Gold #C9A66B / Deep Plum #3A2233 / MEDIDERMA 브랜드 블루 #1F74BE(연결 CTA 한 곳).
[상세페이지 색을 추출해 조정]. 본문 대비 4.5:1 이상(자동 측정 스크립트로 검사).
헤드라인: 굵은 그로테스크(영문) + Pretendard(한글). 숫자는 tabular-nums.

━━ 5. 모바일·성능·접근성 ━━
- 360/390/768/1280 기준 검수, 가로 스크롤 금지, 고정 장면은 svh 단위.
- 모바일 3D DPR ≤ 1.5, 파티클 1/3, 그림자 끔. GPU 없는 기기는 3D 대신 고품질 이미지 + CSS 모션.
- Lighthouse 모바일: 성능 90+, 접근성 100, 권장사항 100, CLS 0. 첫 화면 JS ≤ 200KB(gz).
- 영상: H.264 MP4 모바일 720p(≤5MB)·데스크톱 1080p, preload="metadata", 포스터 필수.
- 모든 인터랙션은 키보드로도 가능(길게 누르기 = 스페이스 길게), 스크린리더용 텍스트 제공.

━━ 6. 표현 규칙(화장품 광고) ━━
"치료·재생·의학적 효능" 금지. 수치는 상세페이지 원문 그대로 + 시험 조건·출처. CG/AI 연출 이미지는 "연출 이미지" 표기.

━━ 7. 완료 기준 ━━
- /birthday 가 모바일·데스크톱에서 S0~S8 전부 동작, 스크린샷 첨부.
- Lighthouse·대비 측정 결과 표, E2E(인트로 건너뛰기·소리 토글·S2 길게 누르기·S3 회전·CTA 링크) 통과.
- 초안 PR 로 올리고, 병합은 승인 후.
```

## 참고: 이 세션에서 확인한 도구 가능 범위

| 도구 | 쓸 수 있는 것 | 제약 |
|---|---|---|
| Canva (연결됨) | 생일 케이크 인트로 디자인·영상 생성, MP4 내보내기 | 결과물 품질은 시안 확인 필요 |
| Higgsfield (연결됨) | 제품 사진 → 3D(GLB) 생성, 영상 업스케일 | 크레딧 사용 |
| Spline | 브라우저 3D 편집, 이미지→3D, React 임베드(`@splinetool/react-spline`) | 무료는 Spline 로고 워터마크, Claude 조작은 Spline MCP + 사용자 로그인된 편집기 필요 |
| 코드(R3F) | 병 모델링·셰이더·스크롤 연동 전부 | 실사급 디테일은 사진 텍스처에 의존 |
