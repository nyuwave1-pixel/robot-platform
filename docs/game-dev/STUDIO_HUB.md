# 게임 개발 스튜디오 허브 — 세션 역할과 연결 방식

여러 Claude 세션이 같은 지시서(무료 에셋 + 오픈소스 통합)를 나눠 맡고, 이 저장소를 통해 결과를 주고받습니다.
지시서 본문: [`.claude/skills/free-asset-pipeline/SKILL.md`](../../.claude/skills/free-asset-pipeline/SKILL.md) ·
출처 목록: [`FREE_ASSET_SOURCES.md`](FREE_ASSET_SOURCES.md)

## 역할

| 세션(앱의 제목) | 실행 위치 | 맡는 일 |
|---|---|---|
| **게임 개발 학습** | 클라우드 | 허브. 지시서·출처 카탈로그·라이선스 기준 관리, 세션 간 작업 배분과 결과 검토 |
| **Special Soldier FPS 게임 개발** | 클라우드 | SPECIAL SOLDIER(Three.js)에 CC0 에셋 적용: Poly Haven·ambientCG 재질/HDRI, Quaternius 모델, 사운드. e2e 테스트·스크린샷·성능 측정 |
| **SPECIAL SOLDIER — PC Blender 빌드** | 사용자 PC | Windows Blender 5.3으로 `tools/blender/build.py` 실행 검증, FBX→GLB 변환, Mixamo 리타깃(Chrome 로그인), Kenney·Sketchfab 등 로그인/403 출처 다운로드 |
| **퍼즐 게임** | 사용자 PC | 같은 파이프라인으로 퍼즐 게임 UI·아이콘·사운드(Kenney UI/Audio, game-icons.net) 적용 |
| **Unity 연동 (PC Blender 세션이 겸임)** | 사용자 PC | 설치된 Unity 6000.6.9f1(Unity 6.6) 사용, Unity 공식 Claude Code 플러그인 연동, `apps/unity-studio` 에서 공용 Blender GLB(glTFast) 임포트 검증. 기록: `docs/game-dev/UNITY_SETUP.md` |
| **BIT PARK 게임 브랜드 포털 기획** | 사용자 PC (`C:\개발\bitpark-portal`, 별도 저장소) | 게임 브랜드 포털. 이 저장소의 `docs/game-dev/bitpark/feed.json` 을 읽어 **GAME DEV LAB** 섹션 표시(계약: `docs/game-dev/bitpark/README.md`) |
| **메디더마라운지게임** | 클라우드 | WORLD PLAZA(라운지)에 Quaternius/Kenney 스타일 에셋 적용, 기존 Blender 맵과 스타일 통일 |

UE5 전용 항목(Lyra, GAS, Nanite, Lumen)은 `.uproject` 가 있는 프로젝트(Project Leonida 등)가 이 저장소나 PC에 생겼을 때만 적용합니다.

## 연결 규칙

0. **새 PC는 [`NEW_PC_SETUP.md`](NEW_PC_SETUP.md)** 순서로 준비합니다(`tools/dev-env/setup.ps1`). 도구 버전은 `tools/dev-env/versions.json` 기준.

1. **공유 지점은 Git 브랜치입니다.** SPECIAL SOLDIER는 `claude/relaxed-ramanujan-83okpi`. 작업 전 `git pull`, 작업 후 커밋·푸시.
   같은 파일을 두 세션이 동시에 고치지 않도록 아래 "작업 중" 표에 먼저 적습니다.
2. **넘길 일은 이 문서의 "요청" 표에 적고 커밋**합니다(예: 클라우드 → PC: "Mixamo Rifle Idle/Walk/Run FBX 받아 `tools/assets/incoming/` 에").
   받은 세션은 처리 후 상태를 바꿉니다.
3. **에셋은 라이선스 대장과 같은 커밋에** 들어갑니다(`docs/ASSET_LICENSES.md` 등). 대장에 없는 파일은 병합하지 않습니다.
4. **완료 보고는 증거와 함께**: 테스트 출력, 전후 스크린샷 경로, 측정값. 못 한 일은 못 했다고 적습니다.

## 작업 중

| 세션 | 대상 파일/폴더 | 시작일 |
|---|---|---|
| 허브(클라우드) | **U3 병사 애니메이션(Quaternius UAL CC0)**: 새 `apps/unity-studio/Assets/ThirdParty/Quaternius/`(UAL1_Standard.fbx·License), 새 `Tools~/fetch-ual.mjs`, 새 `Core/SoldierPose.cs`·`Tools~/gen-pose-fixture.mjs`·테스트, 새 `Runtime/SoldierAnimator.cs`, 새 `Editor/Slice/SoldierAnimBuilder.cs`(UalImport 포함), 새 `Tests/PlayMode/SoldierAnimTests.cs`, 수정 `Editor/Slice/SliceBuilder.cs`(BuildEnemy 에 애니메이터), `Runtime/EnemyAgent.cs`(WantsCrouch·PoseDriven 만), `ASSET_LICENSES.md`(Unity). 웹 `models.js` 는 읽기만 | 2026-11-25 (푸시 완료) |
| 허브(클라우드) | **U4 캠페인 미션 이식 — 미션 01 SILENT LANDING**: 새 `apps/unity-studio/Assets/Scripts/Core/Campaign.cs`·테스트, 새 `Runtime/SceneRouter.cs`, 수정 `Core/Mission.cs`(경보 1회 규칙), `Runtime/GameDirector.cs`(캠페인 모드·경보·증원), `Editor/Slice/SliceBuilder.cs`(Mission01 씬·빌드 씬 목록), `Runtime/HudToolkit.cs`·`Assets/UI/SliceHud.uss`(무전 줄), `Runtime/SkyDirector.cs`(미션 하늘 우선), 새 `Tests/PlayMode/Mission01Tests.cs`. 웹 `missions.js` 는 읽기만 | 2026-11-25 (푸시 완료) |
| 클라우드 (Special Soldier) | **v0.22 웹 멀티플레이(1v1 → 15v15)**: 새 `apps/special-soldier/src/net/*`·`src/ui/mp.js`·`server/*`·`tests/mp*.mjs`, 작은 연결 `src/{main.js,game/fx.js,game/weapons.js,game/player.js}`, `src/ui/menu.js`(multiplayer 화면·버전 표시 — PC 세션 반납 후), `package.json`(@supabase/realtime-js·ws, `mp:server`) | 2026-11-25 |
| 클라우드 (Special Soldier) | **v0.21 미션 02 순서 자유 목표**: `apps/special-soldier/src/game/missions.js`(미션 02 목표·발전기 초소), `tests/plans.mjs`(`anyorder2`), `docs/{GAME_DESIGN,QA_REPORT}.md`. 버전 표시(`src/ui/menu.js`의 v0.20)는 PC 세션 메뉴 작업이 끝난 뒤 올림. HUD 표시 설정도 `menu.js` 가 풀린 뒤 진행 | 2026-11-25 |
| 허브(클라우드) | **공용 섬 식생(웹+Unity)**: 웹 새 `apps/special-soldier/src/world/vegetation.js` + `src/world/build.js` 의 `buildVegetation` 배치 부분(자체 시드로 분리 → 웹 나무 위치가 한 번 바뀜), Unity 새 `Core/IslandVegetation.cs`·`Tools~/gen-vegetation-fixture.mjs`·테스트, `Editor/Slice/SliceBuilder.cs`(나무·야자수·바위 배치) | 2026-11-25 (푸시 완료) |
| 허브(클라우드) | **공용 섬 지형(웹+Unity)**: 웹 새 `apps/special-soldier/src/world/terrain.js`(world.js 의 rawHeight·FLATS·SIZE 를 옮김, 동작 동일) + `src/world/world.js` import 줄, Unity 새 `Core/IslandTerrain.cs`·`Tools~/gen-terrain-fixture.mjs`·테스트, `Editor/Slice/SliceBuilder.cs`(지형·바다·NavMesh 범위) | 2026-11-25 (푸시 완료) |
| PC Unity | **하나의 게임, 두 판 선택**: `apps/special-soldier/src/{ui/menu.js,config/editions.js}`·`tests/e2e.mjs`(메뉴 루프), `apps/unity-studio/Assets/Scripts/Runtime/{PauseMenu,SettingsStore,PortalBridge}.cs`·`Plugins/WebGL/PortalBridge.jslib`(URL ?difficulty·돌아가기), `docs/game-dev/EDITIONS_ROADMAP.md` | 2026-11-25 |
| 허브(클라우드) | 설정·일시정지 메뉴: 새 `Core/GameSettings.cs`·`Runtime/PauseMenu.cs`·`Assets/UI/PauseMenu.uss`·테스트, 수정 `Runtime/{PlayerMotor,GameDirector,SliceFx,SkyDirector}.cs`(설정 적용 부분), `Editor/Slice/SliceBuilder.cs`(메뉴 추가) | 2026-11-25 (푸시 완료) |
| 허브(클라우드) | `apps/unity-studio/Assets/Scripts/Core/AwarenessBrain.cs`, `Runtime/EnemyAgent.cs`(Perceive 부분만), `Tests/EditMode/HealthAndAwarenessTests.cs`·새 `AwarenessParityTests.cs` — 적 인지 웹 일치(감쇠 0.18/s, 밤·웅크림·비·경계 시야). **PC 세션의 4묶음 푸시 뒤에 병합** | 2026-11-25 (병합·푸시 완료) |
| 허브(클라우드) | `apps/unity-studio/Assets/Scripts/Runtime/{SliceFx,WeaponController,EnemyAgent,Grenade,PlayerMotor}.cs`, `Core/SfxSynth.cs` — 효과음 2차 | 2026-11-25 (이 커밋에서 완료) |
| 클라우드 (Special Soldier) | `apps/special-soldier/{SETUP.md,scripts/,package.json}`, `.devcontainer/` — macOS/Linux/Codespaces 세팅, `npm run assets` | 2026-11-21 (이 커밋에서 완료) |

## 요청

| 요청 세션 → 담당 세션 | 내용 | 상태 |
|---|---|---|
| 허브 → PC Blender | Windows Blender 5.3에서 `build.py -- --no-render` 실행 결과(성공/오류 로그) 기록 | **완료** 2026-11-19 — 종료 0, 120,132 tris·51 assets·GLB 7,168 kB(v0.12). 렌더·charsheet도 정상. 기록: `apps/special-soldier/docs/BLENDER.md` |
| 허브 → Special Soldier | `docs/ASSET_LICENSES.md` 등 대장 4종 생성(기존 `CREDITS.txt` 이관), 1차 CC0 에셋 10종 선정·적용 | **1차 완료** 2026-11-19 (v0.14) — 대장 4종 생성, Freesound CC0 9개 출처 → 효과음·발소리·음악 3곡 적용, E2E 62/63(실패 1건은 favicon 404 → 수정 후 콘솔 오류 0). Kenney·OGA는 자동 다운로드 불가로 보류 |
| 허브 → PC Blender (Unity) | 설치된 Unity 6000.6.9f1 확인, 라이선스 확인·로그인 안내, 공식 Claude Code 플러그인 연동, `apps/unity-studio` 테스트 씬·Windows 빌드 1회 | **라이선스에서 멈춤** 2026-11-19 — 에디터·Windows/WebGL 모듈 확인, Hub 미설치, batchmode 결과 `No valid Unity Editor license`(종료 198). 플러그인 스킬은 이미 로드됨. 사용자가 Hub 설치·로그인·Personal 라이선스 활성화 후 `apps/unity-studio/run-batch.ps1` 실행 예정. 기록: `docs/game-dev/UNITY_SETUP.md` |
| 허브 → PC Blender (Unity) | **Claude Code × Unity 통합**: `docs/game-dev/UNITY_CLAUDE_INTEGRATION.md` §2 환경 체크리스트 → (라이선스 후) run-batch.ps1 → Unity CLI·Pipeline 패키지로 에디터 실시간 제어 왕복 테스트 → 테스트·빌드 자동화 | **완료 2026-11-24**: Unity CLI 1.0.1 · Pipeline 패키지 1.0.1 · 열린 에디터에서 씬 생성→오브젝트 생성→C# eval 이동→저장→디스크 확인 왕복 성공. 알려진 문제: `script eval` 이 씬 전환 후 `ROSLYN001 Illegal byte sequence`(한글 경로 의심) — 내장 명령(gameobject·scene·asset)은 정상 |
| 허브 → PC Blender (Unity) | **Unity 슬라이스 첫 검증**: 라이선스 활성화 후 `run-batch.ps1` 전체(packages → build → slice → tests). `SpecialSoldier.Runtime`·`Slice.Editor` 는 Unity에서 처음 컴파일됨 → 컴파일 오류 수정, `IslandSlice.exe` 실행·조작 확인, EditMode 결과 기록 | **통과** 2026-11-23 — 라이선스(MSIX Hub 가상화 경로 문제) 해결, 컴파일 오류 1(CS0104 BodyPart) 수정, Windows·슬라이스 빌드 성공, EditMode 159/159, `IslandSlice.exe` 실행·HUD 확인(직접 조작은 미확인). 기록: `docs/game-dev/UNITY_SETUP.md` 2026-11-23 절 |
| 허브 → PC Blender | **새 PC 환경 스크립트 Windows 검증** (`tools/dev-env/*`, `build.ps1`, `run-batch.ps1` 경로 탐색) | **완료** 2026-11-23 — 수정 없음. setup.ps1 판정 일치, build.ps1 결과가 커밋된 GLB와 동일, Unity.exe 자동 탐색 성공. `-Install` 미실행. 기록: `docs/game-dev/NEW_PC_SETUP.md` §6 |
| 허브 → BIT PARK 포털 | `feed.json`(schemaVersion 1)을 읽는 GAME DEV LAB 섹션 추가: 현황 카드·학습 로드맵·에셋 파이프라인·개발 로그, WebGL 빌드가 있으면 플레이 버튼 | 요청함 2026-11-24 |
| 허브 → PC Blender (Unity) | `run-batch.ps1 -WebGL` 로 브라우저 빌드(`Builds/WebGL`) 만들고 feed 재생성. Unity CLI는 설치 스크립트 실패 → winget(MSIX) 경로로 재시도(설치는 사용자 승인 후) | **완료** 2026-11-25 — WebGL 15.3 MB(내비메시 에셋 저장 수정 후 적 이동 정상), CLI는 사용자 재설치로 1.0.1 동작. 엄폐 AI·수류탄 Unity 첫 컴파일(CS0619 1건 수정), EditMode 180/180·PlayMode 10/10. 포인터 잠금 이동·사격은 사람 확인 필요. 기록: `UNITY_SETUP.md` |
| 허브 → PC Blender (Unity) | **적 엄폐·측면 우회 첫 검증**: `run-batch.ps1` 로 컴파일·EditMode(173 예상)·PlayMode, PlayMode 테스트 1개 추가 제안 — 전투 시작 후 경계병이 엄폐물 뒤로 이동(`EnemyAgent.InCover`), 정예가 측면으로 돌아감. 플레이 감각 확인 | 요청함 2026-11-24 |
| 허브 → PC Blender (Unity) | **수류탄 첫 검증**(엄폐 AI와 함께): 컴파일·EditMode(180 예상)·PlayMode. 플레이: G로 투척·튕김·폭발 피해, 정예가 웅크려 숨은 플레이어에게 투척, 'GRENADE!' 경고. PlayMode 테스트 1개 제안(수류탄 옆 적이 피해를 입음) | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **효과음 2차 확인**: 컴파일·EditMode(199 예상)·PlayMode. 귀로 확인 — 무기별 총성 차이, 수류탄 폭발, 재장전·딸깍·명중·사살·피격·스침음, 표면별 탄착음, 교전 배경음. 너무 크거나 작은 소리는 `SliceFx` 음량 조정. WebGL에서도 소리 나는지 | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **미션·등급 첫 검증**: 컴파일·EditMode(212 예상)·PlayMode(교체된 `MissionFlow_...` 포함). 직접 플레이 — 목표 줄, [E] 다운로드, 탈출, 결과 화면 등급. WebGL 빌드에서 포털로 `game_result` 가 가는지 | 요청함 2026-11-25 |
| 허브 → BIT PARK 포털 | Unity WebGL이 끝나면 `game_result`(`game: special-soldier-unity`, `engine: unity`, score·rp·mission·grade)를 보냄 → 웹 게임과 같은 방식으로 받아 RP 반영 | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **하늘·조명 첫 확인**: 컴파일(Runtime asmdef에 URP 참조 추가됨)·EditMode(230 예상)·PlayMode → 슬라이스 재생성 → [K]로 5개 날씨 스크린샷(`docs/game-dev/screenshots/unity-sky-*.png`) → 너무 밝거나 어두우면 `SkyDirector.sunScale`·`basePostExposure` 만 조정. SSAO가 추가됐는지 로그 `[Slice] SSAO`. WebGL `?sky=storm` 확인 | **완료** 2026-11-25 — 컴파일 0 오류, EditMode 242/242·PlayMode 12/12, 5종 WebGL 화면 `screenshots/unity-sky-*.jpg`. storm·dusk·night 하늘 돔이 땅보다 너무 어두움 → 허브 조정 요청. 번개 화면 미확인 |
| 허브 → PC Blender (Unity) | **UI Toolkit HUD 첫 확인**: 컴파일·EditMode(242 예상)·PlayMode(새 `HudTests` 2개) → 슬라이스 재생성(로그 `[Slice] HUD: UI Toolkit (panel ok, style ok, theme ok)`) → 1920×1080 스크린샷(`docs/game-dev/screenshots/unity-hud.png`) → 글자 겹침·크기 문제는 `Assets/UI/SliceHud.uss` 만 조정. WebGL에서도 표시 확인 | **완료** 2026-11-25 — `[Slice] HUD: UI Toolkit (panel ok, style ok, theme ok)`, HudTests 2개 통과. WebGL 수정 2건: 글리프 ASCII 치환, HiDPI 이중 확대 → devicePixelRatio 1 고정. 화면 `screenshots/unity-hud.jpg` |
| 허브 → PC Blender (Unity) | **하늘 재보정·적 인지 확인**: run-batch(EditMode 249 예상) → WebGL에서 [K]로 storm·dusk·night 다시 캡처(하늘에 회색 구름·노을·별이 보이고 땅이 지나치게 밝지 않은지) → 밤·웅크림으로 적에게 더 가까이 갈 수 있는지 플레이 확인 | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **설정·일시정지 메뉴 첫 확인**: run-batch(EditMode 253 예상, PlayMode 새 `PauseMenuTests` 2개) → WebGL에서 Esc(첫 Esc는 브라우저가 잠금 해제 → 메뉴 자동 열림) → 슬라이더·난이도·날씨 버튼 동작, 새로고침 뒤 값 유지 확인, 메뉴 스크린샷 `docs/game-dev/screenshots/unity-pause-menu.png`. 하늘 재보정(fd35aa7) 확인도 함께 | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **공용 섬 지형 첫 확인**: run-batch(EditMode 258 예상) → 로그 `[Slice] island terrain 513² … ground at slice origin y = 0.00` → 벽 너머로 언덕·해변·바다가 보이는지, 적·플레이어가 땅에 붙는지(PlayMode 기존 테스트) → WebGL 크기·프레임 확인(섬이 무거우면 `heightmapPixelError`·`basemapDistance` 조정) → 스크린샷 `docs/game-dev/screenshots/unity-island.jpg` | 요청함 2026-11-25 |
| 허브 → Special Soldier(웹) | 섬 공식이 `src/world/terrain.js` 로 옮겨짐(동작 동일, world.js 가 다시 내보냄). 섬을 바꿀 때는 terrain.js 를 고치고 `node apps/unity-studio/Tools~/gen-terrain-fixture.mjs` 로 Unity 대조 픽스처를 갱신 — 안 하면 Unity `IslandTerrainTests` 가 실패해 알려 줌 | 안내 2026-11-25 |
| 허브 → PC Blender (Unity) | **섬 식생 + 거울상 수정 확인**: run-batch(EditMode 266) → 로그 `[Slice] vegetation: 1565 trees, 221 palms, 176 rocks → N merged meshes` → 벽 너머 정글·해변 야자수, 웹 섬과 같은 방향(통신소가 북서쪽)인지 → WebGL 크기·프레임 → 스크린샷 `unity-island.jpg` | 요청함 2026-11-25 |
| 허브 → Special Soldier(웹) | `vegetation.js` 로 식생이 자체 시드가 되어 **웹의 나무 위치가 한 번 바뀜** → `npm run test:e2e` 로 캠페인 회귀(특히 길찾기·엄폐·경로) 확인 필요. 이 클라우드에서는 E2E를 못 돌림 | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **미션 01 SILENT LANDING 첫 확인**(U4): run-batch(EditMode 275 예상, PlayMode 새 `Mission01Tests` 2개) → 로그 `[Slice] MISSION 01 SILENT LANDING: scene saved: Assets/Scenes/Mission01.unity, 9 enemies + 3 QRF, sky night` → 슬라이스·WebGL 빌드에 두 씬이 다 들어갔는지 → WebGL `?mission=m01` 로 바로 미션 01 열림 → 밤 해변에서 시작, 보초 순찰, 5초 교전 시 무전 "QRF coming" + 증원 3명, 보초 전멸 → 정글 길 입구 도달 → 결과 등급. 알려진 차이: 감시탑·레이더·모래주머니 초소는 아직 없음(저격수는 땅에 서 있음). 스크린샷 `docs/game-dev/screenshots/unity-mission01.jpg` | 요청함 2026-11-25 |
| 허브 → PC Blender (Unity) | **병사 애니메이션 첫 확인**(U3): git pull(UAL FBX 23.8 MB 포함) → run-batch(EditMode 281 예상, PlayMode 새 `SoldierAnimTests` 2개). 첫 import 때 FBX가 Humanoid로 들어가는지(로그 `[Slice] soldier animation: controller ok Assets/Animation/Soldier.controller (9 UAL clips)`, `animation: Quaternius UAL rig`), 아바타 경고가 없는지 → 화면: 순찰병 걷기, 전투 중 조깅·엄폐 뒤 웅크림, 피격 움찔, 사망 쓰러짐, 소총이 플레이어 쪽으로 기울기 → **다리가 반대로 꺾이거나 뒤로 걸으면** `SoldierAnimator.pitchSign`(-1)·`rigYaw`(180)만 바꿔 보고 결과 기록 → 생성된 `Assets/Animation/Soldier.controller`(+meta)와 다시 만든 씬 커밋 → WebGL 크기 변화 기록 → 스크린샷 `docs/game-dev/screenshots/unity-soldier-anim.jpg` | 요청함 2026-11-25 |
| 허브 → PC Blender | Mixamo 병사 기본 동작(Idle/Walk/Run/Crouch/Reload) 다운로드 가능 여부 확인 — 현재 병사는 리깅이 없어 리타깃 설계 필요 | **조사만 완료, 다운로드 보류**(사용자 결정: 조사 보고서 먼저). Mixamo는 원본 재배포 조항 때문에 공개 저장소·단일 HTML 빌드에 비권장 → Quaternius UAL(CC0) + 강체 스키닝 방안 제안. `apps/special-soldier/docs/ASSET_RESEARCH.md` §4 |
