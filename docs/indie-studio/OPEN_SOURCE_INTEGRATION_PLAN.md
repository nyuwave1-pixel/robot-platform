# 오픈소스 통합 계획 — 5개 프로젝트 + GPL 격리 정책

> 확인일: **2026-11-27**. 근거 문서: `GITHUB_REPOSITORY_AUDIT.md`(저장소·구조), `OPEN_SOURCE_LICENSE_AUDIT.md`(판정), `REUSABLE_SYSTEMS.md`(검증된 파일 경로).
> 원칙: **허용 라이선스(MIT/BSD/ISC/Zlib/Apache/CC0)만 코드 반입**, UCL은 Unity판만, GPL·AGPL·CC-BY-SA는 §7 정책에 따라 학습 → 명세서 → 클린룸.
> 반입한 코드는 각 게임 폴더 `THIRD_PARTY.md`에, 에셋은 `ASSET_LICENSES.md` + `free-asset-pipeline` 스킬 절차로 기록한다.

---

## 1. ROGUE LEGENDS (웹 ES 모듈 덱빌더 — 가장 먼저 만든 게임)

**현재 상태(저장소 확인)**: `apps/game-lab/rogue-legends/` — `game.json` status `playable`, `src/logic.js`는 브라우저 API·`Math.random` 없는 순수 규칙(mulberry32 RNG, `newRun`/`legal`/`apply`/`encode`/`decode`), 행동 목록 = 세이브 = 점수 증명. 영웅 2·카드 34·유물 10·적 8, 13층. `THIRD_PARTY.md`는 "(아직 없음)", `learnedFrom: []`.

| 단계 | 할 일 | 출처 (라이선스) | 방식 |
|---|---|---|---|
| R1 | **액션 인터셉터 계층**: 유물·상태이상이 `apply()` 안에서 효과 op(`['dmg', n]` 등)를 실행 직전에 수정하도록 일원화 → 카드 설명/적 의도 미리보기가 같은 계산 경로를 쓰게 | Slay-The-Robot `scripts/action_interceptors/ActionInterceptorProcessor.gd`, `BaseActionInterceptor.gd` (MIT) | 패턴 차용, JS로 새로 작성. 코드 일부를 옮기면 `THIRD_PARTY.md`에 MIT 고지 |
| R2 | **희귀도별 효과 예산표** 문서화(카드 34장 밸런스 검사 테스트) | WUTW `wutw/cards/card_type.gd` 주석 (CC0) | 규칙 아이디어 차용(고지 불필요, `learnedFrom`에 기록) |
| R3 | **수정자 변수 레지스트리**(손패 수·보상 선택지·상점가 % 등) + enum 값은 삭제하지 않고 deprecated 표기 → 기존 행동 로그/세이브 호환 | WUTW `wutw/run/run_vars.gd` (CC0) | 패턴 차용 |
| R4 | **분기 맵 생성 개선**(포아송 → 들로네 → A* 반복) — 단, 순수·결정론 유지 위해 라이브러리 대신 우리 RNG로 직접 구현 | stsmapgen `sketch.js` (MIT) + silverua `MapGenerator.cs`(MIT, 층별 노드 수 설정) | 포팅 시 MIT 고지 |
| R5 | **콘텐츠 퍼저 테스트**: `legal(S)`에서 무작위 행동을 골라 수천 판 `apply` → 예외·무한루프·음수 HP 탐지, `node --test`에 30초 예산 | end_of_eden `cmd/internal/fuzzy_tester/` (MIT) | 아이디어 차용 (코드 언어 다름) |
| R6 | (선택) 시드 RNG를 Xoshiro128++로 교체할지 검토 — **기존 리플레이 호환이 깨지므로** 버전 필드 추가 후에만 | WUTW `wutw/utils/random_state.gd` (CC0) | 그대로 포팅 가능 |
| R7 | (선택) 키워드 툴팁(카드 설명 속 "화상", "약화"에 자동 링크) | WUTW `wutw/glossary/marked_up_label.gd` (CC0) | 패턴 차용 |
| R8 | (온라인 대전·주간 시드 랭킹 시) 서버 검증은 이미 `verify.js` 구조 → BIT PARK 점수 서버 유지. 실시간 기능 필요해지면 Colyseus | Colyseus (MIT) | 라이브러리 의존 |

**학습만**: slaytheweb(AGPL) — 같은 웹 JS 구조지만 코드·카드 데이터 복사 금지, 폰트(mbtype 유료) 사용 금지. Slay the Spire 이름·카드명·아트 금지.
**에셋**: WUTW 아트는 CC0이라 *원칙적으로* 쓸 수 있으나 ROGUE LEGENDS는 오리지널 SVG 아트 방침(`logic.js` 머리말 "All heroes, cards, relics and enemies are original") → 쓰지 않는다. 오디오는 Kenney CC0 등 대장 기록 후에만.

## 2. SURVIVAL WORLD (서바이벌·크래프팅·기지)

| 영역 | 학습(클린룸) | 재사용 가능 |
|---|---|---|
| 아이템·레시피 데이터 | CDDA `doc/JSON/ITEM_CRAFT_AND_DISASSEMBLY.md`, `JSON_INHERITANCE.md`, `data/json/recipes/`, `data/json/requirements/` — **도구 품질 + 대체 재료 + 상속 + 공용 요구조건** 개념만 | OneLife(PD 코드) 크래프팅 전이표 개념 — 단 이름·그래픽·사운드 등 상표 주장 요소 금지 |
| 기지 자동화 | Mindustry `world/modules/*`, `GenericCrafter.java`, `Conveyor.java`, `PowerGraph.java` — 모듈 조합·역압·그래프 전력 | Kenney Starter-Kit-City-Builder (MIT, 모델 CC0) 그리드 배치 |
| 지형 | Veloren `world/src/sim/erosion.rs`, `world/src/layer/*`, `voxygen/src/mesh/greedy.rs` | Terasology (Apache-2.0, 아트 CC-BY-4.0); 우리 섬 지형은 기존 `apps/special-soldier/src/world/terrain.js`가 원천 |
| 날씨·생존 수치 | CDDA `doc/JSON/WEATHER_TYPE.md`, `src/weather.cpp` | — |
| 멀티 | Veloren 서버 청크(`server/src/chunk_generator.rs`), Luanti(LGPL — 학습만) | Colyseus(웹) / Mirror(Unity) / Nakama(계정·저장) |

데이터 스키마는 **우리가 새로 설계한 JSON**으로 시작하고 `docs/`에 스키마 문서를 둔다(CDDA 문서 수준을 목표로 하되 문장·필드명 복사 금지).

## 3. TACTICAL ARENA (턴제/실시간 전술 대전)

| 영역 | 학습 | 재사용 |
|---|---|---|
| 결정론 락스텝 | OpenRA `Network/OrderManager.cs`, `SyncReport.cs`, `ReplayConnection.cs`, `Server/OrderBuffer.cs` — 입력만 교환·틱 해시·명령 로그 리플레이 | WUTW `random_state.gd`(CC0) 시드 RNG, ROGUE LEGENDS의 행동 로그 = 리플레이 구조 재사용(자사 코드) |
| 선택·명령 UX | OpenRA `Selection.cs`, `ControlGroups.cs`, `UnitOrderGenerator.cs`, `Mobile.cs`·`Activities/Move/Move.cs`(Activity 큐) | — |
| 경로탐색 | OpenRA `Pathfinder/HierarchicalPathFinder.cs` | rot.js `src/path/astar.ts`·`dijkstra.ts` (BSD-3), Yuka NavMesh (MIT, 기존 카탈로그) |
| 턴제 흐름·비공개 정보 | AncientBeast (AGPL, 웹 헥스 전술) | **boardgame.io** `src/core/flow.ts`, `turn-order.ts`, `src/master/filter-player-view.ts` (MIT) |
| 그리드 전술 | — | ramaureirac/godot-tactical-rpg (MIT 코드) |
| 서버 | — | Colyseus 방 + `Rewind.ts`(실시간), boardgame.io 서버(턴제), Nakama 매치메이커·리더보드 |
| Unity판(선택) | — | Mirror(MIT), FishNet(커스텀 — 게임 사용 OK), NGO(UCL — Unity 안에서만) |

## 4. LIFE SIMULATION (생활·경영 시뮬)

| 영역 | 학습 | 재사용 |
|---|---|---|
| 생활·경제 시뮬 | Veloren `world/src/civ/econ.rs`, `rtsim/`(NPC 실시간 시뮬); Thrive(GPL, 진화); mars-sim(GPL, 콜로니); farmhand(GPL-2.0, 웹 농장) | Kenney City Builder (MIT/CC0) |
| 대화·이벤트 | — | dialogic (MIT, Godot) 구조, WUTW `wutw/events/`·`wutw/hub/hub_dialogue_player.gd` (CC0) |
| 데이터 테이블 | — | luban (MIT) 엑셀→데이터 파이프라인 아이디어 |
| 저장 | — | WUTW `save_game.gd` "세이브 = 단일 진실 원천" 패턴(CC0) |
| 주의 | Harvest-Moon-2.0(MIT지만 팬작) — 이름·스프라이트 상표 위험, 코드만 학습 | |

## 5. PUZZLE UNIVERSE (BIT PARK 퍼즐 네트워크)

**현재 상태**: BIT PARK 포털(`../bitpark-portal`, README v0.6)에 "GLOBAL PUZZLE UNIVERSE 12종(모노레포 하나)"과 퍼즐 저장소들의 `portal.json`(schema bitpark-game/1) 연동이 있다. ROGUE LEGENDS도 `verify.js`·`levels.js`를 BIT PARK 점수 서버로 복사하는 구조.

| 영역 | 학습 | 재사용 |
|---|---|---|
| 생성기 + 솔버(유일해·난이도) | antimine(GPL-3.0, 추측 없는 지뢰찾기), Hextris(GPL) | **hexapipes** `src/lib/puzzle/{generator,solver,worker}.js` + 테스트 (MIT) — 생성 후 솔버로 유일해 검증, 웹 워커 분리 |
| 매치-3 | — | daltonbr/Match3 `Assets/Scripts/{GameGrid,GamePiece,ClearLinePiece}.cs` (MIT), Kenney Match-3 (MIT/CC0, 기존 카탈로그) |
| 슬라이드·그리드 | — | 2048 (MIT), gokoban (BSD-2), tiny_crate (Unlicense) |
| 점수 검증 | — | ROGUE LEGENDS 방식(시드 + 행동 로그 재생 = 점수 증명)을 퍼즐에도 동일 적용(자사 코드) |
| 피해야 할 것 | liyupi/yulegeyu·daxigua(라이선스 없음 → 읽기만) | |

## 6. 공통 백엔드 선택

| 필요 | 1순위 | 대안 | 라이선스 |
|---|---|---|---|
| 웹 실시간 방 | Colyseus | geckos.io(WebRTC), netplayjs(P2P 롤백) | MIT / BSD-3 / ISC |
| 턴제 상태·비공개 정보 | boardgame.io | Colyseus 상태 | MIT |
| 계정·리더보드·세이브 | (현행 BIT PARK/Firebase 유지) | Nakama(자체 호스팅, Postgres) | Apache-2.0 |
| Steam 출시(Unity) | Steamworks.NET | — | MIT + Valve SDK 약관 |
| Steam 출시(Godot) | GodotSteam(Codeberg) | — | MIT + Valve SDK 약관 |
| Unity 넷코드 | Mirror | FishNet(조건부), NGO(UCL) | MIT / 커스텀 / UCL |

---

## 7. GPL 격리 정책 (필수)

**목적**: GPL·AGPL·CC-BY-SA·LGPL(조건 충족 불가 시) 코드와 데이터가 독점 저장소 `robot-platform`에 **한 줄도 들어오지 않게** 한다. 배운 것은 우리 글로 쓴 명세서를 거쳐서만 구현한다(클린룸).

### 7.1 대상
- 코드: GPL-2.0/3.0(Mindustry, Veloren, OpenRA, Thrive, NetHack, Angband의 GPL 선택지, Unvanquished, farmhand, antimine 등), AGPL-3.0(slaytheweb, BrogueCE, AncientBeast), LGPL(Luanti), MPL(Quaver — 파일 조건 못 지키면).
- 데이터·에셋: CC-BY-SA(CDDA 전체·Cataclysm-BN, Luanti 미디어, Unvanquished 미디어, WUTW의 일본어 사전 DB).
- 읽기만: EULA·라이선스 없음(Barotrauma, U3-SDK, ActionRoguelike, liyupi).

### 7.2 규칙
1. **저장소 분리**: GPL 계열 저장소를 `robot-platform` 안에 클론·서브모듈·벤더링하지 않는다. 열람은 브라우저 또는 저장소 **바깥** 임시 폴더(세션 스크래치패드 등)에서만 한다. `node_modules`/패키지 의존성으로도 들이지 않는다(웹 번들은 정적 링크와 같다).
2. **복사 금지 범위**: 코드, 주석, 함수·변수 이름의 체계적 모방, 파일·폴더 구조의 그대로 복제, 데이터 표(아이템 목록·수치·JSON 필드 세트), 셰이더, 문서 문장, 스크린샷.
3. **명세서 단계**: 학습한 사람이 `docs/` 아래 명세서(예: `docs/indie-studio/specs/<system>.md`)를 **우리 말로** 쓴다 — 무엇을(요구사항·입출력·불변식·엣지케이스) 적고, 원 코드 인용·라인 번호·의사코드 직역은 넣지 않는다. 명세 끝에 "참고한 공개 저장소(라이선스)"만 링크로 남긴다.
4. **구현 단계**: 가능하면 원 코드를 보지 않은 사람(또는 원 코드를 연 적 없는 새 세션)이 명세서만 보고 구현한다. 같은 사람이 해야 하면 원 저장소 탭·폴더를 닫은 상태에서 명세서만 보고 작성한다.
5. **AI 세션 규칙**: GPL 원문을 읽은 세션은 그 세션에서 해당 시스템의 구현 코드를 커밋하지 않는다. 명세서만 산출하고, 구현은 새 세션에 명세서 경로만 넘긴다.
6. **리뷰 체크**: PR 리뷰 때 (a) 새 파일에 GPL 저장소 고유 식별자·주석 문구가 없는지, (b) `THIRD_PARTY.md`에 GPL 항목이 없는지, (c) 데이터 파일이 원본 표와 같은 구조·수치가 아닌지 확인한다.
7. **허용 라이선스 병행 우선**: 같은 아이디어가 허용 라이선스 구현에 있으면 그쪽을 쓴다(예: 덱빌더 액션 큐 → slaytheweb(AGPL) 대신 Slay-The-Robot(MIT); 로그라이크 맵 → BrogueCE(AGPL) 대신 rot.js(BSD-3)).
8. **에셋**: CC-BY-SA·GPL 에셋은 받지도 않는다. `free-asset-pipeline` 라이선스 게이트에서 CC0 > CC-BY > (그 외 거부).
9. **혼합 저장소 주의**: 허용 라이선스 저장소라도 하위 폴더 제3자 파일을 확인한다 — 예: WUTW `addons/Wwise/`(상용), silverua `Assets/Demigiant/DOTween/`(Asset Store), Mirror `Examples/*/License.txt`, Steamworks.NET의 Valve 바이너리.
10. **기록**: 각 게임 `game.json`의 `learnedFrom`에 "학습한 저장소(라이선스, 클린룸)"를 적어 출처를 투명하게 남긴다(코드 반입이 아님을 명시).

### 7.3 위반 시
GPL 코드가 들어간 것을 발견하면 해당 커밋을 되돌리고, 그 파일을 명세서부터 다시 쓴다. 이미 배포된 빌드에 들어갔다면 배포를 내리고 사용자에게 보고한다(공개 의무가 생길 수 있으므로 법률 검토).
