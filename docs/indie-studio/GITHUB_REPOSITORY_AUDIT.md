# GitHub 오픈소스 게임 저장소 감사 (Indie Studio)

> 확인일: **2026-11-27**. 대상: 소규모 **독점(비공개) 상용** 인디 스튜디오가 배우거나 재사용할 수 있는 GitHub 게임·백엔드 저장소.
> 기존 `docs/game-dev/genres/OPEN_SOURCE_CATALOG.md`(86개, 2026-11-26 확인)를 바탕으로, 여기서는 **구조·빌드·멀티플레이·에셋 라이선스까지 더 깊게** 보고 새 저장소를 더했다.
> 라이선스 판정 상세: `OPEN_SOURCE_LICENSE_AUDIT.md` · 재사용 시스템: `REUSABLE_SYSTEMS.md` · 프로젝트별 적용: `OPEN_SOURCE_INTEGRATION_PLAN.md`.

## 조사 방법
- 메타데이터: `gh api -X GET search/repositories -f q='repo:A/B repo:C/D …'` 일괄 조회(★·포크·언어·`license.spdx_id`·`pushed_at`·`archived`). 이 세션에서 `gh api repos/…`는 403.
- 구조·경로: `git clone --depth 1 --filter=blob:none --no-checkout`(파일 내용 없이 목록만 받는 클론) → `git ls-tree -r`로 **실제 존재하는 경로만** 적었다. LICENSE·README 등은 `git show HEAD:<path>`로 원문을 읽었다.
- spdx가 `NOASSERTION`/`null`이면 원문으로 판정했다. 원문을 보지 못한 것은 **"미확인"**.
- 판정: **재사용 가능(고지)** = MIT/BSD/Zlib/Apache/CC0/Unlicense/ISC/BSL · **Unity 한정(UCL)** · **학습만** = GPL/AGPL/CC-BY-SA · **조건부** = MPL/LGPL/EPL/커스텀 · **읽기만** = NC/라이선스 없음.
- 우리 상황: 독점 저장소 `robot-platform`. 웹 게임 = 순수 ES 모듈 JS(Three.js/Vite), Unity판 = C#.
- ★·포크·최근 push는 2026-11-27 조회값.

## 5. 감사 결과 한눈에

- 감사한 저장소: 필수 6 + 덱빌더·로그라이크 19 + 백엔드 16 + 서바이벌·퍼즐·기타 31 = **약 72개** (기존 카탈로그 86개와 겹치는 것: Mindustry, Veloren, OpenRA, CDDA, rot.js, BrogueCE, 2048 — 이번에 구조·경로까지 보강).
- **재사용 가능(고지)**: WUTW(CC0, 작가분만), Slay-The-Robot, deck_builder_tutorial(코드), stsmapgen, silverua 맵(스크립트만), end_of_eden, UiCard, rot.js, RogueSharp, Colyseus, Nakama, boardgame.io, geckos.io, netplayjs, Mirror, GodotSteam(Codeberg), Steamworks.NET(래퍼), Godot 멀티플레이·데모, Terasology(코드 Apache·아트 CC-BY), Kenney City Builder, hexapipes, Match3, OneLife(코드 PD).
- **Unity 한정(UCL)**: Netcode for GameObjects.
- **조건부**: FishNet(커스텀 — 게임 사용 OK, 넷코드 상품화 금지), Luanti(LGPL-2.1).
- **학습만**: Mindustry, Veloren, OpenRA(GPL-3.0) · CDDA·CDDA-BN(CC-BY-SA-3.0) · slaytheweb·BrogueCE·AncientBeast(AGPL-3.0) · Thrive·Unvanquished·NetHack·Angband·farmhand(GPL 계열).
- **읽기만**: Barotrauma(EULA), U3-SDK(라이선스 미확인), ActionRoguelike(라이선스 없음, UE 전용 에셋), liyupi 퍼즐(라이선스 없음).

## 1. 필수 감사 대상 (상세)

### 1.1 Anuken/Mindustry — 자동화 타워디펜스 RTS
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 29,988 / 3,888 / 2026-11-18 (보관 아님) |
| 언어 / 엔진 | Java (JDK 17 전용) / 자체 프레임워크 **Arc**(libGDX 계열) |
| 구조 | `core/`(게임 전부: `core/src/mindustry/{world,entities,ui,graphics,logic,type,maps,ai,io,editor,mod,game,net,content}`), `desktop/`, `server/`, `android/`, `ios/`, `annotations/`(코드 생성), `tools/`(스프라이트 패킹), `tests/` |
| 빌드/실행 | `./gradlew desktop:run` / `desktop:dist` / `tools:pack` / 서버 `server:dist` / 안드로이드 `android:assembleDebug` (README) |
| 의존성 | Arc, Gradle, JDK 17. `mindustry.gen` 패키지는 빌드 때 생성(README) |
| 서버/멀티 | 전용 서버 모듈 `server/` + 호스트 플레이. `core/src/mindustry/net/{Net,ArcNetProvider,Packets,NetworkIO,Administration}.java` — 서버 권위, 월드 스냅샷 전송 |
| 콘텐츠 정의 | 코드로 정의하는 데이터: `content/Blocks.java`, `Items.java`, `UnitTypes.java`, `TechTree.java` + 모드용 JSON/HJSON 파서 `mod/ContentParser.java` |
| 코드 라이선스 | **GPL-3.0** (spdx, `LICENSE`) |
| 에셋 | 스프라이트 `core/assets-raw/sprites/` 2,212개, 음악 `core/assets/music/*.ogg` 포함. **별도 에셋 라이선스 파일 없음** → 저장소 LICENSE 외 표기 미확인 |
| 판정 | **학습만** (코드·에셋 모두 복사 금지) |

### 1.2 veloren/veloren — 복셀 액션 RPG (★ GitLab 미러)
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 7,718 / 583 / 2026-11-26 |
| 정체 | **GitHub 저장소는 미러.** README 배지와 링크가 모두 `gitlab.com/veloren/veloren`(파이프라인·기여자), 루트에 `.gitlab-ci.yml`·`.gitlab/` 존재. 이슈·MR은 GitLab에서 받는다 |
| 언어 / 엔진 | Rust / 자체 엔진(렌더러 `voxygen/`, wgpu 계열 — 세부 미확인) |
| 구조 | Cargo 워크스페이스: `client/`, `common/`(ECS 컴포넌트·지형 볼륨), `network/`, `server/`, `server-cli/`, `voxygen/`(클라이언트·렌더), `world/`(월드 생성), `rtsim/`(실시간 NPC 시뮬), `plugin/`, `assets/`(10,660개) |
| 빌드/실행 | Rust nightly(`rust-toolchain`), `cargo run --bin veloren-voxygen` / 서버 `veloren-server-cli` (README의 링크된 Book 참조, 명령 원문은 미확인) |
| 서버/멀티 | **서버 권위** 클라이언트-서버. 자체 `network/src/{api,participant,scheduler,channel}.rs`, 서버 `server/src/{connection_handler,chunk_generator,chunk_serialize}.rs` |
| 코드 라이선스 | **GPL-3.0-or-later** (`LICENSE`, `Cargo.toml` `license = "GPL-3.0-or-later"`) |
| 에셋 | `assets/` 별도 라이선스 파일 없음 → 저장소 GPL로 배포되는 것으로 보이나 파일별 표기 미확인. 폰트는 개별 라이선스(`assets/voxygen/font/*-license.txt`, `OpenSans-Regular-LICENSE.txt`). README 배너 스니펫은 **CC-BY-SA-4.0** SPDX 표기 |
| 판정 | **학습만** |

### 1.3 OpenRA/OpenRA — 고전 RTS 재구현 엔진
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 17,842 / 3,126 / 2026-11-22 |
| 언어 / 엔진 | C# (.NET, `OpenRA.slnx`) / 자체 엔진 (SDL·OpenGL `OpenRA.Platforms.Default`) |
| 구조 | `OpenRA.Game/`(엔진 핵심: `World.cs`, `Sync.cs`, `Network/`, `Orders/`, `Server/`), `OpenRA.Mods.Common/`(트레잇·액티비티·UI 위젯), `OpenRA.Mods.Cnc/`·`OpenRA.Mods.D2k/`, `OpenRA.Server/`(전용 서버), `mods/{ra,cnc,d2k,ts,common}/`(YAML 규칙) |
| 빌드/실행 | `make` / Windows `make.cmd`·`make.ps1`, 실행 `launch-game.sh`, 서버 `launch-dedicated.sh` (`INSTALL.md`) |
| 서버/멀티 | **결정론적 락스텝**: `Network/OrderManager.cs`(틱별 명령 교환), `Network/SyncReport.cs`(동기 해시 불일치 진단), `Network/ReplayConnection.cs`(리플레이), `Server/OrderBuffer.cs` |
| 코드 라이선스 | **GPL-3.0-or-later** (`COPYING`, README "License") |
| 에셋 | 원작 EA 게임 데이터는 **저장소에 없음** — 설치 시 사용자가 받음(`mods/*-content`가 콘텐츠 설치 정의). README: "EA has not endorsed" |
| 판정 | **학습만** |

### 1.4 CleverRaven/Cataclysm-DDA — 서바이벌 로그라이크
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 13,582 / 4,748 / 2026-11-26 |
| 언어 / 엔진 | C++ / 자체(curses·SDL 타일) |
| 구조 | `src/`(엔진·규칙: `crafting.cpp`, `recipe.cpp`, `requirements.cpp`, `item_factory.cpp`, `activity_handlers.cpp`, `weather.cpp`), `data/json/`(거의 모든 콘텐츠: `items/` 491개, `recipes/` 197개, `requirements/` 15개, `monsters/` 73개 + `professions.json`, `scenarios.json`, `materials.json` …), `doc/JSON/`(스키마 문서 `JSON_INFO.md`, `ITEM.md`, `ITEM_CRAFT_AND_DISASSEMBLY.md`, `MONSTERS.md`, `WEATHER_TYPE.md` 등), `gfx/`(타일셋), `data/mods/` |
| 빌드/실행 | `Makefile` / `CMakeLists.txt`+`CMakePresets.json`, MSVC 솔루션 `msvc-full-features/` |
| 서버/멀티 | **싱글 플레이 전용** (멀티 없음) |
| 코드 라이선스 | spdx NOASSERTION → 원문 `LICENSE.txt` 첫 줄: "Cataclysm is licensed under the **Creative Commons Attribution-ShareAlike 3.0** Unported License" — **코드와 데이터 전체가 CC-BY-SA-3.0** |
| 서드파티 | GNU Unifont(OFL-1.1 + GPL-2.0+ 폰트 예외), Terminus(OFL), Roboto(Apache-2.0), Catch(BSL), PLF list/colony(`src/list.h`,`src/colony.h`: **zlib**), fmt(MIT) — `LICENSE.txt`에 나열 |
| 에셋 | 타일셋·사운드는 CC-BY-SA-3.0(저장소 기준). 타일셋별 크레딧 파일은 일부(`data/credits/en.credits`) |
| 판정 | **학습만** (ShareAlike). 단 `src/list.h`, `src/colony.h`(PLF, zlib)는 파일 단위로 재사용 가능 |

### 1.5 max99x/wutw-public — Worlds Upon The Wind (Godot 덱빌더, "퍼블릭 도메인")
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 261 / 28 / 2026-11-24 |
| 정체 | Steam 상용 출시작(평가 99% 긍정, README)의 **퍼블릭 도메인 공개판**. "read-only mirror" — Steam 릴리스와 함께 갱신 |
| 언어 / 엔진 | GDScript + C++ GDExtension(`wutw-gdext/`, 맵 생성·스프라이트) / **Godot 4.7** |
| 구조 | `wutw/`(Godot 프로젝트): `cards/`(카드 = "Glyph", tier0~6 `.tres` 리소스 약 400개 + `card.gd`, `cardset.gd`), `relics/`(유물당 `.tres`+`.gd`), `run/`(`run.gd`, `run_data.gd`, `run_signals.gd`, `run_vars.gd`), `stage/`(`stage.gd` 핵심 카드 플레이, `card_reward_choice.gd`, `stage_goal*.gd`), `events/`, `quests/`, `hub/`, `utils/`(`save_game.gd`, `random_state.gd`), `_dev_tools/`; `art_src/`(PSD·SVG 원본); 루트에 Steam 빌드·업로드 스크립트 |
| 빌드/실행 | Godot 4.7로 `wutw/project.godot` 임포트 → F5 (README). GDExtension은 `wutw-gdext/SConstruct`, 바이너리는 `wutw/bin`에 동봉 |
| 서버/멀티 | 싱글. 버그 리포터가 HTTP POST로 로그 전송(README) |
| 코드 라이선스 | spdx **CC0-1.0**. `LICENSE.md` = CC0 1.0 Universal 전문 (확인). README: "Except for the third-party libraries and data … and the excluded audio, the entire game is released into the public domain … reuse any art or code, including within commercial projects, without attribution" |
| 아트 | **PD(CC0)** — 작가가 명시. 아트 자체가 퍼블릭 도메인 우키요에·에마키 기반 + 원본 PSD 포함 |
| 오디오 | **음악·효과음은 저장소에서 제외**(제3자 라이선스). 컷신 보이스 mp3(`wutw/cutscenes/*/voice/*.mp3`, 저장소 내 음성파일 36개)는 포함 — README 문구상 PD 범위에 들어가는 것으로 읽히나 **성우 권리 별도 확인 = 미확인** |
| 제3자(PD 아님) | Godot(MIT), GodotSteam(MIT), godot_resource_groups(MIT), godot-console(MIT), 폰트 Yuji Mai·Merienda·Noto(**OFL**), KANJIDIC2·JMdict·JMdict-simplified(**CC-BY-SA-4.0**, `wutw/japanese/databases/*.json`), tatoeba(CC-BY 2.0 FR), KanjiVG(CC-BY-SA-3.0) |
| ⚠ 숨은 제3자 | **`wutw/addons/Wwise/` — Audiokinetic Wwise SDK 네이티브 바이너리(`native/lib/...`, 249개 파일; iZotope·McDSP·Auro 등 상용 DSP 플러그인 `.so` 포함)가 저장소에 들어 있는데 README의 제3자 목록에 없다.** CC0 선언은 작가 본인 저작물에만 효력 → Wwise는 **상용 라이선스(PD 아님)**, 절대 가져오지 않는다 |
| 판정 | **재사용 가능(고지 불필요, CC0)** — 단 *작가 저작 코드·아트만*. `addons/Wwise`, `japanese/databases`, 폰트, 서드파티 애드온은 각자 라이선스 |

### 1.6 smshahbaj/awesome-open-source-games — 목록
| 항목 | 내용 |
|---|---|
| ★ / 포크 / 최근 push | 62 / 7 / 2026-11-01 (언어 표시는 Python: 검증 스크립트 `scripts/validate_catalogue.py`) |
| 구조 | `README.md`(장르별 목록), `data/catalogue.json`(schema v1, 게임 276·재구현 49·엔진 22·툴 15; 항목 = name/url/description, **라이선스 칸 없음**), `docs/`, `ATTRIBUTIONS.md` |
| 라이선스 | spdx NOASSERTION → 원문 `LICENSE` = **CC0 1.0**. README: CC0은 "original editorial content"에만 적용, 나열 프로젝트를 재라이선스하지 않음 |
| 판정 | 목록 자유 이용. **항목마다 라이선스 재확인 필요**(목록에 정보 없음). 작은 신생 목록(★62)이라 bobeff/open-source-games 보조용 |

## 2. 덱빌더·로그라이크 (ROGUE LEGENDS 직접 관련)

> `topic:deckbuilder`는 ★150 이상이 1개뿐이라(BigJk/end_of_eden), 키워드 검색 `deckbuilder OR deck-builder OR "slay the spire"`를 함께 썼다. 상위 결과 다수는 **Slay the Spire 2 모드/툴**(STS2MCP, BaseLib-StS2, ModTheSpire 등)이라 게임 구조 학습용에서 제외했다(남의 게임 모딩 도구).

### 2.1 DesirePathGames/Slay-The-Robot — Godot 4 덱빌더 프레임워크
| 항목 | 내용 |
|---|---|
| ★ / 포크 / push | 297 / 60 / 2026-11-26 |
| 엔진 | Godot 4.6, GDScript |
| 구조 | `autoload/`(`ActionHandler.gd`, `ActionGenerator.gd`, `HandManager.gd`, `Random.gd`, `StatsHandler.gd`, `Signals.gd`, `FileLoader.gd`, `Global.gd`), `scripts/actions/`(액션 182개 파일, 기반 `BaseAction.gd`/`BaseAsyncAction.gd`), `scripts/action_interceptors/`(`ActionInterceptorProcessor.gd`, `BaseActionInterceptor.gd`, `InterceptorDamageIncrease.gd` …), `scripts/validators/`, `scripts/card_decorators/`, `scripts/run_modifiers/`(`BaseRunModifier.gd`, 난이도·엔드리스), `scripts/status_effects/`, `scripts/artifacts/` |
| 설계(README) | 카드 = JSON 페이로드 + 재사용 액션 스크립트, **인터셉터**가 실행 직전 액션을 수정, UI 미리보기(적 의도·카드 설명)도 같은 파이프라인 → "표시 숫자 = 실제 숫자", 결정론적 RNG "트랙"(셔플·이벤트·데미지 분리), 3막 구조 + 승천, `SerializableData` JSON 세이브, 모드 로딩(`mod_info.json`) |
| 코드 라이선스 | **MIT** (`LICENSE`, © 2025 DesirePathGames). 애드온 3개(`addons/sound_manager` © Nathan Hoad, `label_font_auto_sizer`, `smooth_scroll_container`) 각각 MIT LICENSE 동봉 확인 |
| 에셋 | 자리표시자 수준(`sprites/missing_texture.png`, `sounds/missing_audio.wav`, `sprites/intents/`). 별도 에셋 라이선스 표기 없음 → 저장소 MIT로 간주되나 **미확인** |
| 판정 | **재사용 가능(고지)** — GDScript → JS 포팅 시 MIT 고지 유지 |

### 2.2 guladam/deck_builder_tutorial — Godot 4 덱빌더 튜토리얼
| 항목 | 내용 |
|---|---|
| ★ / 포크 / push | 459 / 89 / 2024-10-16 |
| 구조 | `custom_resources/`(`card.gd`, `card_pile.gd`, `effect.gd`, `intent.gd`, `relic.gd`, `room.gd`, `run_init_data.gd`, `battle_stats.gd`), `characters/warrior/cards/*.gd`(카드당 스크립트), `scenes/map/map_generator.gd`, `scenes/run/run.gd`, `scenes/player/player_handler.gd`, `global/events.gd`(시그널 버스) |
| 코드 라이선스 | **MIT** (© 2023 Adam Gulacsi) |
| 에셋(README Credits) | 그림: Kenney Tiny Dungeon(Kenney = CC0) · 효과음: OpenGameArt StarNinjas / artisticdude, Pixabay — **개별 라이선스 미확인** · 음악: Tad(`art/8_bit_iced_village_lofi.mp3` 등) — **라이선스 미확인** |
| 판정 | 코드 **재사용 가능(고지)**. 오디오는 **쓰지 않음**(미확인) |

### 2.3 oskarrough/slaytheweb — 웹 JS 덱빌더 (우리 스택과 가장 가까움)
| 항목 | 내용 |
|---|---|
| ★ / 포크 / push | 323 / 65 / 2026-11-23 |
| 스택 | JavaScript ES 모듈 + Astro(`astro.config.mjs`), bun, Cloudflare(`wrangler.jsonc`) |
| 구조 | `src/game/`(`actions.js`, `action-manager.js`, `cards.js`, `conditions.js`, `dungeon.js`, `monster.js`, `powers.js`, `new-game.js`, `utils-state.js`, `backend.js`), `src/content/`(`cards.js`, `decks.js`, `dungeons.js`, `monster-rooms.js`), `src/ui/`(`dragdrop.js`, `animations.js`, `save-load.js`, `sounds.js`) |
| 코드 라이선스 | **AGPL-3.0** (`LICENSE` 전문 확인) |
| 에셋 | README: 폰트는 **mbtype.com에서 유료 라이선스("Licenced from https://mbtype.com/")** → 재배포 불가 상용 폰트. 그 밖에 game-icons.net·RPGUI·fromoldbooks 등 출처 나열(각자 라이선스) |
| 판정 | **학습만** (AGPL — 웹 서비스로만 제공해도 소스 공개 의무). 구조 문서 `DOCUMENTATION.md`는 읽기 좋음 |

### 2.4 max99x/wutw-public — (1.5절 참고) 상용 출시 덱빌더, CC0

### 2.5 silverua/slay-the-spire-map-in-unity — StS식 맵 생성(Unity)
| 항목 | 내용 |
|---|---|
| ★ / 포크 / push | 428 / 95 / 2026-11-15 |
| 구조 | `Assets/Scripts/`(`MapGenerator.cs`, `MapConfig.cs`, `MapLayer.cs`, `MapNode.cs`, `Node.cs`, `NodeBlueprint.cs`, `MapView.cs`, `MapViewUI.cs`, `MapPlayerTracker.cs`, `ShufflingExtension.cs`, `UI Lines/UILineRenderer.cs`) |
| 코드 라이선스 | **MIT** (© 2020 Vladimir Limarchenko) — 작가 스크립트 |
| ⚠ 동봉 제3자 | `Assets/Demigiant/DOTween/`(Asset Store 배포물, Demigiant 라이선스), `Assets/OneLine/`, Newtonsoft.JSON(Asset Store), 아이콘 game-icons.net(**CC-BY-3.0**, README "full list of credits in the folder") — **MIT 아님** |
| 판정 | `Assets/Scripts/`만 **재사용 가능(고지)**. DOTween·아이콘은 가져오지 않음 |

### 2.6 yurkth/stsmapgen — StS식 맵 생성(웹 p5.js)
| 항목 | 내용 |
|---|---|
| ★ / push | 268 / 2021-10-20 (파일 6개: `index.html`, `sketch.js`, `style.css` …) |
| 알고리즘(README) | 포아송 디스크 샘플링 → 들로네 삼각분할 → A* 경로 → 경로 위 점 제거 반복 |
| 라이선스 | **MIT** + README: "I do not authorize the use of anything generated by this project for the selling of NFTs"(법적 구속력은 불분명, 존중) · CDN 라이브러리: poisson-disk-sampling(MIT), Delaunator(ISC), ngraph.path(MIT), ngraph.graph(BSD-3) |
| 판정 | **재사용 가능(고지)** — NFT 용도 금지 문구 준수 |

### 2.7 BigJk/end_of_eden — 터미널 덱빌더(Go + Lua)
| 항목 | 내용 |
|---|---|
| ★ / push | 206 / 2024-09-02 |
| 구조 | `game/`(`card.go`, `session.go`, `lua.go`, `artifact.go`, `enemy.go`, `event.go`, `saved_state.go`, 테스트 `card_test.go`·`session_test.go`), `assets/scripts/`(Lua로 카드·유물·적 정의, 60개), `cmd/internal/fuzzy_tester/`(무작위 조작 퍼저 — CI에서 30초 실행, README) |
| 코드 라이선스 | **MIT** |
| 에셋 | `assets/audio/README.md`: 효과음 일부 **CC0** 명시. README Credits: Bleeoop 인터페이스 비프, Juhani Junkala 512 SFX(OpenGameArt), 음악 synthroton(**라이선스 미확인**). 폰트 Nerd Font 계열(OFL로 알려짐, 원문 미확인) |
| 판정 | 코드 **재사용 가능(고지)**. 퍼저 아이디어는 ROGUE LEGENDS 테스트에 바로 적용 가능 |

### 2.8 ycarowr/UiCard — Unity 카드 손패 UI
| 항목 | 내용 |
|---|---|
| ★ / push | 577 / 2025-07-26 |
| 구조 | `Assets/Scripts/UICard/UiCardComponent/`(`UiCardComponent.cs`, 상태 머신 `UiCardStateMachine/States/UiCardDraw.cs`·`UiCardHover.cs`·`UiCardDrag.cs`·`UiCardDiscard.cs`), `Assets/Scripts/Patterns/`(GenericPooler, Observer, Command) |
| 라이선스 | **MIT**. `Assets/TextMesh Pro/`는 Unity 패키지 리소스(UCL 계열, 미확인) |
| 판정 | 스크립트 **재사용 가능(고지)** — Unity판 카드 UI |

### 2.9 로그라이크 툴킷·대표작 (메타데이터 + 원문 판정)
| 저장소 | ★ | 언어 | 코드 라이선스 | 판정 | 메모 |
|---|---|---|---|---|---|
| ondras/rot.js | 2,734 | TS/JS | BSD-3-Clause | 재사용 가능(고지) | `src/rng.ts`, `src/fov/recursive-shadowcasting.ts`, `src/map/digger.ts`·`cellular.ts`, `src/path/astar.ts`·`dijkstra.ts`, `src/scheduler/speed.ts` 존재 확인 |
| FaronBracy/RogueSharp | 637 | C# | MIT | 재사용 가능(고지) | Unity판 로그라이크 맵·FOV |
| amethyst/bracket-lib | 1,696 | Rust | MIT | 재사용 가능(고지) | Rust 로그라이크 튜토리얼 동반 |
| Thraka/SadConsole | 1,388 | C# | MIT | 재사용 가능(고지) | 콘솔 렌더러 |
| AsPJT/DungeonTemplateLibrary | 1,467 | C++ | BSL-1.0 | 재사용 가능(고지) | 던전 생성 헤더 |
| Hexworks/zircon | 796 | Kotlin | Apache-2.0 | 재사용 가능(고지) | 타일 그리드 UI |
| egordorichev/BurningKnight | 343 | C# | MIT(spdx) | 코드 재사용 가능 / 에셋 **미확인** | 액션 로그라이트 |
| tmewett/BrogueCE | 1,539 | C | AGPL-3.0 | 학습만 | 맵 생성 |
| NetHack/NetHack | 4,005 | C | spdx null → `dat/license` = **NetHack GPL**(카피레프트) | 학습만 | |
| angband/angband | 1,591 | C | spdx null → `docs/copying.rst` = GPL-2.0 **또는** "Angband licence"(비영리 한정) | 학습만 | 상용엔 GPL만 남음 |
| cataclysmbn/Cataclysm-BN | 1,318 | C++ | `LICENSE.txt` = CC-BY-SA-3.0 (+ 문서 AGPL-3.0, Magical Nights 모드 CC-BY-SA-4.0) | 학습만 | DDA 포크 |
| tomlooman/ActionRoguelike | 4,674 | C++/UE5 | spdx null, LICENSE 없음. README: 게임 에셋(Paragon)은 "Unreal Engine 전용" | 읽기만 | UE 강좌 샘플 |
| Larkenx/Rotten-Soup | 408 | JS | GPL-3.0 | 학습만 | 웹 로그라이크 |

## 3. 멀티플레이·플랫폼 백엔드

| 저장소 | ★ / 포크 / push | 언어 | 아키텍처 | 코드 라이선스 (원문) | 판정 | 확인한 경로 / 메모 |
|---|---|---|---|---|---|---|
| heroiclabs/nakama | 13,784 / 1,542 / 2026-11-26 | Go | 자체 호스팅 게임 서버: 계정·친구·채팅·리더보드·**서버 권위 매치**·매치메이커·파티. DB = **CockroachDB 또는 Postgres 호환**(README). 서버 런타임 모듈 Go/Lua/**JavaScript(TS)** | **Apache-2.0** | 재사용 가능(고지·NOTICE) | `server/match_handler.go`, `server/matchmaker.go`, `server/leaderboard_cache.go`, `server/party_handler.go`, `server/runtime_javascript.go`, `server/runtime_go.go`; Docker `docker-compose.yml`. 클라이언트 `heroiclabs/nakama-godot`(★789, Apache-2.0) |
| colyseus/colyseus | 7,586 / 689 / 2026-11-25 | TypeScript | Node.js **방(Room) 기반 서버 권위** + 상태 동기화(스키마 델타), 매치메이커, 0.18부터 **클라이언트 예측·리와인드**(`PREDICTION.md`) | **MIT** (README "Free forever → MIT licensed, even for commercial games") | 재사용 가능(고지) | `packages/core/src/{Room,MatchMaker,Server,Transport,Rewind}.ts`. SDK: JS·Unity·Godot·GameMaker·Defold·Haxe(README 표). **웹 JS 게임 1순위** |
| boardgameio/boardgame.io | 12,500 / 840 / 2026-10-30 | TypeScript | **턴제** 게임 상태 엔진(리듀서) + 서버/마스터 + 플레이어별 비공개 뷰 | **MIT** | 재사용 가능(고지) | `src/core/{flow,turn-order,reducer,game}.ts`, `src/master/{master,filter-player-view}.ts`, `src/server/`. TACTICAL ARENA/카드 대전에 적합 |
| geckosio/geckos.io | 1,489 / 90 / 2026-03-27 | TypeScript | WebRTC 데이터채널(UDP 유사) 클라-서버 | **BSD-3-Clause** | 재사용 가능(고지) | 실시간 웹 액션용 전송층 |
| rameshvarun/netplayjs | 578 / 46 / 2024-10-10 | TypeScript | 브라우저 P2P **롤백 넷코드** | **ISC** | 재사용 가능(고지) | 소형 웹 대전 |
| MirrorNetworking/Mirror | 6,408 / 876 / 2026-11-18 | C#/Unity | 고수준 Unity 넷코드(UNet 후속), 서버 권위·호스트 | **MIT** (`LICENSE` "Copyright (c) 2015, Unity Technologies" — UNet HLAPI에서 유래) | 재사용 가능(고지) | 트랜스포트 `Assets/Mirror/Transports/{KCP,Telepathy,SimpleWeb,Edgegap,Encryption,Latency,Multiplex,Middleware,Threaded}`. 예제 에셋 일부 별도 라이선스(`Examples/_Common/KenneyAssets/*/License.txt`, `Examples/Billiards/Table/License.txt`) |
| MirageNet/Mirage | 572 / 67 / 2026-11-24 | C#/Unity | Mirror 포크 | MIT | 재사용 가능(고지) | |
| FirstGearGames/FishNet | 2,094 / 243 / 2026-10-18 | C#/Unity | 서버 권위 + 클라 예측(CSP) 넷코드 | spdx NOASSERTION → 원문 `LICENSE.md` = **커스텀 FishNet 라이선스**: "reproduce, modify, and use the Software for developed game"는 무료·로열티 없음, 단 **경쟁 네트워킹 제품에 사용·리버스엔지니어링 금지**(2.b), 플로리다 법 관할. Pro판은 구매자 조직 20인 이하 배포 | **조건부(게임 사용 OK)** | `Assets/FishNet/Runtime/{Managing,Object,Transporting,Serializing,Observing,…}`, `THIRD PARTY NOTICE.md` 별도 |
| Unity-Technologies/com.unity.netcode.gameobjects (NGO) | 2,333 / 465 / 2026-11-26 | C#/Unity | Unity 공식 GameObject 넷코드, NetworkVariable·RPC·스폰 | spdx NOASSERTION → 원문 `LICENSE.md` = **Unity Companion License** | **Unity 한정(UCL)** | `com.unity.netcode.gameobjects/Runtime/{NetworkVariable,Messaging,Spawning,SceneManagement,Transports,…}` |
| BeardedManStudios/ForgeNetworkingRemastered | 1,479 / 300 / 2022-08-15 (**보관됨**) | C#/Unity | — | Apache-2.0 | 재사용 가능이나 **유지보수 중단** | 신규 채택 비추천 |
| rlabrecque/Steamworks.NET | 3,661 / 453 / 2026-10-29 | C# | Valve Steamworks C API 래퍼(Unity/.NET), SDK 1.65 기준(README) | **MIT**(래퍼) | 재사용 가능(고지) — 단 **동봉된 Valve 파일은 별개** | `CodeGen/steam/steam_api*.h`(Valve 헤더), `com.rlabrecque.steamworks.net/Plugins/**/libsteam_api.so` 등 **Valve 재배포 바이너리** → Steamworks SDK 약관 적용(Steam 파트너 계약) |
| GodotSteam/GodotSteam (GitHub) | 3,773 / 225 / 2026-11-08 (**보관됨**, spdx null) | C++ GDExtension | Godot용 Steamworks 바인딩 + `godotsteam_multiplayer_peer` | GitHub판은 파일 조회 불가(404). **현재 본거지 Codeberg `godotsteam/godotsteam`**(★171, 기본 브랜치 `godot4`): `license.md` = **MIT** (© GP Garcia, Chris Ridenour) | 재사용 가능(고지) — Steam SDK 약관 별도 | Codeberg 루트에 `godotsteam.cpp`, `godotsteam_multiplayer_peer.cpp`, `steam_packet_peer.cpp`, `sdk/` 확인. WUTW README도 Codeberg 링크 |
| Godot 내장 멀티플레이 (godotengine/godot) | 121k | C++ | `SceneMultiplayer`: RPC + `MultiplayerSpawner`/`MultiplayerSynchronizer` 노드 복제, 전송 ENet/WebRTC/WebSocket | **MIT** | 재사용 가능(고지) | `modules/multiplayer/{scene_multiplayer,multiplayer_spawner,multiplayer_synchronizer,scene_replication_interface,scene_rpc_interface}.cpp`, `modules/{enet,webrtc,websocket}/` |
| godotengine/godot-demo-projects | 9,841 / 2,312 / 2026-11-25 | GDScript | 공식 데모 | **MIT** (`LICENSE.md`) | 재사용 가능(고지) | `networking/{multiplayer_bomber,multiplayer_pong,webrtc_minimal,webrtc_signaling,websocket_chat,websocket_minimal,websocket_multiplayer}` |
| Unity Netcode for Entities / Multiplayer Services | — | C#/Unity | DOTS 넷코드, UGS 세션·릴레이 | GitHub 독립 저장소 없음(패키지 배포) → **미확인**(UCL 계열로 알려짐) | Unity 한정 | 샘플은 Megacity Metro(UCL, 기존 카탈로그) |
| 0xFA11/MultiplayerNetworkingResources | 8,800 / 552 | 목록 | 넷코드 논문·글 모음 | spdx null(라이선스 없음) | 읽기만(링크 열람) | 학습 자료 |

> 백엔드 판정 요약: **Colyseus(MIT)·Nakama(Apache)·boardgame.io(MIT)**는 독점 게임 서버에 그대로 써도 된다(고지). FishNet은 "게임에 쓰는 것"은 허용, 넷코드 상품화 금지. NGO는 Unity판만. Steam 관련은 래퍼 MIT + **Valve SDK 약관**이 이중 적용.

## 4. 서바이벌·샌드박스·콜로니·농장·퍼즐·기타

| 저장소 | ★ / push | 언어·엔진 | 코드 라이선스 (원문) | 에셋 라이선스 | 판정 | 메모 / 확인 경로 |
|---|---|---|---|---|---|---|
| luanti-org/luanti (구 Minetest) | 13,898 / 2026-11-26 | C++ + Lua 모드, IrrlichtMt | spdx NOASSERTION → `LICENSE.txt`: 소스 **LGPL-2.1+**, Irrlicht 포크는 zlib 계열 | 텍스처·사운드 **CC-BY-SA-3.0**(일부 CC-BY-SA-4.0, Apache-2.0, CC-BY-4.0 Twemoji) | 조건부(LGPL) → 실무상 **학습만**, 에셋 학습만 | 복셀 샌드박스·클라-서버 구조, `games/`·`mods/`·`builtin/` Lua API |
| MovingBlocks/Terasology | 3,912 / 2026-11-18 | Java | **Apache-2.0** (`LICENSE`, `NOTICE`) | `LICENSE_ARTWORK` = **CC-BY-4.0** | **재사용 가능(고지)** (아트는 출처 표기) | 복셀 엔진 + 모듈 시스템(`engine/`, `modules/`, `subsystems/`) |
| Revolutionary-Games/Thrive | 3,898 / 2026-11-26 | C#/Godot | spdx NOASSERTION → `LICENSE.txt` = **GPL-3.0+** | 미확인 | 학습만 | 진화 시뮬 (LIFE SIMULATION 참고) |
| Unvanquished/Unvanquished | 1,131 / 2026-11-25 | C++ (Daemon 엔진) | `COPYING.txt`: 코드 **GPL**(예외 파일 있음) | 미디어 **CC-BY-SA-2.5** | 학습만 | 멀티 FPS/RTS 하이브리드 |
| jasonrohrer/OneLife | 1,138 / 2026-11-26 | C++ | spdx NOASSERTION → `no_copyright.txt`: "**I place it into the public domain**" | 같은 문서에서 **상표·인격권 유보**: 이름·로고·"specific graphical, auditory, and character elements"를 자기 멀티 서비스 상표로 주장 | 코드 **재사용 가능(PD)**, 에셋은 **사용 피함** | 서바이벌 + 세대 계승 MMO, 크래프팅 전이표(transition) 데이터 |
| tomlooman/EpicSurvivalGame | 3,403 / 2026-02-12 | C++/UE | **MIT**(spdx) | UE 마켓 에셋 여부 미확인 | 코드 재사용 가능(UE 전용 의미) / 에셋 미확인 | UE4 서바이벌 강좌 샘플 |
| SmartlyDressedGames/U3-SDK | 4,064 / 2026-11-06 | C#/Unity 2022.3 | spdx NOASSERTION, 루트 LICENSE 없음(404), README에 라이선스 문구 없음 → **미확인** | 대용량 바이너리·모드는 설치된 Unturned에서 로드(README) | **읽기만** | Unturned 소스 공개 |
| FakeFishGames/Barotrauma | 2,304 / 2026-11-26 | C# | spdx null → README: "read the **EULA**"(`EULA.txt`) — 소스 공개형, OSS 아님 | 게임 에셋 독점 | **읽기만** | 잠수함 협동 서바이벌, 멀티 |
| pshenok/server-survival | 6,521 / 2026-11-21 | JavaScript | MIT | 미확인 | 재사용 가능(코드) | 웹 JS — 내용은 별도 확인 필요 |
| PieKing1215/FallingSandSurvival | 223 / 2022 (보관) | C++ | BSD-3-Clause | 미확인 | 재사용 가능(코드) | 노이타식 픽셀 물리 |
| Dreamtowards/Ethertum | 561 / 2026-10-22 | Rust | GPL-3.0 | — | 학습만 | 복셀 |
| KenneyNL/Starter-Kit-City-Builder | 1,525 / 2026-03-12 | Godot | **MIT** | README: 스프라이트·3D 모델 **CC0** | **재사용 가능(고지)** | 그리드 건설·도로 (LIFE SIMULATION/콜로니) |
| mars-sim/mars-sim | 170 / 2026-11-25 | Java | GPL-3.0 | — | 학습만 | 화성 정착 콜로니 시뮬 |
| MeoMix/symbiants | 235 / 2024 | Rust/Bevy | Apache-2.0 | 미확인 | 재사용 가능(코드) | 개미 콜로니 |
| jeremyckahn/farmhand | 147 / 2026-11-27 | TypeScript/React | GPL-2.0 | 미확인 | 학습만 | 웹 농장 경영 |
| Kenny-Haworth/Harvest-Moon-2.0 | 299 / 2020 | GDScript | MIT | 미확인(하베스트문 팬작 — 상표 주의) | 코드만 학습 권장 | |
| gabrielecirulli/2048 | 13,489 / 2024 | JS | MIT | — | 재사용 가능(고지) | (기존 카탈로그) |
| gereleth/hexapipes | 220 / 2026-11-22 | JS/Svelte | **MIT** | — | **재사용 가능(고지)** | 퍼즐 **생성기+솔버** `src/lib/puzzle/{generator,solver,worker}.js` + 테스트 |
| daltonbr/Match3 | 477 / 2026-11-22 | C#/Unity | MIT | 미확인 | 재사용 가능(코드) | `Assets/Scripts/{GameGrid,GamePiece,ClearLinePiece,Level,LevelMoves}.cs` |
| HarmonyHoney/ROTA | 340 / 2026-06-25 | GDScript | MIT | 미확인 | 재사용 가능(코드) | 회전 퍼즐 플랫포머 |
| HarmonyHoney/tiny_crate | 240 / 2026-06-25 | GDScript | Unlicense | 미확인 | 재사용 가능 | |
| danaugrs/gokoban | 293 / 2023 | Go | BSD-2-Clause | 미확인 | 재사용 가능(고지) | 3D 소코반 |
| divVerent/aaaaxy | 306 / 2026-11-26 | Go | Apache-2.0 | 미확인 | 재사용 가능(고지) | 비유클리드 퍼즐 플랫포머 |
| lucasnlm/antimine-android | 814 / 2025 | Kotlin | GPL-3.0 | — | 학습만 | 지뢰찾기 생성(추측 없는 보드) |
| liyupi/yulegeyu · liyupi/daxigua | 1,835 · 1,432 | TS/JS | spdx null (LICENSE 없음) | — | **읽기만** | 중국 바이럴 퍼즐 클론 |
| FreezingMoon/AncientBeast | 1,893 / 2026-11-26 | TypeScript | AGPL-3.0 | 미확인 | 학습만 | 웹 턴제 헥스 전술 (TACTICAL ARENA) |
| ramaureirac/godot-tactical-rpg | 984 / 2026-02-21 | GDScript | MIT | 미확인 | 재사용 가능(코드) | 그리드 전술 이동·공격 범위 |
| gdquest-demos/godot-open-rpg | 3,093 / 2026-10-13 | GDScript | MIT | 미확인(GDQuest 에셋은 별도 표기 가능) | 재사용 가능(코드) | 턴제 전투·대화 |
| dialogic-godot/dialogic | 6,194 / 2026-11-19 | GDScript | MIT | — | 재사용 가능(고지) | 대화 시스템 (LIFE SIMULATION) |
| focus-creative-games/luban | 4,682 / 2026-10-09 | C# | MIT | — | 재사용 가능(고지) | 엑셀→코드/데이터 테이블 생성기 |
| genaray/Arch | 1,883 / 2026-11-26 | C# | Apache-2.0 | — | 재사용 가능(고지) | 고성능 C# ECS |
| damian-pastorini/reldens | 593 / 2026-11-25 | JavaScript | MIT | 미확인 | 재사용 가능(코드) | 웹 MMORPG (Colyseus 기반 여부 미확인) |

### 의심 항목 (제외)
- `AhmadHassan-BTed/CursedTomorrow`: ★4,916인데 포크 2 — 스타 조작/스팸 의심. `avasnow-makes78/microsoft-office-ultimate-desktop`: 키워드 검색에 섞인 스팸. **둘 다 열람·다운로드하지 않았고 감사 대상에서 제외.**

## 부록 A. 원시 조회 데이터 (2026-11-27, gh search/repositories; 열: 저장소·★·포크·언어·spdx·최근push·archived[·fork])

### b1
```
Anuken/Mindustry	29988	3888	Java	GPL-3.0	2026-11-18	false	false
OpenRA/OpenRA	17842	3126	C#	GPL-3.0	2026-11-22	false	false
heroiclabs/nakama	13784	1542	Go	Apache-2.0	2026-11-26	false	false
CleverRaven/Cataclysm-DDA	13582	4748	C++	NOASSERTION	2026-11-26	false	false
veloren/veloren	7718	583	Rust	GPL-3.0	2026-11-26	false	false
colyseus/colyseus	7586	689	TypeScript	MIT	2026-11-25	false	false
MirrorNetworking/Mirror	6408	876	C#	MIT	2026-11-18	false	false
GodotSteam/GodotSteam	3773	225		null	2026-11-08	true	false
rlabrecque/Steamworks.NET	3661	453	C#	MIT	2026-10-29	false	false
Unity-Technologies/com.unity.netcode.gameobjects	2333	465	C#	NOASSERTION	2026-11-26	false	false
FirstGearGames/FishNet	2094	243	C#	NOASSERTION	2026-10-18	false	false
max99x/wutw-public	261	28	GDScript	CC0-1.0	2026-11-24	false	false
smshahbaj/awesome-open-source-games	62	7	Python	NOASSERTION	2026-11-01	false	false
```
### b2
```
luanti-org/luanti	13898	2540	C++	NOASSERTION	2026-11-26	false	false
boardgameio/boardgame.io	12500	840	TypeScript	MIT	2026-10-30	false	false
godotengine/godot-demo-projects	9841	2312	GDScript	MIT	2026-11-25	false	false
pshenok/server-survival	6521	721	JavaScript	MIT	2026-11-21	false	false
SmartlyDressedGames/U3-SDK	4064	599	C#	NOASSERTION	2026-11-06	false	false
MovingBlocks/Terasology	3912	1379	Java	Apache-2.0	2026-11-18	false	false
Revolutionary-Games/Thrive	3898	657	C#	NOASSERTION	2026-11-26	false	false
tomlooman/EpicSurvivalGame	3403	1157	C++	MIT	2026-02-12	false	false
FakeFishGames/Barotrauma	2304	482	C#	null	2026-11-26	false	false
KenneyNL/Starter-Kit-City-Builder	1525	225	GDScript	MIT	2026-03-12	false	false
geckosio/geckos.io	1489	90	TypeScript	BSD-3-Clause	2026-03-27	false	false
Unvanquished/Unvanquished	1131	188	C++	NOASSERTION	2026-11-25	false	false
```
### t_deckbuilder
```
BigJk/end_of_eden	206	9	Go	MIT	2024-09-02	false
```
### k_deck
```
ycarowr/UiCard	577	113	C#	MIT	2025-07-26	false
Gennadiyev/STS2MCP	547	113	C#	MIT	2026-07-29	false
kiooeht/ModTheSpire	520	99	Java	MIT	2025-07-12	false
ModinMobileSTS/SlayTheAmethystModded	491	11	Kotlin	NOASSERTION	2026-11-23	false
Alchyr/BaseLib-StS2	466	94	C#	MIT	2026-11-26	false
guladam/deck_builder_tutorial	459	89	GDScript	MIT	2024-10-16	false
silverua/slay-the-spire-map-in-unity	428	95	C#	MIT	2026-11-15	false
Ekyso/StS2-Launcher	388	63	C#	MIT	2026-04-06	false
ptrlrd/spire-codex	325	56	TypeScript	NOASSERTION	2026-11-26	false
oskarrough/slaytheweb	323	65	JavaScript	AGPL-3.0	2026-11-23	false
FugerQingliu/SlayTheSpire2AutoDrawing	323	6	HTML	null	2026-03-23	false
Alchyr/ModTemplate-StS2	318	53	C#	null	2026-10-30	false
freude916/sts2-quickRestart	307	7	C#	null	2026-06-07	false
DesirePathGames/Slay-The-Robot	297	60	GDScript	MIT	2026-11-26	false
wuhao21/sts2-cli	286	71	C#	MIT	2026-10-29	false
yurkth/stsmapgen	268	23	JavaScript	MIT	2021-10-20	false
max99x/wutw-public	261	28	GDScript	CC0-1.0	2026-11-24	false
BAKAOLC/STS2-RitsuLib	252	23	C#	MIT	2026-11-25	false
GlitchedReme/SlayTheSpire2ModdingTutorials	217	17		null	2026-11-13	false
GlitchedReme/SlayTheSpireModTutorials	210	9	Java	null	2026-03-07	false
avasnow-makes78/microsoft-office-ultimate-desktop	209	0	C++	MIT	2026-11-27	false
BigJk/end_of_eden	206	9	Go	MIT	2024-09-02	false
RyanSaxe/mtg	191	50	Python	Apache-2.0	2024-03-30	false
DoublePigeon/RegentCardsAnimeRework	181	1		null	2026-11-20	false
Null-Signal-Games/netrunnerdb	168	91	PHP	MIT	2026-09-19	false
```
### t_roguelike
```
tomlooman/ActionRoguelike	4674	828	C++	null	2026-11-26	false
NetHack/NetHack	4005	656	C	null	2026-11-26	false
ondras/rot.js	2734	267	JavaScript	BSD-3-Clause	2024-11-13	false
amethyst/bracket-lib	1696	130	Rust	MIT	2025-12-05	false
angband/angband	1591	402	C	null	2026-11-24	false
tmewett/BrogueCE	1539	209	C	AGPL-3.0	2026-11-23	false
AsPJT/DungeonTemplateLibrary	1467	90	C++	BSL-1.0	2025-04-09	false
Thraka/SadConsole	1388	131	C#	MIT	2026-09-25	false
marukrap/RoguelikeDevResources	1324	72		null	2021-07-18	false
cataclysmbn/Cataclysm-BN	1318	520	C++	NOASSERTION	2026-11-26	false
Hexworks/zircon	796	134	Kotlin	Apache-2.0	2026-11-21	false
LambdaHack/LambdaHack	659	60	Haskell	BSD-3-Clause	2026-11-24	false
FaronBracy/RogueSharp	637	67	C#	MIT	2024-08-03	false
garkimasera/rusted-ruins	562	33	Rust	GPL-3.0	2023-04-03	false
dungeons-of-moria/umoria	462	107	C++	GPL-3.0	2025-07-26	false
Larkenx/Rotten-Soup	408	56	JavaScript	GPL-3.0	2026-07-01	false
mikeyk730/Rogue-Collection	378	22	C	null	2025-09-11	false
Attnam/ivan	360	53	C++	GPL-2.0	2026-11-06	false
egordorichev/BurningKnight	343	45	C#	MIT	2024-03-18	false
oskarrough/slaytheweb	323	65	JavaScript	AGPL-3.0	2026-11-23	false
```
### t_godot
```
heroiclabs/nakama	13784	1542	Go	Apache-2.0	2026-11-26	false
0xFA11/MultiplayerNetworkingResources	8800	552	C	null	2026-08-27	false
dialogic-godot/dialogic	6194	369	GDScript	MIT	2026-11-19	false
focus-creative-games/luban	4682	746	C#	MIT	2026-10-09	false
Revolutionary-Games/Thrive	3898	657	C#	NOASSERTION	2026-11-26	false
gdquest-demos/godot-open-rpg	3093	382	GDScript	MIT	2026-10-13	false
git-learning-game/oh-my-git	2914	220	GDScript	NOASSERTION	2025-12-02	false
genaray/Arch	1883	182	C#	Apache-2.0	2026-11-26	false
a-little-org-called-mario/a-little-game-called-mario	1454	182	GDScript	NOASSERTION	2025-03-30	false
gdquest-demos/godot-make-pro-2d-games	1291	132	GDScript	MIT	2021-04-26	false
iohao/ioGame	1282	287	Java	AGPL-3.0	2026-08-02	false
Quaint-Studios/Reia	1010	69	GDScript	AGPL-3.0	2026-10-23	false
ShadowBlip/OpenGamepadUI	1008	52	GDScript	GPL-3.0	2026-11-12	false
utopia-rise/godot-jvm	1007	64	Kotlin	MIT	2026-11-13	false
ramaureirac/godot-tactical-rpg	984	118	GDScript	MIT	2026-02-21	false
luxtorpeda-dev/luxtorpeda	954	27	Rust	GPL-2.0	2026-05-26	true
unknown-horizons/godot-port	920	116	GDScript	GPL-2.0	2026-09-14	false
gdquest-demos/godot-platformer-2d	821	89	GDScript	MIT	2022-04-13	false
heroiclabs/nakama-godot	789	99	GDScript	Apache-2.0	2026-11-04	false
loudsmilestudios/TetraForce	672	71	GDScript	MIT	2026-09-05	false
TinyTakinTeller/TakinGodotTemplate	502	37	GDScript	MIT	2025-10-06	false
```
### t_multiplayer-game
```
JACoders/OpenJK	2345	752	C++	GPL-2.0	2026-09-29	false
FakeFishGames/Barotrauma	2304	482	C#	null	2026-11-26	false
multitheftauto/mtasa-blue	1912	611	C++	GPL-3.0	2026-11-26	false
FreezingMoon/AncientBeast	1893	725	TypeScript	AGPL-3.0	2026-11-26	false
TeamHypersomnia/Hypersomnia	1734	128	C++	AGPL-3.0	2026-11-15	false
BeardedManStudios/ForgeNetworkingRemastered	1479	300	C#	Apache-2.0	2022-08-15	true
yvt/openspades	1255	233	C++	GPL-3.0	2024-06-06	false
Quaver/Quaver	816	115	C#	MPL-2.0	2026-11-19	false
etlegacy/etlegacy	737	149	C	GPL-3.0	2026-11-26	false
openmultiplayer/open.mp	678	235	C++	MPL-2.0	2026-11-16	false
GeoGuess/GeoGuess	595	137	Vue	MIT	2026-08-03	false
damian-pastorini/reldens	593	90	JavaScript	MIT	2026-11-25	false
codergautam/worldguessr	579	199	JavaScript	NOASSERTION	2026-11-26	false
rameshvarun/netplayjs	578	46	TypeScript	ISC	2024-10-10	false
MirageNet/Mirage	572	67	C#	MIT	2026-11-24	false
```
### t_survival-game
```
PieKing1215/FallingSandSurvival	223	30	C++	BSD-3-Clause	2022-09-24	true
BentoBoxWorld/BSkyBlock	169	55	Java	EPL-2.0	2026-11-24	false
brainintelli/BioSignal-Guided-LLM-Reinforcement-Learning	169	33	Python	MIT	2026-11-24	false
```
### k_surv
```
CleverRaven/Cataclysm-DDA	13582	4748	C++	NOASSERTION	2026-11-26	false
pshenok/server-survival	6521	721	JavaScript	MIT	2026-11-21	false
AhmadHassan-BTed/CursedTomorrow	4916	2	C++	MIT	2026-11-09	false
SmartlyDressedGames/U3-SDK	4064	599	C#	NOASSERTION	2026-11-06	false
tomlooman/EpicSurvivalGame	3403	1157	C++	MIT	2026-02-12	false
jasonrohrer/OneLife	1138	308	C++	NOASSERTION	2026-11-26	false
turesnake/tprPix	724	131	C++	BSD-3-Clause	2023-04-07	false
Dreamtowards/Ethertum	561	38	Rust	GPL-3.0	2026-10-22	false
cadon/ARKStatsExtractor	532	270	C#	MIT	2026-11-17	false
```
### t_colony-sim
```
MeoMix/symbiants	235	7	Rust	Apache-2.0	2024-08-13	false
mars-sim/mars-sim	170	53	Java	GPL-3.0	2026-11-25	false
```
### k_colony
```
bones-ai/rust-ants-colony-simulation	213	10	Rust	null	2023-10-20	false
piXelicidio/locas-ants	167	25	Lua	MIT	2025-06-06	false
juliangamble/clojure-ants-simulation	144	36	Clojure	null	2014-11-09	false
tulustul/ants-sandbox	105	8	TypeScript	MIT	2023-07-15	false
```
### t_farming-game
```
jeremyckahn/farmhand	147	45	TypeScript	GPL-2.0	2026-11-27	false
```
### k_farm
```
Kenny-Haworth/Harvest-Moon-2.0	299	73	GDScript	MIT	2020-07-15	false
masterking32/MasterHamsterKombatBot	253	73	Python	Apache-2.0	2024-09-22	true
```
### t_puzzle-game
```
gabrielecirulli/2048	13489	17704	JavaScript	MIT	2024-10-24	false
liyupi/yulegeyu	1835	563	TypeScript	null	2026-11-23	false
liyupi/daxigua	1432	930	JavaScript	null	2026-11-23	false
lucasnlm/antimine-android	814	104	Kotlin	GPL-3.0	2025-08-02	false
Strophox/tetro-tui	772	18	Rust	MIT	2026-08-13	false
tetrio/issues	505	19		null	2024-01-11	false
daltonbr/Match3	477	117	C#	MIT	2026-11-22	false
HarmonyHoney/ROTA	340	42	GDScript	MIT	2026-06-25	false
abakh/nbsdgames	318	25	C	NOASSERTION	2026-11-22	false
divVerent/aaaaxy	306	17	Go	Apache-2.0	2026-11-26	false
danaugrs/gokoban	293	29	Go	BSD-2-Clause	2023-10-22	false
HarmonyHoney/tiny_crate	240	32	GDScript	Unlicense	2026-06-25	false
gereleth/hexapipes	220	29	JavaScript	MIT	2026-11-22	false
meikpiep/gauguin	215	22	Kotlin	GPL-3.0	2026-11-22	false
quackle/quackle	211	50	C++	NOASSERTION	2026-11-25	false
```
