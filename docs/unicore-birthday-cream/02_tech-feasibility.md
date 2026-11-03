# 02. 기술 사전 검증 보고서 (STEP 2)

> 작성일 2026-11-03 · 실제 세션 환경에서 호출·조회한 결과만 기재합니다. 연결되지 않은 서비스는 "미연결"로 명시합니다.

## 0. 요약 표

| # | 기술 | 적용 가능 | 필요 계정/API | 비용·제한 | 난이도 | 대체 기술 | 판정 |
|---|---|---|---|---|---|---|---|
| 1 | 현재 프로젝트(Next.js 15 / React 19 / Tailwind 3) | ✅ 가능하나 **다른 서비스(로봇플랫폼) 저장소** | – | – | 하 | 신규 앱 분리 | **신규 앱 디렉터리로 분리 권장** |
| 2 | Spline MCP | ❌ **미연결** | Spline 계정 + MCP 서버 등록 | Spline 무료 플랜은 워터마크·용량 제한, 팀/Pro 유료 | 중 | Three.js 프로시저럴 모델 + Higgsfield image-to-3D | 사용자 연결 후 재검증 |
| 3 | Spline AI 3D 생성 | ❌ 미테스트(MCP 없음) | Spline AI(유료 크레딧) | 사용량 과금 | 중 | Higgsfield `generate_3d` (세션에 연결됨, 크레딧 과금) | 대체 경로 확보 |
| 4 | Three.js / React Three Fiber | ✅ 설치 가능 | – | 무료(MIT) | 중상 | – | **채택** |
| 5 | GSAP ScrollTrigger | ✅ 설치 가능 (gsap 3.15.0, 2024-10부터 전 플러그인 무료) | – | 무료 | 중 | Framer Motion scroll | **채택** |
| 6 | Canva Connect API (MP4 Export) | ✅ **Canva MCP 연결·인증 확인됨** | Canva 계정(연결됨) | MP4 Export는 Canva Pro 품질 옵션 존재, API 쿼터 있음 | 하 | 수동 MP4 업로드 | **MCP 경로 채택 + 수동 업로드 폴백** |
| 7 | 모바일 WebGL | ✅ iOS Safari 15+/Android Chrome WebGL2 지원 | – | 저사양 기기 GPU 메모리 제한 | 중 | 2.5D(레이어드 플레인) 폴백 | 적응형 렌더링 필수 |
| 8 | 영상 자동재생/오디오 정책 | ✅ Muted autoplay 허용, 소리는 사용자 제스처 후 | – | – | 하 | – | 인트로 02 설계에 반영 |

## 1. 현재 프로젝트 구조 확인

- 저장소: `nyuwave1-pixel/robot-platform` — **로봇 AI 플랫폼(airobotphysical.com) 서비스 코드**. `next.config.js`에 `basePath: "/robot-platform"`, 루트 레이아웃에 로봇플랫폼 헤더·푸터·AdSense가 고정되어 있음.
- 스택: Next.js ^15 (App Router), React ^19, Tailwind 3, Firebase 10, framer-motion 11, Vercel 배포.
- `node_modules` 미설치 상태. Node 22.23.4 / npm 10.9.9.

**판단**: UNI&CORE 사이트는 로봇플랫폼과 도메인·디자인·SEO가 전혀 다르므로 같은 App Router 트리에 섞으면 `basePath`, 레이아웃, 메타데이터, 광고 로더가 모두 충돌합니다.

| 옵션 | 설명 | 권장 |
|---|---|---|
| **A. 모노레포 하위 앱** `apps/unicore-birthday/` (별도 `package.json`, 별도 Vercel 프로젝트) | 이 저장소·브랜치 지시를 지키면서 완전히 독립된 Next.js 앱 | ★ 권장 (현 세션 제약 내 최선) |
| B. 별도 저장소 `unicore-birthday-cream` | 가장 깔끔. 저장소 신규 생성·세션 연결 필요 | 사용자 승인 시 |
| C. 현 앱 안에 `/unicore` 라우트 그룹 | 레이아웃·basePath 충돌, SEO 혼선 | 비권장 |

## 2. Spline MCP 연결 여부

- 이 세션의 MCP 서버 목록: Canva, Figma, Higgsfield, ElevenLabs(제한판), Vercel, Netlify, Supabase, Google Drive/Gmail/Calendar, Microsoft 365, GitHub, Adobe(연결 실패: 프록시 403). **Spline 서버는 없음.**
- 외부 HTTP(`spline.design`, `docs.spline.design`, `prod.spline.design`, `trionn.com`)는 컨테이너 네트워크 정책상 차단되어 Spline 웹 문서·벤치마크 사이트도 직접 열 수 없었습니다. 벤치마킹은 기존 지식 기반으로 수행합니다.
- npm에서 `@splinetool/react-spline@4.1.0`, `@splinetool/runtime@2.0.129` 설치는 가능합니다 → Spline에서 만든 `.splinecode` URL만 있으면 **런타임 임베드는 문제 없음**.

**필요 조치(사용자)**: Spline 계정으로 작업할 경우 (1) Spline MCP 서버를 Claude 환경에 등록하거나, (2) Spline 에디터에서 장면 제작 후 `.splinecode` 공개 URL 또는 GLB 내보내기 파일을 전달. Spline 공식 MCP의 제공 범위(장면 생성/편집/AI 생성 가능 여부)는 연결 후 실제 툴 목록으로 재검증합니다. **확인 전까지 "Spline MCP로 자동 생성"을 전제한 일정은 잡지 않습니다.**

## 3. Spline AI 3D 생성 테스트

MCP 미연결로 테스트 불가. 대신 이 세션에 연결된 **Higgsfield `generate_3d`** 를 확인했습니다.

- 모델: `image_to_3d`(단일 이미지, 텍스처·PBR 옵션), `multi_image_to_3d`(2~4 뷰, 기하 정확도↑), `sam_3_3d`(단일 오브젝트 분리 재구성).
- 결과: GLB 메시 → Three.js/R3F 직접 로드 가능.
- 비용: Higgsfield 크레딧 과금(`get_cost:true`로 사전 견적 가능). 실행 전 사용자 승인 필요.
- 한계: 사진 기반 생성은 **인쇄 텍스트가 뭉개짐**. 따라서 용기·박스는 **Three.js 프로시저럴 모델 + 원본 비율 디칼 텍스처**가 로고 정확도 면에서 우위. 이미지→3D는 케이크 등 유기 형태에 적합.

## 4. Three.js / React Three Fiber

| 패키지 | 최신 버전(레지스트리 확인) | 비고 |
|---|---|---|
| three | 0.187.0 | WebGPU 렌더러 포함, WebGL2 폴백 |
| @react-three/fiber | 9.8.2 | React 19 호환 |
| @react-three/drei | 10.7.9 | `Environment`, `MeshTransmissionMaterial`, `Decal`, `Text3D`, `ScrollControls`, `useGLTF`(Draco/KTX2) |
| @react-three/postprocessing | 설치 가능 | Bloom(골드 글로우), DepthOfField, Vignette |
| lenis | 1.3.27 | 스무스 스크롤 |
| gsap | 3.15.0 | ScrollTrigger, SplitText(무료화) |

Next.js 15 App Router에서는 R3F 캔버스를 `"use client"` + `next/dynamic({ ssr:false })`로 로드하고, `transpilePackages: ["three"]` 설정. 확인된 리스크: React 19 + drei 10은 호환되나 일부 서드파티(예: `@react-spring/three`)는 peer 경고 가능 → 애니메이션은 GSAP로 통일.

## 5. GSAP ScrollTrigger

- 설치 가능, 2024-10 이후 **ScrollTrigger·SplitText·MorphSVG 등 전 플러그인 무료**(Webflow 인수 후). 상업 사이트 사용 가능.
- Lenis와 결합: `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`. 핀 섹션은 `pin: true, scrub: 1` 로 스크롤 멈춤 시 진행 상태 유지 → 지시문 요건 충족.
- R3F와 연결: `useFrame` 대신 ScrollTrigger `onUpdate(self.progress)`를 ref에 기록하고 캔버스가 읽는 단방향 패턴(스크롤 튐 방지).

## 6. Canva Connect API 인증 및 MP4 Export

실제 호출 결과:
- `search-designs` 성공 → 사용자 Canva 계정에 **"UNI&CORE Global Company Profile 2026"**(18p 프레젠테이션) 존재. 인증 정상.
- `list-brand-kits` 성공 → 브랜드 킷 1개(`kAF6r_2iDQg`) 존재.
- `get-export-formats` → `export-design(type:"mp4", quality:"horizontal_1080p")` 로 MP4 다운로드 URL 획득 가능(디자인이 영상/애니메이션 요소를 포함할 때).

**결론**: 별도 OAuth 서버 구현 없이도 **Canva MCP로 "제작 → MP4 Export → 다운로드 → 스토리지 업로드"** 파이프라인을 이 세션에서 수행할 수 있습니다. 서버 측 Canva Connect API(OAuth 2.0, `design:content:read`, `asset:read` 등)는 **운영 중 콘텐츠 자동 갱신이 필요할 때만** 추가 구현(설계는 `06_video-audio-system.md`). 토큰은 서버 환경변수로만 보관. Canva는 **영상 제작 도구이지 실시간 재생 엔진이 아님** → 사이트는 Export된 MP4/WebM 정적 파일만 재생.

## 7. 모바일 WebGL 지원

| 환경 | WebGL2 | 비고 |
|---|---|---|
| iOS Safari 15+ | ✅ | GPU 메모리 보수적, 텍스처 2048px 권장, 컨텍스트 로스트 대비 |
| Android Chrome | ✅ | 저가형 Mali/Adreno는 셰이더 복잡도·파티클 수 제한 |
| 삼성 인터넷 | ✅ | – |
| 인앱 브라우저(카카오/인스타) | ⚠️ 대체로 가능, 자동재생·오디오 제약 큼 | 폴백 필수 |

대응: `drei/PerformanceMonitor` + `@react-three/fiber` `dpr` 적응, `navigator.hardwareConcurrency`·`deviceMemory` 기반 3단계 품질 프리셋(HIGH/MID/LITE), WebGL 미지원 시 2.5D CSS 레이어 폴백. 컨테이너에는 Chromium+Playwright가 있어 **SwiftShader 기반 WebGL 렌더 스모크 테스트**를 CI에서 돌릴 수 있습니다.

## 8. 영상 자동재생 및 오디오 정책

- Chrome/Safari/Firefox 공통: `muted` + `playsinline` + `autoplay` 는 허용. 소리 있는 재생은 **사용자 제스처(클릭/탭) 이후**에만 가능. iOS 저전력 모드에서는 muted 자동재생도 차단될 수 있음 → 포스터 + "탭하여 재생" 오버레이.
- 설계 반영: 인트로 첫 화면에서 `SOUND ON / SOUND OFF / SKIP INTRO` 선택을 받은 뒤(이 클릭이 제스처가 됨) AudioContext resume + 영상 unmute. 전역 `AudioController`가 단일 출력 소유.

## 9. 기타 연동 가능 도구(세션 내 확인)

| 도구 | 상태 | 활용 |
|---|---|---|
| Higgsfield MCP | ✅ 연결 | 케이크 인트로 **영상 생성**(`generate_video`), 이미지→3D, 업스케일. 크레딧 과금, 실행 전 승인 |
| ElevenLabs MCP(제한판) | ✅ 연결 | 음성 생성·전사만. **음악/효과음 생성 불가**(풀 커넥터 필요) |
| Figma MCP | ✅ 연결 | 디자인 시안·스토리보드 보드 제작 가능 |
| Adobe MCP | ❌ 연결 실패(프록시 403) | 재시도 필요 |
| Vercel / Netlify MCP | ✅ 연결 | 배포·도메인·환경변수 |
| Supabase MCP | ✅ 연결 | 영상/모델 스토리지, 콘텐츠 CMS 대안 |
| ffmpeg / ffprobe | ✅ 설치됨 | 영상 분석·트랜스코딩(WebM/AV1, 모바일 9:16 리사이즈) |
| tesseract(OCR) | ❌ 미설치 | 상세페이지 도착 시 설치 또는 Vision 기반 OCR |
| 외부 HTTP | ❌ 차단(npm 제외) | 벤치마크 사이트 직접 열람 불가 |

## 10. 최종 추천 아키텍처

```
apps/unicore-birthday/              ← 독립 Next.js 15 앱 (별도 Vercel 프로젝트)
├─ src/app/(site)/page.tsx          ← 단일 롱폼 시네마틱 페이지 (SSR 텍스트 + 클라이언트 3D)
├─ src/app/api/canva/export/route.ts← (옵션) Canva Connect 서버 라우트
├─ src/features/intro/              ← 케이크 인트로 · 사운드 게이트 · 제품 필름
├─ src/features/scenes/             ← R3F 장면 12개 (섹션별 lazy)
├─ src/features/motion/             ← GSAP/Lenis 컨트롤러, SplitText 유틸
├─ src/features/audio/              ← 전역 AudioController
├─ src/data/{product,ingredients,clinical,videos,seo,copy}.ts
├─ public/models/*.glb (Draco)  public/textures/*.ktx2  public/video/*.{mp4,webm}
└─ scripts/{optimize-video.sh, compress-glb.mjs, ocr-detail-page.mjs}
```

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router + TypeScript | 기존 팀 스택, SSR로 SEO 텍스트 보장 |
| 3D | Three.js 0.187 + R3F 9 + drei 10 + postprocessing | 제품 정확도(디칼), 커스텀 셰이더, 성능 제어 |
| Spline | `@splinetool/react-spline` 런타임만 (장면 확보 시) | 케이크·선물상자 등 장식 장면에 선택 적용 |
| 모션 | GSAP 3.15 ScrollTrigger + SplitText + Lenis | 스크럽·핀·텍스트 모션 표준 |
| 영상 | MP4(H.264) + WebM(VP9/AV1), HLS 불필요(≤60초 클립) | 호환성 |
| 영상 제작 | Canva(MCP Export) 1순위, Higgsfield 생성 2순위, 수동 업로드 폴백 | 연결 확인됨 |
| 스토리지 | Vercel Blob 또는 Supabase Storage(+CDN) | 영상·GLB 대용량 |
| 폰트 | Pretendard Variable(셀프호스팅), Cormorant Garamond / Inter(Google Fonts → 셀프호스팅) | 라이선스 안전 |
| 배포 | Vercel (Preview URL로 단계별 검수) | 기존 계정 |
| QA | Playwright(설치됨) 스크린샷 리그레션 + Lighthouse CI | – |

## 11. 사용자 결정이 필요한 항목

1. 앱 위치: **A(모노레포 `apps/unicore-birthday/`)** vs B(별도 저장소).
2. Spline 사용 여부: 계정·MCP 연결 의사(없으면 Three.js 단독으로 진행, 품질 차이 없음).
3. 케이크 인트로 제작 경로: Canva(디자이너 수작업+Export) vs Higgsfield 영상 생성(크레딧) vs 외주 실사 촬영.
4. 배포 도메인(예: `birthday.unicore.co.kr`) 및 구매 페이지 URL.
5. 음원: 라이선스 음원 구매처(Artlist/Epidemic 등) 또는 오리지널 제작 여부.
