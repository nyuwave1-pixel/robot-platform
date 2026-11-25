# Unity 무료 학습 과정 — SPECIAL SOLDIER 슬라이스로 배우기

모든 단계는 **무료**입니다: Unity Personal 라이선스, Unity Learn 공식 코스, Unity 무료 패키지(URP·Input System·AI Navigation·Test Framework·glTFast),
CC0 에셋(`FREE_ASSET_SOURCES.md`). 유료 에셋·구독·Unity AI 크레딧은 쓰지 않습니다.

학습 교재는 이 저장소의 `apps/unity-studio` 입니다. 웹 게임 SPECIAL SOLDIER(Three.js)의 규칙을 Unity로 옮긴 **플레이 가능한 슬라이스**이고,
각 단원이 실제 파일 하나와 연결됩니다. 웹 게임 자체는 그대로 두고 Unity 쪽은 병행 학습·파일럿입니다.

## 0. 준비 (1일)

| 할 일 | 비용 | 참고 |
|---|---|---|
| Unity Hub 설치, Unity ID 로그인, **Personal 라이선스** 활성화 | 무료 | `UNITY_SETUP.md` |
| 이 PC의 Unity 6000.6.9f1 을 Hub에 Locate | — | 새로 설치할 필요 없음 |
| `powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1` | — | 패키지 추가 → GLB 임포트 → 슬라이스 씬·실행 파일 → EditMode 테스트 |
| `apps\unity-studio\Builds\Slice\IslandSlice.exe` 실행 | — | WASD·마우스·Shift·C·Space, 좌클릭 사격, 우클릭 조준, R 재장전, V 사격모드, 1/2/3 무기 |

## 1. 공식 무료 코스 (Unity Learn Pathways)

| 순서 | 코스 | 기간(공식 표기) | 이 저장소에서 바로 해 볼 것 |
|---|---|---|---|
| 1 | [Unity Essentials](https://learn.unity.com/pathway/unity-essentials) | 약 2주 | 에디터 창, 씬·게임오브젝트·컴포넌트 → `IslandSlice.unity` 를 열어 `Player`, `Enemies`, `Level` 구조 살펴보기 |
| 2 | [Junior Programmer](https://learn.unity.com/pathway/junior-programmer) | 약 12주 | C#·MonoBehaviour 생명주기 → 아래 2장 코드 읽기 순서대로 |
| 3 | [Creative Core](https://learn.unity.com/pathway/creative-core) | 약 10주 | 조명·VFX·애니메이션·오디오·UI → 3장 "다음 업데이트" 과제 |

코스 목록: [Unity Learn Pathways](https://learn.unity.com/pathways)

## 2. 코드 읽기 순서 (아키텍처를 배우는 순서)

이 프로젝트는 **규칙(Core)과 엔진(Runtime)을 분리**합니다. 웹 게임 ADR `0002-sim-render-split.md` 와 같은 원칙입니다.

| 단원 | 파일 | 배우는 것 |
|---|---|---|
| 2-1 어셈블리 정의 | `Assets/Scripts/Core/SpecialSoldier.Core.asmdef` (`noEngineReferences: true`) | asmdef로 컴파일 단위 나누기, 엔진 의존 금지 |
| 2-2 데이터 | `Core/WeaponStats.cs`, `Core/WeaponTable.g.cs` (`Tools~/gen-core-data.mjs` 가 웹 데이터에서 생성) | 데이터 주도 설계, 두 엔진이 한 데이터 공유 |
| 2-3 순수 로직 | `Core/Ballistics.cs`, `Core/HealthModel.cs`, `Core/WeaponState.cs` | 시간(`Tick(dt)`)으로 움직이는 상태 기계, 엔진 없이 테스트 가능한 코드 |
| 2-4 AI 상태 기계 | `Core/AwarenessBrain.cs` | PATROL→SUSPICIOUS→SEARCH→COMBAT↔RETREAT, 인지 게이지 |
| 2-5 테스트 | `Assets/Tests/EditMode/*.cs` | NUnit, Unity Test Framework, **웹 JS와 숫자 대조(패리티) 테스트** |
| 2-6 컴포넌트 | `Runtime/Damageable.cs`, `HitZone.cs` | 이벤트, `GetComponentInParent`, 부위별 피해 |
| 2-7 플레이어 | `Runtime/PlayerMotor.cs` | `CharacterController`, Input System 장치 직접 읽기, 반동 |
| 2-8 무기 | `Runtime/WeaponController.cs` | `Physics.Raycast` 히트스캔, 탄퍼짐·블룸, `LineRenderer` 예광 |
| 2-9 적 | `Runtime/EnemyAgent.cs` | `NavMeshAgent`, 시야각+가시선, 생각 주기(0.13/0.45 s) |
| 2-10 게임 규칙·HUD | `Runtime/GameDirector.cs`, `Runtime/Hud.cs` | 승패, 소음 전파, 즉시 모드 GUI |
| 2-11 에디터 자동화 | `Assets/Editor/Slice/SliceBuilder.cs`, `Assets/Editor/StudioBootstrap.cs` | `-batchmode -executeMethod`, 코드로 씬·NavMesh·URP 생성, `BuildPipeline` |
| 2-12 조건부 컴파일 | `Runtime/*.asmdef` 의 `versionDefines` + `defineConstraints` | 패키지가 설치되기 전에는 그 코드를 컴파일하지 않기 |

Unity 없이 Core 테스트만 돌리기(아무 PC, .NET 8 SDK):

```bash
dotnet test "apps/unity-studio/CoreTests~"
```

웹 무기 데이터를 바꾼 뒤에는 다시 생성합니다:

```bash
node "apps/unity-studio/Tools~/gen-core-data.mjs"
```

## 3. 다음 업데이트 과제 (난이도 순, 모두 무료)

| # | 과제 | 배우는 Unity 기능 | 무료 리소스 |
|---|---|---|---|
| 1 | HUD를 UI Toolkit으로 교체 — **2026-11-25 클라우드 완료(Unity 화면 확인 전)**: 나침반·미니맵·목표 표시·피격 방향·킬 피드 | UXML·USS, 데이터 바인딩 | Unity 기본 |
| 2 | 총소리·발소리·피격음 — **1차(PC) + 2차 합성음(2026-11-25) 완료**, Unity 재생 확인 전 | AudioSource, AudioMixer 그룹 | Freesound CC0(웹 게임 v0.14 사운드 재사용) |
| 3 | 총구 화염·탄착 먼지 | VFX Graph 또는 Particle System | Unity 기본 |
| 4 | 하늘·조명 — **2026-11-25 클라우드 완료(Unity 화면 확인 전)**: HDRI 5종·웹 날씨 프리셋·번개·비·Bloom·SSAO | URP 후처리(Bloom·Tonemapping·SSAO), HDRI 스카이박스 | Poly Haven HDRI(CC0) |
| 5 | 지형·바닥 재질 | Terrain, PBR 머티리얼 | ambientCG / Poly Haven(CC0) |
| 6 | 병사 애니메이션 | Humanoid 리그, Animator, 리타깃 | Quaternius UAL / Rokoko 무료 모션 |
| 7 | 적 엄폐·측면 우회 — **Core 완료(2026-11-24)**: `Core/TacticsPlanner.cs` + 테스트 10개, `EnemyAgent` 연결(Unity 컴파일·플레이 확인 전) | NavMesh 쿼리, 엄폐 점수, 숨기·고개 내밀기 | 웹 게임 `enemies.js findCover/plan` 이식 |
| 7b | 수류탄 — **Core 완료(2026-11-25)**: `Core/Explosives.cs`, `Runtime/Grenade.cs`·`GrenadeThrower.cs` (Unity 확인 전) | Rigidbody·PhysicsMaterial, OverlapSphere, Linecast | 웹 `fx.js` 이식 |
| 8 | PlayMode 테스트 | 씬을 띄워 플레이어 이동·사격 자동 검증 | Unity Test Framework |
| 9 | Claude Code 에디터 실시간 제어 | Unity CLI `unity command eval` | `UNITY_CLAUDE_INTEGRATION.md` |

## 4. 현재 검증 상태 (정직하게)

| 부분 | 상태 |
|---|---|
| Core(무기·데미지·체력·AI 인지) | ✅ .NET 8에서 컴파일, NUnit **159개 통과**. 이 중 145개는 웹 JS 모델과 같은 숫자를 내는지 대조 |
| Runtime·Editor(MonoBehaviour, 씬 빌더) | ⚠️ **Unity에서 아직 컴파일하지 못함**(라이선스 미활성). 라이선스 후 `run-batch.ps1` 의 `slice` 단계가 첫 검증 |
| 플레이 감각(속도·반동·적 난이도) | ❌ 아직 사람이 플레이해 보지 않음 |
