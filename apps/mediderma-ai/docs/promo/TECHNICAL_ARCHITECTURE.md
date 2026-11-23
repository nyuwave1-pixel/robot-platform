# TECHNICAL_ARCHITECTURE — /experience

## 1. 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router (기존 `apps/mediderma-ai`) | 새 라우트 `src/app/experience/` |
| 스크롤 | GSAP 3 + ScrollTrigger (scrub·pin) + Lenis | Lenis `raf` 를 `gsap.ticker` 에 연결, `ScrollTrigger.update` 동기화 |
| 3D | three.js + @react-three/fiber + drei (설치됨) | 한 개의 고정 `<Canvas>` 를 전 장면이 공유(장면마다 캔버스 생성 금지) |
| 모델 | GLB + Draco (`useGLTF`), 없으면 절차적 Lathe 모델 | `public/experience/models/` |
| 텍스트 | drei `Text3D`(영문 압출) · troika SDF `Text`(다국어) · CSS DepthText(기존) | |
| 셰이더 | 입자 타이포·금속 흐름·스캔 라이트·링 파동 (GLSL, ShaderMaterial) | |
| 영상 | `<video playsinline muted>` + MP4/WebM, `preload="metadata"` | 소리는 사용자 탭 이후 `muted=false` |
| 상태 | 장면 진행률 → zustand 1개 스토어(또는 ref) → R3F `useFrame` 에서 읽음 | React 재렌더 없이 60fps |

## 2. 구조

```
src/app/experience/page.tsx        서버 컴포넌트: 메타데이터, SEO 텍스트(헤드라인·제품명·성분) SSR
src/components/experience/
  ExperienceRoot.tsx               client: Lenis+GSAP 초기화, theme-experience 스코프
  Intro.tsx                        SCENE01~06 (시간 기반 타임라인, SKIP/SOUND)
  Stage.tsx                        고정 R3F Canvas (dynamic import, ssr:false)
  scenes/Product.tsx               GLB/절차적 모델, 분해 파츠 그룹, 회전·줌·초기화
  scenes/Particles.tsx             인트로 수렴 입자, 성분 시각화 입자
  scenes/Typography3D.tsx          Text3D + 금속 셰이더 + 입자 타이포
  sections/*.tsx                   S1~S10 DOM 텍스트·핫스팟 (ScrollTrigger 트리거)
  useScrollProgress.ts             섹션별 0~1 진행률 → 스토어
src/lib/experience/content.ts      제품명·성분·수치 (원문 그대로, 출처 포함) — 9개 언어 키
```

## 3. 구현 가능성 판단

| 요구 | 가능 | 방법 / 조건 |
|---|---|---|
| 360° 회전·휠 줌·터치 회전·핀치 | ✅ | OrbitControls(회전·줌 제한) + 가로 드래그만 회전(세로는 스크롤 통과) |
| 클릭 핫스팟 정보 | ✅ | drei `Html` 앵커 + 레이캐스트 |
| 스크롤 회전·확대·분해·재결합 | ✅ | 진행률 → 파츠 위치 보간. **분해는 GLB 가 파츠별로 분리돼 있어야 정확** |
| 원래 위치·카메라 초기화 | ✅ | 초기 쿼터니언·카메라 저장 후 tween |
| 재질 확인(유리·금속·무광) | ✅ | MeshPhysicalMaterial, 재질 정보는 실물 확인 필요 |
| 실제 제품 형상 재현 | ⚠️ | 원본 사진+치수 필요. 이미지→3D(Spline AI / Higgsfield) 결과는 라벨 글자가 뭉개질 수 있어 라벨은 원본 텍스처로 다시 입힘 |
| 입자 타이포·금속 셰이더·3D 압출 | ✅ | Claude Code 자체 제작 |
| Spline 씬 직접 임베드 | ⚠️ | `@splinetool/react-spline` 가능하나 무료=워터마크, 성능 부담 → **씬 제작/모델 추출용**으로만 쓰고 웹 구동은 R3F 권장 |
| 영상 소리 자동 재생 | ❌(정책) | 무음 자동재생 + SOUND ON 탭 후 재생 |
| 인트로 원본 영상 | ⏳ | 자료 대기 |

## 4. Claude Code 가 만들 수 있는 것 / 외부 제작이 필요한 것

| Claude Code 단독 | 외부 자료·도구 필요 |
|---|---|
| 스크롤 시스템, 장면 전환, 인트로 타임라인, SKIP/SOUND/재방문 로직 | 원본 영상(촬영본) |
| 절차적 용기 모델(근사), 셰이더·입자·분자·빛 흐름 | 정확한 제품 GLB(Spline/3D 디자이너/이미지→3D + 검수) |
| 3D 텍스트·키네틱 타이포 전부 | Neue Montreal 라이선스(미구매 시 Inter) |
| 반응형·접근성·성능 최적화, 9개 언어 구조 | 제품 문구·성분·임상 원문 |
| E2E·Lighthouse·대비 자동 검사 | Spline 유료 플랜(쓸 경우) |

## 5. 성능 설계

- `/experience` 진입 시에만 GSAP·Lenis·three 청크 로드. 첫 화면은 SSR 텍스트 + 포스터 이미지로 즉시 표시(LCP), 3D 는 인트로 재생 중 백그라운드 로드.
- 렌더 루프: 화면 밖·탭 비활성 시 정지, `frameloop="demand"` + 스크롤/드래그 시에만 invalidate.
- GLB: Draco + KTX2 텍스처, ≤ 1.5MB. 입자: InstancedMesh/Points, 모바일 1/3.
- 폴백: GPU 없음·저사양·Save-Data·reduced-motion → 3D 대신 제품 원본 이미지 시퀀스 또는 정지 이미지.

## 6. 테스트

- E2E(Playwright): 인트로 SKIP·SOUND 토글·재방문 생략, 3D 회전(드래그)·줌·초기화, 스크롤 역방향, 핫스팟 정보, CTA 링크.
- 시각 회귀: 장면별 0/50/100% 스크린샷(360·768·1440).
- 성능: Lighthouse 모바일/데스크톱, FPS 측정(PC 60, 모바일 30+), 메모리.
- 접근성: 키보드로 회전(←→)·줌(+/−)·초기화(R), 스크린리더용 장면 텍스트, 대비 자동 측정.
