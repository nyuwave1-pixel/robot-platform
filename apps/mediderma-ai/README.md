# MEDIDERMA SKIN IQ

회원가입 없이 얼굴 사진 한 장으로 13개 얼굴 영역의 피부 표면 특징을 관찰하고, 더마홈(RF · 울트라소닉 · 이온토포레시스) 맞춤 케어와 4·8·12주 가상 시뮬레이션을 보여 주는 웹 앱.

- **사진은 브라우저 안에서만 처리된다.** 서버·외부 AI 로 전송하지 않는다.
- 분석 지수는 RGB 사진 기반 관찰 지수이며 **임상 검증 전**이다. 의료적 진단이 아니다.
- 설계·한계·테스트 결과: [`docs/mediderma-ai`](../../docs/mediderma-ai/00_README.md)

## 실행

```bash
npm install
npm run dev            # http://localhost:3200
npm run typecheck && npm test
npm run build && npm run start
```

환경변수는 [`.env.example`](.env.example) 참고. 외부 AI API 키는 필요 없다.

| 변수 | 용도 |
|---|---|
| `ADMIN_PASSWORD` | `/admin` 비밀번호(8자 이상). 없으면 관리자 비활성 |
| `DATABASE_URL` | PostgreSQL. 없으면 `.data/store.json` (서버리스에서는 영속되지 않음) |

## 구조

```
src/lib/analysis/   분석 엔진 (types · zones · engine · quality · calibration · compare · simulate · neck · provider)
src/lib/care/       더마홈 지식베이스(공식 자료 기반) · 추천 규칙
src/lib/i18n/       ko(기준) en ja zh es vi ru
src/lib/client/     세션 · 기기 내 기록(IndexedDB) · 익명 통계 · 리포트 저장
src/server/         저장소 어댑터(PostgreSQL / 파일) · 관리자 인증 · 통계
src/app/            / · /analyze · /compare · /history · /privacy · /admin · /api/*
tests/unit          vitest (41)
tests/e2e           실제 브라우저 검증 스위트 (53)
public/models       MediaPipe Face Landmarker 모델 (Apache-2.0, 자체 호스팅)
```

## 배포 메모

- 대표 주소: https://mediderma.unincore.com (후이즈 DNS: `mediderma` CNAME → `cname.vercel-dns.com`). 공유 미리보기·사이트맵·robots 의 기준 주소이며 `NEXT_PUBLIC_SITE_URL` 로 바꿀 수 있다.

- Vercel: Root Directory 를 `apps/mediderma-ai` 로 지정. 통계·관리자 설정을 쓰려면 `DATABASE_URL` 필수.
- Docker: `docker build -t mediderma-ai apps/mediderma-ai` (이 저장소에서는 빌드 검증을 하지 못했다).
- 카메라 촬영은 HTTPS 에서만 동작한다.

## 디자인 · 모션 레이어

| 위치 | 기술 |
|---|---|
| 히어로 타이틀 | 실제 압출·베벨 3D 텍스트(`fx/Title3D`), 금속 재질 + 절차적 환경광, 포인터 추종 틸트 |
| 히어로 얼굴 · CTA | 브랜드 모델(정아름 님, 본인·소속사 사용 동의 확인) 사진을 Higgsfield 로 스튜디오 컷으로 가공하고 배경을 분리한 정지 이미지(`public/brand/hero-portrait.webp`) + 부유·포인터 기울기 모션(`fx/HeroPortrait`) + 얼굴 위치에 맞춘 분석 HUD(`fx/ScanHud`, 좁은 화면에서는 라벨을 틀 안쪽에 고정) |
| 사용 전/후 갤러리 | 40·50·60대 한국 여성 예시 3명의 사용 전/후 사진(`public/brand/case-*-{before,after}.webp`, 모두 Higgsfield 로 만든 AI 연출 이미지).— 사용 전·후는 표정·포즈가 다른 별도 촬영처럼 만들고, 두 장이 번갈아 서서히 바뀐다(마우스를 올리면 사용 후, 누르면 전/후 전환, `fx/BeforeAfter`). 아래에 "AI 생성 연출 이미지, 실제 사용자 사진 아님" 안내 문구를 7개 언어로 표시한다. |
| 섹션 헤딩 | 글자별 3D 등장 + 압출 깊이 + 강조어 발광(`fx/DepthText`, 모든 언어 지원) |
| 기술 카드 | 기능별 GLSL 모션 그래픽 — RF 열 파동 / 초음파 간섭 / 이온 입자 흐름(`fx/ShaderCanvas`) + 3D 틸트 |
| 진행 단계 | 스크롤 연동 진행선 + 3D 플립 등장 |
| 개인정보 | "사진이 기기 밖으로 나가지 않음" 모션 다이어그램(SVG) |
| CTA | 오로라 셰이더 배경 + 자석 버튼 |
| 분석·리포트 | 스캔 궤도 링, 종합 지수 카운트업 링, 지표 막대 애니메이션 |
| 리포트 · 한눈에 보기 | 맨 위에 큰 글씨로 방사형 그래프(8개 항목, 바깥쪽 = 좋음) → 먼저 관리할 곳 3곳 → "언제 · 어떤 제품 · 더마홈 어떤 기능 · 몇 분 · 어느 방향" 카드(공식 CARE GUIDE 루틴 단계에서 가져옴, 공식몰 제품 사진 `public/products/`) → 4주 뒤 다시 찍어 전후 비교 안내(`report/CareAtAGlance`). 헤더의 "가+" 버튼으로 사이트 전체 큰 글씨 모드. |

저사양 기기·WebGL 미지원·모션 최소화 설정에서는 WebGL 캔버스를 만들지 않고 CSS/SVG 버전으로 자동 전환한다 (`lib/client/device.ts`). 3D 글꼴(helvetiker)은 three.js 배포본이며 라이선스는 `public/fonts/LICENSE`.

### 3D 렌더 스크립트 (Blender, 선택)

`scripts/blender/` 에는 사진·합성 모델로 얼굴 턴테이블을 렌더링하는 스크립트가 남아 있다. 현재 사이트는 이 결과물을 쓰지 않으며, 빌드·배포에 Blender 가 필요하지 않다.
