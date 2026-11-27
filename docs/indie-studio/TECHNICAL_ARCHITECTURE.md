# NEXT-GEN INDIE STUDIO — 기술 구조

작성 2026-11-27 · BIT PARK 포털 세션과 함께 정한 분담을 기록합니다.

## 1. 한 장 요약

```
 게임 (각자 독립 실행·빌드·테스트)                         공통 플랫폼 (이미 운영 중)
 ┌──────────────────────────────────────────┐        ┌───────────────────────────────────────────┐
 │ robot-platform                             │        │ bitpark-portal  (BIT PARK, Supabase)       │
 │  apps/game-lab/<id>   웹 게임(ES 모듈)      │  SDK   │  계정·친구·초대·길드·랭킹·업적·PP 원장       │
 │    src/logic.js  규칙(순수·결정론)          │ ─────► │  score 함수: proof 를 verify.js 로 재생 검증 │
 │    src/levels.js · src/verify.js · portal.js│  v1    │  대전 허브(race-server)·커뮤니티·관리자      │
 │  apps/special-soldier  Three.js FPS        │        ├───────────────────────────────────────────┤
 │  apps/unity-studio     Unity 6 판           │ RP msg │ airobotverse- (airobotphysical.com)        │
 │                                            │ ─────► │  게임 iframe · game_result → RP (Firebase)  │
 └──────────────────────────────────────────┘        └───────────────────────────────────────────┘
          │ docs/game-dev/bitpark/feed.json (GAME DEV LAB 데이터: 게임·테스트·스크린샷)  ▲
          └──────────────────────────────────────────────────────────────────────────┘
```

프롬프트의 `NEXT-GEN-INDIE-STUDIO/` 트리는 새 저장소를 만들지 않고 **이미 있는 저장소에 대응**시킵니다 (빈 폴더를 만들지 않기 위해):

| 제안 트리 | 실제 위치 | 담당 |
|---|---|---|
| `docs/` (시장·GitHub·기획·구조) | `robot-platform/docs/indie-studio/` | 이 세션(허브) |
| `games/rogue-legends` 등 | `robot-platform/apps/game-lab/<id>` (생성기 `tools/game-lab/new-game.mjs`) | 이 세션 |
| `games/tactical-arena` (원형) | `robot-platform/apps/special-soldier` + `apps/unity-studio` | 이 세션 + PC Unity 세션 |
| `games/puzzle-universe` | BIT PARK 퍼즐 네트워크(30종+, 서버 검증) | BIT PARK·퍼즐 세션 |
| `platform/` · `backend/` (계정·친구·랭킹·업적·매치·DB) | `bitpark-portal` (Supabase + Cloudflare 대전 서버) — 현황표 `docs/STUDIO_PLATFORM_MATRIX.md`(20개 중 12 완료·6 부분·2 없음) | BIT PARK 포털 세션 |
| RP 경제 | `airobotverse-` `points.ts` / `GamePlayClient.tsx` | 포털 PR로 |
| `assets/` | 게임마다 `ASSET_LICENSES.md` 대장 + `free-asset-pipeline` 스킬 | 각 게임 |
| `tools/` | `tools/game-lab`, `tools/portal`, `tools/indie-studio`, 게임별 `tools/sim.mjs` | 이 세션 |

## 2. 게임 ↔ 플랫폼 계약 (모든 새 게임이 지킴)
1. **규칙은 순수 함수**: `src/logic.js`(브라우저 API·`Math.random` 금지, 다른 import 없음), `src/levels.js`(LEVELS 배열), `src/verify.js`(`verify(levelIndex0, proof) → { ok, metric, … }`).
2. **결정론**: 시드 RNG를 상태에 넣고, 플레이 = 행동 목록. 저장 파일 = proof. 서버는 클라이언트 점수를 믿지 않고 재생한다.
3. **포털 브리지** `src/portal.js`: `ready` · `levelStart(level)` · `result({ level, score, grade, proof, clear })` → airobotphysical `game_result`(RP) + BIT PARK SDK v1 `levelClear`. 포털 밖에서는 아무것도 안 보냄.
4. **피드**: `game.json`(id·장르·상태·요약·portal) → `node tools/portal/export-bitpark-feed.mjs` → BIT PARK `collect-lab.mjs`가 게임 파일과 스크린샷을 가져가 포털 플레이어(`/#play/<slug>`)에서 연다. 포털 반영은 **PR**로.

## 3. 엔진 선택 (게임별)
| 게임 | 선택 | 이유 |
|---|---|---|
| ROGUE LEGENDS | **웹(ES 모듈, DOM/CSS/SVG)** → 이후 Steam용 데스크톱 래핑 | 카드 게임은 UI가 본체 — HTML/CSS가 가장 빠르고 선명. 규칙이 순수 JS라 서버 검증·봇·시뮬레이터가 같은 코드. 설치 없이 이 환경에서 테스트 가능 |
| SURVIVAL WORLD | 후보: Godot 4(오픈소스·MIT, 절차 생성) 또는 Unity 6(이미 섬 지형·식생 공유 구조 보유) | 시장 조사·GitHub 감사 결과로 결정 |
| TACTICAL ARENA | 웹 Three.js(운영 중) + Unity 6 판 | 이미 15v15 멀티 서버 코드·Unity 캠페인 이식이 있음 |
| LIFE SIMULATION | Godot 4 또는 웹 | 2D·데이터 중심 |
| PUZZLE UNIVERSE | 웹 (BIT PARK) | 이미 운영 중 |
Unreal Engine 5는 고품질 3D 오픈월드에만 검토(5% 로열티 조건은 적용 시점에 확인). Unity·Unreal 라이선스는 실제 출시 시점에 다시 확인합니다.

## 4. AI 기능의 위치
AI NPC·AI 게임 디렉터·절차 생성은 **규칙 밖의 선택 층**으로 둡니다. AI가 꺼지거나 네트워크가 끊겨도 `logic.js`만으로 게임이 돌아가야 하고,
AI가 만든 결과(예: 생성된 사건·대사)는 검증 가능한 데이터(시드·행동)로만 규칙에 들어갑니다. 키는 서버 환경 변수에만 둡니다.

## 5. 보안·치트
- 점수·보상은 서버(BIT PARK score 함수)가 proof 재생으로만 인정. 클라이언트 RP 값은 사이트가 상한을 건다(airobotphysical).
- 시간 하한(너무 빠른 제출 거부)·시작 토큰(서버 시계)은 BIT PARK 쪽에 이미 있음.
