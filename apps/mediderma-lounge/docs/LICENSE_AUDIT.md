# License Audit

수집일: 2026-11-11. 이 문서는 법률 자문이 아니며, 상용 출시 전에 권리자·법무 확인이 필요한 항목을 표시해 둔다.

## 1. 런타임 의존성 (npm)
| 패키지 | 라이선스 | 비고 |
|---|---|---|
| react, react-dom | MIT | |
| three | MIT | |
| @react-three/fiber, @react-three/drei, @react-three/postprocessing | MIT | |
| zustand | MIT | |
| vite, @vitejs/plugin-react, typescript(Apache-2.0), tailwindcss, postcss, autoprefixer | MIT / Apache-2.0 | 빌드 도구 |

GPL·AGPL 계열 의존성 없음. 전이 의존성까지의 전수 점검(`license-checker` 등)은 아직 하지 않았다 → 출시 전 CI 에 추가 권장.

## 2. 참고 저장소 6곳
코드를 **복사하지 않았다.** 이 실행 환경에서는 대상 저장소에 접근 권한이 없어 각 저장소의 LICENSE 파일만 조회했고, 소스 구조 분석은 하지 못했다. 아키텍처는 R3F 의 일반적인 패턴으로 독립 작성했다.

| 저장소 | LICENSE 조회 결과 | 판단 |
|---|---|---|
| pmndrs/racing-game | MIT (`LICENSE.md`) | 코드 참고 가능. 단, 포함된 3D 모델·사운드는 별도 라이선스일 수 있어 에셋은 사용 금지 |
| instructa/viber3d | MIT (`LICENSE`) | 참고 가능 |
| norio/vrm-game-starter | MIT (`LICENSE`) | 참고 가능. VRM 모델은 모델별 라이선스 확인 필요 |
| robertguss/treehouse | 루트에서 LICENSE 파일을 찾지 못함 | **라이선스 미확인 → 사용 금지**(명시적 허가 없는 코드는 저작권 보호 대상) |
| Elfoslav/3d-virtual-store | 루트에서 LICENSE 파일을 찾지 못함 | **미확인 → 사용 금지** |
| kamilch1k/top-down-character-demo | 루트에서 LICENSE 파일을 찾지 못함 | **미확인 → 사용 금지** |

"찾지 못함"은 `main`/`master` 브랜치 루트의 `LICENSE`, `LICENSE.md`, `license` 경로 조회가 실패했다는 뜻이다. 저장소가 다른 경로에 라이선스를 두었거나 이름·기본 브랜치가 다를 수 있으므로, 실제로 참고하려면 저장소 페이지에서 다시 확인한다.

### 추가 분석: donchitos/claude-code-game-studios
MIT (`LICENSE`, Copyright (c) 2026 Donchitos). Claude Code 용 게임 개발 작업 방식 템플릿. **코드·스크립트·문서 본문은 복사하지 않고** 규칙만 읽어 이 게임에 맞게 새로 구현했다. 반영 내역은 `STUDIO_PRACTICES.md`.

## 3. 3D 에셋
| 에셋 | 출처 | 상태 |
|---|---|---|
| 캐릭터, 라운지, 가구, 제품 용기 | 본 프로젝트 코드(프로시저럴) | 자체 제작 |
| DERMA HOME 본체·핸드피스 | 공식 제품 사진을 보고 코드로 모델링 | 자체 제작. **실제 제품 디자인·로고 재현이므로 권리자(UNI&CORE) 승인 필요** |
| `public/models/*.glb` (DERMA HOME 본체, 케어 베드, 소파) | 본 프로젝트의 Blender 스크립트로 생성 | 자체 제작 |
| 외부 3D 모델 / AI 생성 모델 | 없음 | — |

## 4. 브랜드 자산 — 출시 전 권리자 확인 필요
| 항목 | 사용 방식 | 확인할 것 |
|---|---|---|
| UNI&CORE, DERMA HOME, MEDIDERMA 명칭·로고 표기 | UI 텍스트, 3D 사인·디바이스 스크린 | 상표 사용 승인, 로고 가이드 |
| 상품 이미지 48장 (`public/products/*.webp`) | 공식몰 이미지를 320px 로 축소해 도감·숍 UI 에 표시 | 이미지 사용 승인. 승인 전 외부 공개 배포 시에는 제거하거나 권리자 CDN 링크로 대체 |
| 상품명·전성분·사용방법 | 공식 표기 그대로 인용 | 최신성 유지 책임자 지정(상품 변경 시 `products.ts` 갱신) |
| 더마홈 루틴·모드 설명 | 요약 인용 | 문구 검수 |

본 저장소의 기존 앱(`apps/unicore-birthday`)이 같은 브랜드 자산을 사용하고 있어 프로젝트 소유자가 권리자 또는 그 위임을 받은 것으로 가정했다. 그 가정이 틀리면 4번 표의 자산은 사용할 수 없다.

## 5. 표시·광고 관련 주의 (비법률 메모)
- 화장품·기기의 효능을 암시하는 표현을 피했다: 캐릭터 변화는 "게임 EXP 에 따른 판타지 연출"로 고지(스플래시, 케어 결과, 도감 상세, 성장 화면).
- 아이템 등급은 "수집 희귀도"임을 숍에 고지.
- 게임 내 구매는 "가상 아이템이며 실제 주문이 아님"을 숍·도감에 고지하고 공식몰 링크를 분리.
- 공식 상품명에 포함된 "화이트닝" 등의 표현은 상품명으로만 노출하고 게임 문구에서 효능으로 풀어 쓰지 않았다.
- 파트너 사업의 장려금·수익 수치는 게임에 넣지 않았다.
- 현금 결제·확률형 아이템 없음.

## 6. 외부 도구
Blender(GPL — 도구의 라이선스이며 Blender 로 만든 결과물에는 적용되지 않는다)는 `tools/blender/build_assets.py` 로 GLB 5개를 만드는 데 사용했다. Meshy, Tripo3D, Tinkercad, Blockbench, Womp, Gemini, Google Flow 는 사용하지 않았다. 도입 시 각 도구의 플랜별 상업적 이용 조건과 생성물 권리 귀속을 이 문서에 기록한다.

## 7. 폰트
웹폰트 파일을 포함하지 않는다. 시스템 폰트 스택(Pretendard 가 설치된 경우 우선)만 사용.
