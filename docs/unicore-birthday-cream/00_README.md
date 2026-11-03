# UNI&CORE 1ST BIRTHDAY CREAM — Immersive 3D Brand Site 기획 패키지

> PHASE 01 STRATEGY & PLANNING 산출물. **코드는 아직 작성하지 않았습니다.** 승인 후 PHASE 02(디자인)·03(3D)부터 단계적으로 진행합니다.

| 문서 | 내용 |
|---|---|
| [01_asset-analysis.md](./01_asset-analysis.md) | 첨부 자료 분석 — 상세페이지(261102 수정본) 전 구간 전사, 영상 2종 분석, 임상 수치 대조, 반영 규칙 |
| [02_tech-feasibility.md](./02_tech-feasibility.md) | 기술 사전 검증 — Spline/Canva/Three.js/GSAP/WebGL/자동재생 정책, 추천 아키텍처 |
| [03_website-plan.md](./03_website-plan.md) | 전체 기획안 — 브랜드 스토리, IA, 디자인 시스템, 콘텐츠 데이터 구조, 표현 가이드 |
| [04_storyboard.md](./04_storyboard.md) | 인트로 3단계 + 13개 섹션 상세 스토리보드(스크럽 키프레임) |
| [05_3d-production-plan.md](./05_3d-production-plan.md) | 3D 제작 대상·스펙·파이프라인, Spline MCP 연동 계획 |
| [06_video-audio-system.md](./06_video-audio-system.md) | 영상·오디오 시스템, Canva Export 연동, 디자이너 브리프 |
| [07_responsive-design.md](./07_responsive-design.md) | PC/태블릿/모바일 경험 설계, 제스처·성능 가드 |
| [08_schedule.md](./08_schedule.md) | 7주 일정, 단계별 완료 기준, 리스크 |
| [intro-design-draft.html](./intro-design-draft.html) | 메인 인트로 디자인 시안(정적 HTML, 브라우저에서 열기) |
| `assets/` | 제품 패키지 레퍼런스 사진 2장 |

## 한눈에 보는 핵심 결론
1. **자료**: 상세페이지 수정본·제품 영상(16:9/9:16 4K 63초)·패키지 사진 확보. 케이크 인트로 영상만 신규 제작.
2. **수치**: 볼 리프팅 48.33%, 목 주름 19.06%, 이상반응 0건, 만족도 100%×5 — 상세페이지·영상·지시문 **일치**, 각주 원문 확보. 단, 피부 고민 설문(300명)은 상세페이지에 **예시 데이터**로 명시되어 있어 노출 금지.
3. **기술**: Next.js 15 + React Three Fiber + GSAP ScrollTrigger + Lenis. Spline MCP 미연결(없어도 품질 동일), Canva MCP 연결·MP4 Export 가능 확인.
4. **구조**: 인트로 3단계 → 13개 시네마틱 섹션(단일 캔버스, 섹션별 View) → CTA. 모바일은 세로 영상·세로 스냅·고정 CTA의 별도 경험.

## 승인이 필요한 결정 사항
| # | 항목 | 권장안 |
|---|---|---|
| 1 | 코드 위치 | 이 저장소 `apps/unicore-birthday/` 독립 앱(별도 Vercel 프로젝트) |
| 2 | Spline 사용 | 선택. 계정·MCP 연결 시 케이크·분자 장면만 적용 |
| 3 | 케이크 인트로 제작 | Canva(디자이너) 1순위, Higgsfield 생성 2순위 |
| 4 | 도메인·구매 URL·브랜드 페이지 URL | 회신 필요 |
| 5 | BGM 음원 | 라이선스 구매 또는 오리지널 제작 |
| 6 | 로고 벡터·PDRN 순도 근거·실제 설문 자료 | 가능하면 제공 |

## 현재 차단 사항
- GitHub 푸시 권한 403 → https://claude.ai/connect-github 재연결 필요(로컬 커밋은 보존됨).
