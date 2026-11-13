# Technical Architecture

## 스택 (v0.1)
| 영역 | 선택 | 비고 |
|---|---|---|
| 빌드 | Vite 5 + TypeScript(strict) | `base: "./"` — 어떤 하위 경로에도 배포 가능 |
| UI | React 18 + Tailwind CSS 3 | |
| 3D | three 0.169 + @react-three/fiber 8 + drei 9 | |
| 후처리 | @react-three/postprocessing (Bloom, Vignette) | 고품질 모드에서만 |
| 상태 | Zustand 4 (+ persist) | |
| 저장 | localStorage (`mediderma-lounge-save-v1`) | 실패 시 메모리 폴백 |

요청서의 권장 스택 중 **쓰지 않은 것과 이유**
- React Three Rapier: 실내 이동만 있어 원형 충돌 밀어내기로 충분. 물리 엔진(wasm ~1MB)을 빼 초기 로딩을 줄였다.
- GLTFLoader / Draco / KTX2: 현재 에셋이 전부 프로시저럴이라 로드할 파일이 없다. GLB 도입 시 추가(→ GAME_ASSET_PIPELINE.md).
- Node / PostgreSQL / Prisma / Redis / WebSocket: 싱글플레이 MVP 라 서버가 없다. Phase 4~5.

## 디렉터리
```
apps/mediderma-lounge
├─ public/products/*.webp        공식몰 상품 썸네일(320px) — 파일명 = 공식몰 productSeq
├─ src/data/
│   ├─ products.ts               [실데이터] UNI&CORE 48종 + 게임 속성
│   ├─ devices.ts                [실데이터] 모드·부위·공식 루틴
│   └─ game.ts                   [게임 데이터] 성장·라운지·패션·인테리어·고객·퀘스트·데모 SNS
├─ src/i18n/                     ko.json / en.json / extra.json(7개 언어 핵심 UI)
├─ src/store/
│   ├─ game.ts                   영구 상태 + 액션(구매·장착·배치·보상)
│   ├─ ui.ts                     런타임 상태(모드·패널·케어 세션·방문 고객) + 프레임 입력 공유 객체
│   └─ care.ts                   케어 세션 상태 전이(순수 로직)
├─ src/three/
│   ├─ World.tsx                 Canvas, 플레이어 이동, 카메라 리그, 존 감지, 성장 디렉터
│   ├─ Character.tsx             프로시저럴 캐릭터(프로포션 보간·헤어 7종·액세서리·애니메이션)
│   ├─ Lounge.tsx / layout.ts    공간·등급별 배치
│   ├─ Props.tsx                 DERMA HOME, 핸드피스, 베드, 제품 용기, 가구
│   ├─ Care3D.tsx                부위 마커·스트로크 판정·모드별 파티클
│   └─ Customers.tsx             NPC 스포너·상태 머신
└─ src/ui/                       Screens / Hud / CarePanel / Panels
```

## 상태 설계
- **영구 상태는 직렬화 가능한 순수 데이터만** 담는다. 서버 저장으로 옮길 때 같은 형태를 그대로 쓸 수 있다.
- 프레임마다 바뀌는 값(조이스틱, 플레이어 좌표, 카메라 각, 이펙트 위치)은 React 상태가 아닌 모듈 객체(`input`, `careFx`, `npcPos`)로 공유해 리렌더를 피한다.
- 세이브 `merge` 가 기본값과 병합하므로 필드가 추가돼도 옛 세이브가 깨지지 않는다.

## 렌더링·성능
- 품질 자동 조절: `PerformanceMonitor` 가 프레임 저하를 감지하면 low(그림자·후처리·AA 끔, DPR 0.75~1.25)로 내린다. 모바일 UA 는 low 에서 시작. 설정에서 수동 고정 가능.
- 벽은 안쪽 면만 그려 카메라가 가려지지 않게 하고, 카메라 위치를 방 안으로 클램프한다.
- 텍스트는 CanvasTexture — 폰트 파일·CDN 요청이 없다.
- 번들(gzip): three 176KB · r3f/drei/postprocessing 113KB · 앱 65KB · CSS 6KB.

## 조작
| | PC | 모바일 |
|---|---|---|
| 이동 | WASD·방향키 / 바닥 클릭 | 조이스틱 / 바닥 탭 |
| 카메라 | 드래그 회전, 휠 줌, Q·R | 한 손가락 드래그, 핀치 줌 |
| 상호작용 | E·Space·Enter | 떠오르는 액션 버튼 |
| 케어 | 누른 채 문지르기 | 터치로 문지르기(누르고만 있어도 천천히 진행) |

## 오류 처리
- `Boundary`(ErrorBoundary): WebGL 실패·렌더 예외 시 안내 화면 + 새로고침.
- 저장소 접근 실패(시크릿 모드·용량 초과) → 메모리 폴백, 설정에 상태 표시.
- 사진 게시물은 최근 6장만 이미지 유지(localStorage 용량 보호).
- 상품 이미지 로드 실패 시 숨김 처리.

## 온라인 전환 시 보안 원칙 (Phase 4~5, 미구현)
현재는 모든 재화가 클라이언트에 있어 **조작 가능하다**. 멀티플레이 도입 시:
- 재화·보상·거래는 서버가 계산하고 클라이언트는 "행동"만 보낸다(케어 완료 이벤트 → 서버가 EXP·코인 산정).
- 세이브는 서버가 원본, 클라이언트는 캐시.
- SNS 게시물은 신고·차단·이미지 검수 경로가 있어야 공개한다.

## 어드민 연동 준비
`Product` 타입이 실데이터 필드와 게임 필드를 분리하고 있어, 상품 관리 화면에서 실데이터만 갱신해도 아이템에 반영되는 구조다. 실제 주문·재고 연동은 **인증된 공식 API 가 제공될 때만** 붙인다. 공개 페이지에서 비공개 API 를 추측해 호출하지 않는다.
