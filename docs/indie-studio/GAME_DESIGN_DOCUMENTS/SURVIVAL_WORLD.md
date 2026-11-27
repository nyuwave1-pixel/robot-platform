# SURVIVAL WORLD — 기획서 (기술 프로토타입 단계)

작성 2026-11-27 · 코드 `apps/game-lab/survival-world` · 상태 **기술 프로토타입**(DEVELOPMENT_PRIORITY: "지금은 작은 기술 프로토타입만")

## 1. 왜 두 번째인가
시장 조사(GENRE_ANALYSIS): 생존 제작은 $100K 달성 비율이 가장 높은 장르(28%, steamrankings 2026-11)이고, 협동 멀티가 장수 요인입니다.
대신 개발 범위가 가장 큽니다. 그래서 지금은 "핵심 루프가 웹에서 돌아가는가"만 확인하고, 본 개발 여부는 ROGUE LEGENDS 테스트 결과 뒤에 정합니다.

## 2. 핵심 루프 (프로토타입에 들어간 것)
채집(나무·돌·열매/섬유) → 제작(도끼·곡괭이·창·모닥불·벽·구운 고기) → 밤 대비(모닥불 곁: 체온 회복·늑대가 다가오지 못함, 벽으로 막기) → 아침에 더 멀리 탐험.
- 생존 수치: 배고픔(초당 −0.16), 갈증(−0.22), 체온(밤 −0.45, 불 곁 +4), 기력(달리기). 0이 되면 체력이 깎이고, 배·목이 넉넉하면 천천히 회복.
- 하루 6분(06:00 시작, 밤 19:00–05:30). 밤마다 늑대가 늘어남(최대 4 + 날짜).
- 섬은 시드로 만들어져 "같은 섬"을 친구와 공유할 수 있음(`?seed=`) — 이후 협동 서버·월드 공유의 기반.

## 3. 차별화 후보 (다음 단계에서 하나를 고름)
| 후보 | 내용 |
|---|---|
| 시드 섬 레이스 | 같은 시드 섬에서 누가 더 오래·빨리 목표(탈출 뗏목 등)를 달성하나 — BIT PARK 리그와 연결 |
| 생태계 반응 | 나무를 너무 베면 동물이 떠나고, 불을 많이 피우면 늑대가 늘어나는 "섬의 기억" |
| AI 생존자 NPC | 섬에 다른 생존자가 있고 거래·협력·배신 — AI 대사는 규칙 밖 선택 층(TECHNICAL_ARCHITECTURE §4) |

## 4. 기술 메모
- 규칙(`logic.js`)은 순수 함수·시드 RNG라 node 테스트가 됩니다(테스트 8개). 화면은 three.js r170(MIT)을 저장소에 함께 두어 설치 없이 실행.
- 실시간 3D라 ROGUE LEGENDS 같은 "행동 목록 재생" 검증은 아직 없음 → 포털 랭킹·PP는 등록하지 않음. 협동 서버를 만들면 서버 권위 구조로 검증.
- 엔진: 웹으로 루프를 검증한 뒤, 본 개발에서 Godot 4 / Unity 6 중 선택(TECHNICAL_ARCHITECTURE §3). 우리 Unity 판에는 이미 섬 지형·식생 공유 구조가 있음.

## 5. 유니티판 (2026-11-27)

- **모델**: Blender 스크립트 `apps/game-lab/survival-world/blender/build_assets.py` 가 나무 2종·바위·덤불·늑대(다리·머리·꼬리 피벗)·모닥불·벽·도구 3종을 만들어 `assets/survival.glb` 로 내보냄 (`--render` 는 Cycles CPU 미리보기). 원본 직접 제작이라 라이선스 문제 없음.
- **규칙**: `apps/unity-studio/Assets/Scripts/Core/Survival/SurvivalRules.cs` — 웹 `logic.js` 를 옮긴 것. `Tools~/gen-survival-fixture.mjs` 로 웹 결과를 뽑아 지형·월드·난수·밤 시뮬레이션이 같은지 `dotnet test` 로 확인.
- **런타임**: `Runtime/Survival/SurvivalDirector.cs`(조작은 웹과 같음, IMGUI HUD), `SurvivalTerrain.cs`(웹 z → Unity −z).
- **씬**: 메뉴 *Survival World/Build Island Scene* → `Assets/Survival/SurvivalIsland.unity`. WebGL: `SurvivalSceneBuilder.BuildWebGL` → `Builds/SurvivalWebGL`.
- 아직 없는 것: 저장(웹판에만 있음), 사운드, 게임패드.
