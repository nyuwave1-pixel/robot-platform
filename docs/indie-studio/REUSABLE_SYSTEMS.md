# 재사용·학습 가능한 게임 시스템 (경로 검증판)

> 확인일: **2026-11-27**. 모든 경로는 각 저장소 기본 브랜치 HEAD를 트리 전용 클론(`git clone --depth 1 --filter=blob:none --no-checkout`) 후 `git ls-tree -r`로 **존재를 확인한 것만** 적었다. 확인하지 못한 것은 "미확인".
> 라이선스 근거: `OPEN_SOURCE_LICENSE_AUDIT.md`. 표기: **[재사용]** = 허용 라이선스, 고지 후 코드 복사·포팅 가능 / **[학습]** = GPL·AGPL·CC-BY-SA, 패턴만 배우고 클린룸 재구현(코드·주석·데이터 복사 금지).

---

## 1. Mindustry — 자동화·생산 체인 [학습, GPL-3.0]

| 시스템 | 확인한 경로 (`Anuken/Mindustry`) | 배울 패턴 |
|---|---|---|
| 콘텐츠 레지스트리 | `core/src/mindustry/content/Blocks.java`, `Items.java`, `Liquids.java`, `UnitTypes.java`, `TechTree.java`, `SerpuloTechTree.java` | 모든 블록·아이템을 시작 시 한 곳에서 등록하고 ID로 참조. 테크 트리는 콘텐츠 참조 그래프 |
| 블록 모듈(컴포넌트) | `core/src/mindustry/world/modules/{ItemModule,LiquidModule,PowerModule,BlockModule}.java` | 건물 = 공통 Building + 선택 모듈(아이템 버퍼·액체·전력). 상속 대신 조합 |
| 생산 | `world/blocks/production/GenericCrafter.java`, `Drill.java` | "입력 소비 → 진행도 누적 → 출력" 크래프터 하나로 대부분의 공장 표현. 입력은 `world/consumers/ConsumePower.java` 등 소비자 객체 목록 |
| 물류 | `world/blocks/distribution/{Conveyor,StackConveyor,Router,Sorter,Junction}.java` | 컨베이어는 아이템을 타일 단위가 아니라 **벨트 위 위치 배열**로 들고, 다음 건물의 `acceptItem` 질의로 넘긴다(역압) |
| 전력망 | `world/blocks/power/{PowerGraph,PowerNode}.java` | 연결된 노드를 **그래프 하나로 합쳐** 틱마다 총생산/총소비 비율 계산(개별 전선 시뮬 안 함) |
| 모드 데이터 | `core/src/mindustry/mod/ContentParser.java`, `Mods.java` | 코드 클래스의 필드를 JSON/HJSON으로 덮어쓰는 리플렉션 기반 파서 |
| AI·웨이브 | `core/src/mindustry/ai/{Pathfinder,ControlPathfinder,WaveSpawner,RtsAI}.java` | 흐름장(flow field) 경로탐색을 팀·지형 비용별로 캐시 |
| 넷코드 | `core/src/mindustry/net/{Net,ArcNetProvider,Packets,NetworkIO}.java`, 서버 `server/` | 서버 권위, 접속 시 월드 스냅샷 |

**우리 쪽 재구현 메모**: SURVIVAL WORLD 기지 자동화에 "Building + 모듈" + "그래프 단위 전력" + "역압 컨베이어" 3가지를 우리 명세서로 다시 쓴다.

## 2. Veloren — 복셀 지형·월드 생성 [학습, GPL-3.0] (GitHub = GitLab 미러)

| 시스템 | 확인한 경로 (`veloren/veloren`) | 배울 패턴 |
|---|---|---|
| 볼륨 자료구조 | `common/src/volumes/{chunk,dyna,vol_grid_2d,vol_grid_3d,vol_map,scaled}.rs` | 고정 크기 청크 + 2D 그리드(기둥) 맵. 청크를 `chonk`(층별 서브청크)로 압축 |
| 지형 블록 | `common/src/terrain/{block,chonk,biome,structure,map,site}.rs` | 블록 = 종류 + 소량 메타 비트. 구조물(나무·건물)은 미리 만든 볼륨을 배치 |
| 월드 시뮬 | `world/src/sim/{erosion,diffusion,map,way,location}.rs` | 고도 → **침식 시뮬**(강·계곡) → 기후 → 바이옴 순서. 실시간이 아니라 월드 생성 시 한 번 |
| 층(레이어) | `world/src/layer/{cave,rock,scatter,shrub,tree,wildlife,spot}.rs` | 기본 지형 위에 동굴·식생·스폿을 독립 패스로 덧칠 |
| 정착지 | `world/src/site/{generation,tile,namegen}.rs`, `world/src/civ/econ.rs` | 정착지·도로·경제를 월드 생성 단계에서 시뮬 |
| 메싱 | `voxygen/src/mesh/{greedy,terrain}.rs` | **그리디 메싱**으로 면 병합 → 드로우콜·정점 감소 |
| 서버 청크 | `server/src/{chunk_generator,chunk_serialize}.rs` | 청크 생성은 비동기 작업, 결과를 직렬화해 클라이언트로 |

**재사용 대안(허용 라이선스)**: Terasology(`MovingBlocks/Terasology`, Apache-2.0) 엔진 코드 — 복셀 청크·모듈 구조를 Java로 참고 가능(아트는 CC-BY-4.0). 세부 파일 경로는 이번에 확인하지 않음(미확인).

## 3. OpenRA — RTS 조작·락스텝 [학습, GPL-3.0]

| 시스템 | 확인한 경로 (`OpenRA/OpenRA`) | 배울 패턴 |
|---|---|---|
| 선택 | `OpenRA.Mods.Common/Traits/World/Selection.cs`, `Traits/Selectable.cs`, `Widgets/WorldInteractionControllerWidget.cs` | 드래그 박스·더블클릭 같은 타입 선택은 위젯에서, 선택 상태는 World 트레잇에 |
| 부대 지정 | `OpenRA.Mods.Common/Traits/World/ControlGroups.cs`, `Widgets/ControlGroupsWidget.cs` | Ctrl+숫자 저장 / 숫자 호출 / 두 번 누르면 카메라 이동 |
| 명령 생성기 | `OpenRA.Game/Orders/IOrderGenerator.cs`, `OpenRA.Mods.Common/Orders/{UnitOrderGenerator,UnitOrderTargeter,PlaceBuildingOrderGenerator,GuardOrderGenerator}.cs` | 마우스 모드 = OrderGenerator 교체(건설 배치·수리·경계 모드). 우클릭 대상별 커서·명령 결정 |
| 이동·공격 이동 | `OpenRA.Mods.Common/Traits/{Mobile,AttackMove}.cs`, `Activities/Move/Move.cs` | 유닛 행동 = **Activity 큐**(이동 → 공격 → 복귀), Shift로 큐 추가 |
| 경로탐색 | `OpenRA.Mods.Common/Pathfinder/{HierarchicalPathFinder,DensePathGraph,GridPathGraph,CellInfo}.cs` | 계층 경로탐색(구역 추상 그래프 → 세부 A*) |
| 락스텝 | `OpenRA.Game/Network/{OrderManager,Order,OrderIO,SyncReport,ReplayConnection}.cs`, `OpenRA.Game/Server/OrderBuffer.cs`, `OpenRA.Game/Sync.cs` | 입력(Order)만 교환, 틱마다 상태 해시 비교, 불일치 시 SyncReport로 덤프. 리플레이 = 명령 로그 재생 |
| 데이터 | `mods/{ra,cnc,d2k,ts}/` YAML 규칙 | 유닛 = 트레잇 목록 조합(YAML) |

**TACTICAL ARENA 적용**: "입력만 교환하는 결정론 시뮬 + 상태 해시 검증 + 명령 로그 리플레이"를 우리 명세로. 결정론 RNG는 아래 WUTW `random_state.gd`(CC0) 방식이 바로 쓸 만하다.

## 4. Cataclysm: DDA — 서바이벌·크래프팅 JSON 데이터 [학습, CC-BY-SA-3.0]

| 시스템 | 확인한 경로 (`CleverRaven/Cataclysm-DDA`) | 배울 패턴 |
|---|---|---|
| 스키마 문서 | `doc/JSON/JSON_INFO.md`, `ITEM.md`, `ITEM_CRAFT_AND_DISASSEMBLY.md`, `JSON_INHERITANCE.md`, `JSON_LOADING_ORDER.md`, `MONSTERS.md`, `WEATHER_TYPE.md`, `PROFICIENCY.md`, `BASECAMP.md` | 데이터 주도 게임의 **문서화 수준** — 우리 데이터 스키마 문서 템플릿으로 참고 |
| 레시피 | `data/json/recipes/`(197개, 예 `recipe_others.json`, `nested.json`) | 레시피 = 결과 + 기술/숙련 + 시간 + **도구(qualities)** + 재료(대체재 OR 묶음) |
| 공용 요구조건 | `data/json/requirements/`(15개, 예 `cooking_tools.json`, `cooking_components.json`) | 여러 레시피가 공유하는 도구·재료 묶음을 ID로 재사용 |
| 아이템 | `data/json/items/`(491개, 예 `items/comestibles/bread.json`) | `copy-from` 상속으로 변형 아이템 정의(`JSON_INHERITANCE.md`) |
| 엔진 측 | `src/{recipe,requirements,crafting,item_factory,activity_handlers,weather}.cpp/.h` | 로딩 순서·검증(정의되지 않은 ID 참조 시 시작 단계에서 에러) |
| 재사용 가능 예외 | `src/list.h`, `src/colony.h` (PLF, **zlib**) | 안정 포인터 컨테이너 — C++ 쓸 때만 의미 |

**클린룸 지침**: 필드 이름·값·아이템 목록을 옮기지 않는다. "도구 품질 + 대체 재료 + 상속" **개념**만 SURVIVAL WORLD 명세서에 우리 말로 적고 우리 스키마를 새로 설계한다.

## 5. Worlds Upon The Wind — 카드 데이터·로그라이트 런 구조 [재사용, CC0 — 작가분만]

| 시스템 | 확인한 경로 (`max99x/wutw-public`) | 패턴 / 재사용 |
|---|---|---|
| 카드 정의 | `wutw/cards/card_type.gd`(희귀도 enum BASIC~LEGENDARY + 주석으로 희귀도별 **효과 예산** 명시, 테마 태그 enum), `wutw/cards/card.gd`, `wutw/cards/cardset.gd`, 카드 리소스 `wutw/cards/tier0/card_*.tres` … `tier6/`(약 400개), 시작 덱 `cardset_starter.tres` | 카드 = 데이터 리소스 + 공용 동작. **희귀도마다 수치 상한을 문서로 박아두는 밸런스 규칙**이 핵심 |
| 런 상태 | `wutw/run/run.gd`(런 흐름), `run_data.gd`(저장되는 런 상태), `run_signals.gd`(시그널 버스), `run_vars.gd`(손패 수·리드로·보상 선택지 수·상점 가격% 등 **수정자 대상 변수 enum** + `modified` 시그널) | 유물·이벤트가 변수에 **수정자**를 걸고, 저장은 int enum이라 값 삭제 대신 `_DEPRECATED_` 표기 — 세이브 호환 규칙 |
| 결정론 RNG | `wutw/utils/random_state.gd`(Xoshiro128++, `snapshot()`, 레거시 RNG 호환) | **그대로 JS 포팅 가능**(CC0). 시드 런·리플레이·세이브스컴 방지 |
| 세이브 | `wutw/utils/save_game.gd`(README: 모든 시스템이 읽고 쓰는 "persistent source of truth") | 세이브 = 단일 진실 원천 |
| 카드 플레이 | `wutw/stage/stage.gd`, `card_reward_choice.gd`, `stage_goal.gd`, `stage_goal_tracker.gd`, `stage_satisfiability.gd` | 스테이지 목표 + **달성 가능성 검사**(불가능한 판 생성 방지) |
| 유물 | `wutw/relics/relic.gd` + 유물당 폴더(`relics/common/ancient_bark/relic_ancient_bark.gd`·`.tres`) | 유물 1개 = 리소스 1 + 스크립트 1 |
| 용어 툴팁 | `wutw/glossary/marked_up_label.gd` (README: 카드·유물이 Term 하위 클래스) | 카드 설명의 키워드에 자동 툴팁 링크 |
| 기타 | `wutw/events/`, `wutw/shops/shop_base.gd`, `wutw/tutorial/tutorial_base.gd`, `wutw/hub/hub.gd`, 콘텐츠 제작 도구 `wutw/_dev_tools/dev_card_creator.gd` | 이벤트·상점·튜토리얼·허브 분리, 에디터 내 카드 생성 도구 |
| **반입 금지** | `wutw/addons/Wwise/`(상용), `wutw/japanese/databases/`(CC-BY-SA), 폰트(OFL — 쓰려면 OFL 고지) | |

## 6. 덱빌더·로그라이크 레퍼런스

| 저장소 (라이선스) | 확인한 경로 | 배울 것 / 재사용 |
|---|---|---|
| **Slay-The-Robot** (MIT) [재사용] | `autoload/ActionHandler.gd`, `autoload/ActionGenerator.gd`, `scripts/actions/BaseAction.gd`, `BaseAsyncAction.gd`, `scripts/action_interceptors/ActionInterceptorProcessor.gd`, `BaseActionInterceptor.gd`, `InterceptorDamageIncrease.gd`, `scripts/run_modifiers/BaseRunModifier.gd`, `autoload/Random.gd`, `autoload/HandManager.gd`, `autoload/StatsHandler.gd` | **액션 큐 + 인터셉터** 구조: 카드·적·상점 모두 액션으로, 유물·상태이상은 실행 직전 액션을 수정. UI 미리보기도 같은 파이프라인. RNG 트랙 분리 |
| **deck_builder_tutorial** (MIT 코드) [재사용] | `custom_resources/{card,card_pile,effect,intent,relic,room,run_init_data,battle_stats}.gd`, `scenes/map/map_generator.gd`, `scenes/run/run.gd`, `scenes/player/player_handler.gd`, `global/events.gd` | 가장 읽기 쉬운 최소 구조. 오디오는 미확인이라 제외 |
| **stsmapgen** (MIT) [재사용] | `sketch.js` | 포아송 디스크 → 들로네 → A* 반복 경로로 StS식 분기 맵 |
| **silverua StS 맵** (MIT 스크립트) [재사용] | `Assets/Scripts/{MapGenerator,MapConfig,MapLayer,MapNode,NodeBlueprint,MapView,MapPlayerTracker}.cs` | 층별 노드 수(min/max)·노드 타입 가중치 설정 방식. DOTween 의존 부분은 제외 |
| **end_of_eden** (MIT) [재사용] | `game/{card,session,lua,saved_state}.go`, `game/card_test.go`, `cmd/internal/fuzzy_tester/{main,operations}.go`, `assets/scripts/`(Lua 콘텐츠) | **콘텐츠 퍼저**: 무작위 카드 사용·대상 지정을 수천 번 던져 크래시 탐지, CI에서 30초 |
| **UiCard** (MIT) [재사용, Unity판] | `Assets/Scripts/UICard/UiCardComponent/UiCardComponent.cs`, `UiCardStateMachine/States/{UiCardDraw,UiCardHover,UiCardDrag,UiCardDiscard}.cs` | 손패 카드 상태 머신(뽑기·호버·드래그·버리기) |
| **rot.js** (BSD-3) [재사용] | `src/rng.ts`, `src/fov/recursive-shadowcasting.ts`, `src/map/{digger,cellular,dungeon}.ts`, `src/path/{astar,dijkstra}.ts`, `src/scheduler/speed.ts` | 웹 로그라이크 기본기 일체 |
| **boardgame.io** (MIT) [재사용] | `src/core/{flow,turn-order,reducer,game}.ts`, `src/master/filter-player-view.ts` | 턴·페이즈 흐름과 **플레이어별 비공개 정보 필터링** |
| slaytheweb (AGPL) [학습] | `src/game/{actions,action-manager,cards,powers,dungeon}.js`, `src/content/cards.js`, `DOCUMENTATION.md` | 불변 상태 + 액션 함수(`state → newState`) + 액션 큐. **코드 복사 금지**, 같은 아이디어는 Slay-The-Robot(MIT)·우리 명세로 |

## 7. 백엔드 시스템 [재사용]

| 저장소 (라이선스) | 확인한 경로 | 용도 |
|---|---|---|
| Colyseus (MIT) | `packages/core/src/{Room,MatchMaker,Server,Transport,Rewind}.ts`, `PREDICTION.md` | 웹 JS 게임의 방 기반 서버 권위 + 예측·리와인드 |
| Nakama (Apache-2.0) | `server/{match_handler,matchmaker,leaderboard_cache,party_handler,runtime_javascript}.go` | 계정·리더보드·매치메이킹 통합 서버(Postgres/CockroachDB) |
| Godot 멀티플레이 (MIT) | `modules/multiplayer/{scene_multiplayer,multiplayer_spawner,multiplayer_synchronizer}.cpp`, 데모 `networking/multiplayer_bomber` | Godot 프로젝트 쓸 때 |
| Mirror (MIT) | `Assets/Mirror/Transports/{KCP,Telepathy,SimpleWeb}` | Unity판 |
| GodotSteam (MIT, Codeberg) | `godotsteam_multiplayer_peer.cpp`, `steam_packet_peer.cpp` | Steam P2P (Valve 약관 별도) |

## 8. 우선순위 Top 10 (허용 라이선스만)
1. **WUTW `random_state.gd` + `run_vars.gd` 패턴** (CC0) — 시드 RNG 포팅, 수정자 변수 레지스트리.
2. **WUTW `card_type.gd` 희귀도별 효과 예산** (CC0) — 카드 밸런스 규칙표.
3. **Slay-The-Robot 액션 + 인터셉터** (MIT) — ROGUE LEGENDS 전투 코어.
4. **stsmapgen** (MIT) — 분기 맵 생성 JS.
5. **end_of_eden 퍼저** (MIT) — 콘텐츠 자동 테스트.
6. **Colyseus** (MIT) — 웹 멀티(TACTICAL ARENA·BIT PARK).
7. **boardgame.io** (MIT) — 턴제 흐름·비공개 정보.
8. **rot.js** (BSD-3) — FOV·던전·경로·스케줄러.
9. **hexapipes `src/lib/puzzle/{generator,solver}.js`** (MIT) — 퍼즐 생성기 + 솔버(유일해 검증).
10. **Nakama** (Apache-2.0) — 계정·리더보드·세이브 서버(규모 커질 때).
