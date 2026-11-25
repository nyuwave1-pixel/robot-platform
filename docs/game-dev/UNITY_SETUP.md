# Unity 설정 기록 (사용자 PC)

확인일 2026-11-19, PC Blender 세션.

## 설치 상태 (확인함)

| 항목 | 값 |
|---|---|
| 에디터 | `C:\Program Files\Unity\Hub\Editor\6000.6.9f1\Editor\Unity.exe` (시작 메뉴 `Unity 6000.6.9f1\Unity.lnk` 대상) |
| 버전 | `6000.6.9f1_8c45277fb9c5` (파일 버전 정보) |
| 모듈 | `Editor\Data\PlaybackEngines`: **WindowsStandaloneSupport**, **WebGLSupport** |
| Unity Hub | **설치 안 됨** (`C:\Program Files\Unity Hub\` 없음, `C:\Program Files\Unity\Hub\` 아래에는 Editor 폴더만 있음) |
| 라이선스 | **없음.** `Unity.exe -batchmode -quit -nographics -logFile <파일>` → 종료 코드 198, `No valid Unity Editor license found. Please activate your license.` (`Access token is unavailable`, `Found 0 entitlement groups and 0 free entitlements`) |
| Claude Code 연동 | Unity 공식 플러그인 스킬(`unity:unity-cli`, `unity:new-unity-project`, `unity:ui`, `unity:urp-postprocessing` 등)이 이 세션에 이미 로드되어 있음 → 별도 설치 불필요 |

## 사용자가 할 일 (라이선스 — Claude는 대신할 수 없음)

1. Unity Hub 설치: https://unity.com/download (공식 페이지에서 Windows용 Hub 다운로드).
2. Hub 실행 → 오른쪽 위 계정 아이콘 → **Sign in** (Unity ID 로그인은 본인이 직접).
3. Hub 왼쪽 아래 톱니바퀴(Preferences) → **Licenses** → **Add** → **Get a free personal license** (Unity Personal 조건 확인).
4. Hub → Installs → **Locate** 로 `C:\Program Files\Unity\Hub\Editor\6000.6.9f1\Editor\Unity.exe` 를 등록(다시 설치하지 않음).
5. 끝나면 이 세션에 "라이선스 활성화했어"라고 알려 주세요.

## 라이선스 이후 자동 진행 (준비됨, 아직 실행 못 함)

`apps/unity-studio/` (URP 프로젝트로 초기화될 폴더):
- `Assets/Editor/StudioBootstrap.cs`
  - `AddPackages`: Package Manager로 URP와 glTFast(`com.unity.cloud.gltfast`)를 추가합니다. 버전은 에디터가 결정합니다.
  - `ImportAndBuild`:
    - `apps/special-soldier/src/assets/assets.glb` 를 `Assets/Imported/` 로 복사합니다(git 제외, 원본은 한 곳).
    - glTFast로 임포트한 뒤 `Soldier`·`W_m4`·`W_bullpup`·`W_revolver`·`Heli`·`APC` 노드가 있는지 확인하고 삼각형 수를 로그에 남깁니다.
    - 테스트 씬 `Assets/Scenes/SoldierImportTest.unity` 를 저장하고 Windows x64 빌드를 1회 만듭니다.
- `run-batch.ps1`: init → packages → build 순서로 실행합니다. 로그는 `Logs/batch-*.log` 에 남기며 `[Studio]` 줄만 출력합니다.
- `.gitignore`: Library/ Temp/ Obj/ Build/ Builds/ Logs/ UserSettings/ 와 복사된 GLB, Asset Store 폴더를 제외합니다.

```powershell
powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1
```

**검증 로그: 아직 없음.** 라이선스가 없어서 프로젝트 초기화, 패키지 추가, 임포트, 빌드 모두 실행하지 못했습니다. 스크립트는 컴파일도 확인하지 못했습니다.

## Unity로 옮길 게임 제안 (제안만, 기존 웹 엔진은 그대로)

| 후보 | 이유 | 주의 |
|---|---|---|
| **SPECIAL SOLDIER 데스크톱판(파일럿)** | 이미 Blender → GLB 파이프라인이 있어 glTFast로 바로 들어옴. 스키닝·애니메이션(UAL CC0)·내비메시(Unity AI Navigation)·URP 후처리를 엔진 기본 기능으로 해결 가능 | 게임 로직(JS)은 C#으로 다시 써야 함 → 먼저 "에셋·씬 뷰어 + 이동/사격 프로토타입" 범위로 |
| 퍼즐 게임 | 규모가 작아 Unity 학습·빌드 파이프라인 검증에 적합 | 웹 버전이 이미 있으면 이식 이득이 작음 |
| 메디더마 라운지(WORLD PLAZA) | 3D 공간 탐색형이라 Unity 씬 편집 이점 | 웹 배포가 핵심이면 WebGL 빌드 용량 검토 필요 |

## 2026-11-22 업데이트 — 플레이 가능한 Island Slice 추가 (허브 세션)

- `run-batch.ps1` 단계: init → packages(URP·glTFast·Input System·AI Navigation·Test Framework, 입력 처리 Both) → build(GLB 임포트 테스트) → **slice**(씬 생성·NavMesh·URP·`Builds/Slice/IslandSlice.exe`) → **tests**(EditMode, `Logs/editmode-results.xml`).
- Core 규칙 코드와 테스트는 클라우드에서 .NET 8로 컴파일·실행 확인(159개 통과). **Runtime·Editor 스크립트는 Unity에서 아직 컴파일하지 못했습니다.**
- 설명·학습 순서: `UNITY_LEARNING_PATH.md`, `apps/unity-studio/README.md`.

## 2026-11-23 — 통합 환경 체크리스트 (`UNITY_CLAUDE_INTEGRATION.md` §2, PC 세션)

| 항목 | 결과 |
|---|---|
| Unity Hub | ❌ 미설치 |
| Unity Editor | ✅ 6000.6.9f1 (`find-tools.ps1` 로 탐색), 실행 중인 에디터 없음 |
| Unity 라이선스 | ❌ 없음 — `run-batch.ps1` init 단계 종료 198 (재확인) |
| Unity 프로젝트 | `C:\개발` 아래 `ProjectVersion.txt` 없음 → `apps/unity-studio` 는 첫 배치 실행 전(아직 초기화 안 됨) |
| Visual Studio | ❌ 없음(`vswhere` 없음) |
| VS Code | ❌ 없음 |
| .NET SDK | ❌ 없음 → `dotnet test "apps/unity-studio/CoreTests~"` 를 이 PC에서 못 돌림 |
| Git / GitHub | ✅ 2.55, 작업 브랜치 pull·push 가능 |
| Python / uv | Python 3.12 ✅ / uv ❌ (MCP for Unity 쓸 때만 필요) |
| Unity CLI (`unity`) | ❌ 없음 — 설치는 사용자 승인 후 |
| Package Manager / Console 오류 | 확인 못 함(프로젝트 미초기화·라이선스 없음) |

다음 단계는 그대로입니다: 사용자가 Unity Hub 설치 → 로그인 → Personal 라이선스 활성화 → PC 세션이 `run-batch.ps1` 전체 실행 → Unity CLI(승인 후).
선택 설치 후보(사용자 승인 필요): .NET 8 SDK(Core 테스트·IntelliSense), VS Code + C# Dev Kit.

## 2026-11-23 — 라이선스 해결, Unity 파이프라인·슬라이스 첫 검증 통과 (PC 세션)

**라이선스 문제의 원인**: 사용자 PC의 Unity Hub는 MSIX 패키지(`UnityHubSetup-x64.msix`, 11-19 설치)다. MSIX 앱은 AppData 쓰기가 가상화되어
라이선스가 `%LOCALAPPDATA%\Packages\UnityTechnologies.UnityHub_2vrhnee42bhxm\LocalCache\Local\Unity\licenses\UnityEntitlementLicense.xml` 에만 저장되고,
패키지 밖의 Unity Editor는 `%LOCALAPPDATA%\Unity\licenses\` 를 보므로 "No valid Unity Editor license"(198)가 났다. 활성화 자체는 11-19에 이미 되어 있었다.
**조치**: 그 파일을 `%LOCALAPPDATA%\Unity\licenses\` 로 복사 → Editor 라이선스 확인 통과(종료 0).
다른 PC에서는 MSIX 대신 **일반 설치판 Hub(.exe)** 를 쓰면 이 문제가 없다. MSIX Hub를 쓴다면 라이선스 갱신(다음 2026-12-19) 뒤 같은 복사가 다시 필요할 수 있다.
`find-tools.ps1` 의 `Find-UnityHub` 는 MSIX 설치(`Get-AppxPackage UnityTechnologies.UnityHub`)를 아직 찾지 못한다.

**`run-batch.ps1` 전체 결과** (Unity 6000.6.9f1, Windows 11):

| 단계 | 결과 |
|---|---|
| init | 종료 0 (첫 열기, URP 전역 설정 생성 경고만) |
| packages | URP 17.6.0 · glTFast 6.21.0 · Input System 1.20.1 · AI Navigation 2.0.16 · Test Framework 1.8.0, 입력 처리 Both |
| build | 첫 실행에서 **컴파일 오류 1종**: `SliceBuilder.cs` 의 `BodyPart` 가 `UnityEditor.BodyPart` 와 충돌(CS0104) → `using BodyPart = SpecialSoldier.Core.BodyPart;` 로 수정. 경고 4개(사용 중단 API `FindFirstObjectByType`·`FindObjectsSortMode`)도 `FindAnyObjectByType`·`FindObjectsByType<T>()` 로 교체 → **오류 0 · 경고 0**. GLB 노드 Soldier·W_m4·W_bullpup·W_revolver·Heli·APC 확인, 164 노드·104,528 tris, Windows 빌드 성공(107.8 MB, 171 s) |
| slice | URP 파이프라인 생성, 내비메시 구움, 병사 외형 = Blender GLB `Soldier`, `Assets/Scenes/IslandSlice.unity`(적 7), 플레이어 빌드 성공(104.5 MB, 오류 0) |
| tests | **EditMode 159/159 통과** (dotnet `CoreTests~` 도 159/159) |
| 실행 | `Builds\Slice\IslandSlice.exe` 창 모드 실행 → HUD(HOSTILES 7 · KILLS 0 · 시간), 조준선, 적 교전 상태 표시, 16초 동안 정상 동작. 화면: `docs/game-dev/screenshots/unity-island-slice-first-run.png` |

확인하지 못한 것: 키보드·마우스로 직접 이동·사격·적 처치·승패 화면(사람이 해 봐야 함). 지면 색이 매우 밝게(노랗게) 보여 조명·노출 조정이 필요해 보임.
Unity CLI(`unity`)는 아직 이 PC에 없음(설치 스크립트를 사용자가 다시 실행해야 함) → `unity command` 실시간 제어 왕복 테스트는 아직 못 함.

## 2026-11-23 (2) — 조명 수정, PlayMode 자동 플레이 테스트 추가

- **조명**: 프로젝트가 Gamma 색 공간이라 URP 화면이 노랗게 날아갔다 → `SliceBuilder` 가 Linear 색 공간으로 바꾸고, 전역 Volume(ACES 톤매핑, 노출 +0.3, 대비 +8)을 넣고, 태양 1.6 → 1.25, 모래색을 조금 어둡게. 전후: `screenshots/unity-island-slice-first-run.png` → `screenshots/unity-island-slice-lighting.png`(Blender 병사 모델이 보임).
- **PlayMode 테스트** `Assets/Tests/PlayMode/SliceSmokeTests.cs` — 실제 `IslandSlice` 씬을 Input System 테스트 장치(가상 키보드·마우스)로 플레이: 씬 부팅(적 7·전원 내비메시 위), **W 1초 → 전진**, **좌클릭 → 적 피해**, 적 전멸 → 승리, 플레이어 사망 → 패배. **5/5 통과**. `run-batch.ps1` 의 마지막 단계(`playtests`)로 추가.
  배치 모드에는 창이 없어 커서를 잠글 수 없으므로 `GameDirector.AssumeCursorCaptured`(테스트 전용)를 추가했다. 게임 실행 시 동작은 그대로.
  `Packages/manifest.json` 에 `"testables": ["com.unity.inputsystem"]` 추가(InputTestFixture 사용) — 그래서 Input System 패키지 자체 테스트 4개(2 통과, 2 건너뜀)도 함께 돈다.
- `find-tools.ps1`: MSIX(스토어) Unity Hub 탐지, `Get-MsixUnityLicence`. `setup.ps1 -Install` 이 MSIX Hub의 라이선스를 Editor 위치로 복사(항목마다 확인).
- 관찰: 시작 6초 만에 적이 교전 상태가 되고 HP 100 → 60. 직접 플레이해서 난이도(적 반응·명중) 조정이 필요한지 확인할 것.

## 2026-11-23 (3) 난이도·적 반응 이식

- 웹 게임의 `DIFFICULTY`(RECRUIT / REGULAR / VETERAN)를 `Core/Difficulty.cs`로 이식. 값은 `save.js`와 EditMode 테스트가 대조한다.
- 적이 전투에 들어가면 바로 쏘지 않고 반응 지연(`type.react × 난이도 × 0.7~1.3`, 소리로만 알면 ×0.6) 후 사격.
- 첫 1.2초 동안 탄퍼짐 ×1.8, 이동 중 ×1.6, 연사 간 휴식 0.7~2.0초 × 난이도, 피해 × 난이도 — 모두 웹 게임과 같은 규칙.
- 빌드 실행 시 `IslandSlice.exe -difficulty recruit|regular|veteran`로 난이도 지정(기본 REGULAR).
- 결과: EditMode 163/163, PlayMode 8/8(새 테스트 `Opening_EnemiesHesitateBeforeFiring`).
  시작 지점에 6초 가만히 서 있을 때 HP 60 → **100/100**(REGULAR).

## 2026-11-24 Unity CLI 설치 확인 — 미완료

- 설치 스크립트가 사용자 PATH에 `%LOCALAPPDATA%\Unity\bin` 을 추가했지만 **그 폴더가 없고 `unity.exe` 도 없음**(새 셸에서 `unity` 명령 없음).
  다운로드·압축 해제 단계에서 실패한 것으로 보임. 설치 스크립트를 다시 실행하고 출력(오류 줄)을 확인해야 함.
- 그래서 Pipeline 패키지 설치·`unity command` 왕복 테스트는 아직 못 함. 플러그인 스킬(`unity:unity-cli` 등)은 Claude Code 에 이미 로드돼 있어 `unity setup` 은 생략 가능.

## 2026-11-24 (2) Unity CLI · 에디터 실시간 제어 — 완료

- 사용자가 설치 스크립트를 다시 실행 → `%LOCALAPPDATA%\Unity\bin\unity.exe` **1.0.1** (새 셸에서 PATH 인식).
- `unity pipeline install --project-path apps/unity-studio` → `com.unity.pipeline` 1.0.1 이 `Packages/manifest.json` 에 추가.
- `unity open apps/unity-studio` → `unity status --until-ready` 로 `ready` 확인(포트 7800).
- 왕복 테스트(모두 `unity command ... --project-path apps/unity-studio`):
  1. `scene create --path Scenes/_CliRoundTrip --template default`
  2. `gameobject create --name CliCube --primitive cube`
  3. `script eval --file <cs>` → `CliCube at (1.00, 2.00, 3.00), scene roots 3, Unity 6000.6.9f1`
  4. `scene save` → 디스크의 .unity 파일에 `m_Name: CliCube`, `m_LocalPosition: {x: 1, y: 2, z: 3}` 확인
  5. `scene open --path Scenes/IslandSlice` → `gameobject find --type EnemyAgent` = 7개
  6. `asset delete --asset Assets/Scenes/_CliRoundTrip.unity --confirm` 로 임시 씬 삭제
- **알려진 문제**: 씬을 바꾼 뒤부터 `script eval` 이 `return 1+1;` 까지 `ROSLYN001 String conversion error: Illegal byte sequence` 로 실패.
  프로젝트 경로(`C:\개발\...`)의 한글이 원인으로 의심. 내장 명령은 정상. 재현되면 영문 경로 복제본에서 확인 후 `unity bug --area pipeline-package`(사용자 확인 후).
- PowerShell 에서 `--code '...'` 는 따옴표가 깨지므로 C# 은 `--file` 로 넘길 것.
- 에디터를 GUI로 처음 열면서 URP 기본값이 기록됨: `GraphicsSettings` 조명 선형 강도·색온도 켜짐, `QualitySettings` MSAA 2→4, `URPProjectSettings`·`PackageManagerSettings` 생성.
- 결론: `unity command` 왕복 테스트 성공 (BIT PARK feed 의 `claudeUnityLiveControl` 이 이 줄을 읽음).

## 2026-11-24 — 적 엄폐·측면 우회 AI (허브 세션, 클라우드)

- `Core/TacticsPlanner.cs`: 웹 `Enemies.findCover()`·`plan()` 이식. 병종별 행동 — 경계병 엄폐(Cover), 돌격병 전진(Push), 정예 측면 우회(Flank),
  중화기병 제압(Suppress), 저격수 고수(Hold). 체력 33% 미만이면 70% 확률로 한 번 후퇴하고 분대를 부름(80 m). 다른 적이 잡은 자리(1.6 m)는 피함.
  `PeekCycle`: 엄폐 중 숨기 0.9–2.7 s / 고개 내밀기 1.4–3.0 s, 숨은 동안 사격 안 함.
- `Runtime/EnemyAgent.cs`: 전투 중 판단 주기마다 반경 40 m의 정적 충돌체를 엄폐물로 모아 계획 → NavMesh 위로 스냅해 이동, 숨을 때 모델이 0.55 m 내려감.
- 검증: dotnet `CoreTests~` **173/173 통과**(새 테스트 10개 + PC 세션의 `DifficultyTests` 도 이제 Unity 없이 실행 — `UnityEngine.Application` 의존 제거).
  **EnemyAgent 변경은 Unity에서 아직 컴파일·플레이하지 않았습니다.**

## 2026-11-25 — 수류탄 (허브 세션, 클라우드)

- `Core/Explosives.cs`: 웹 `fx.grenade/explode`·`weapons.throwGrenade` 이식. 피해 170 → 반경 7.5 m까지 선형 감소, 1.5 m 밖에서 벽 뒤면 25%,
  자기 수류탄 60%. 플레이어 투척 = 시선 × 17 m/s + 위 4.5 m/s + 이동 속도(수평 투척 시 약 20 m), 퓨즈 2.8 s, 3개, 0.9 s 간격.
  적 투척(정예 `EnemyType.Grenades`) = 1.5 s 궤도 역산, 퓨즈 2.9 s, 9–34 m에서 플레이어가 숨었거나 시야에서 8 s 안에 사라졌을 때, 재계획마다 쿨다운 −3(14).
- `Runtime`: `Grenade.cs`(튀는 리지드바디, 반발 0.38, 폭발 시 시야 판정·소음 170 m, 임시 화염·조명 `ExplosionFade.cs`),
  `GrenadeThrower.cs`(G 키), `EnemyAgent` 재계획 때 투척, HUD에 남은 수류탄과 근처 적 수류탄 경고 "GRENADE! 2.1".
- 검증: dotnet `CoreTests~` **180/180**(새 테스트 7개, 웹 `fx.js` 상수와 대조 포함). **Runtime 변경은 Unity에서 아직 컴파일·플레이하지 않았습니다.**

## 2026-11-25 엄폐 AI · 수류탄 · 사운드/이펙트 · WebGL — Unity 첫 컴파일·검증

- 허브 커밋 6f56803(엄폐·측면 우회 AI)·a8d46b3(수류탄)를 PC Unity에서 처음 컴파일.
  오류 1건 수정: `EnemyAgent` 의 `GetInstanceID()` 가 Unity 6.6에서 **사용 금지(CS0619)** → 이름·위치 해시로 난수 시드.
  `PhysicsMaterial`·`PhysicsMaterialCombine`·`Rigidbody.linearVelocity` 는 그대로 컴파일됨.
- 사운드·이펙트(학습 과제 #2·#3): `Runtime/SliceFx.cs` — 총성(플레이어 2D·적 3D 위치음), 자갈 발소리, 총구 화염(점광원 0.05초),
  탄착 먼지·피격 불꽃 파티클, 잠입/전투 음악 교차 페이드. 소리는 웹 게임의 Freesound CC0 파일을 `Assets/Resources/Audio/` 에 복사(대장 갱신).
- WebGL: 내비메시가 메모리에만 있어 새 프로세스의 WebGL 빌드에서 적 7명 모두 `no valid NavMesh` → `Assets/Scenes/IslandSlice_NavMesh.asset` 로 저장해 해결(e609bb1).
  `run-batch.ps1 -WebGL` → `Builds/WebGL` 15.3 MB(Gzip). 로컬 서버에서 로드·HUD·적 이동·교전 확인.
  Claude 앱 내장 브라우저(숨김 창·자동 클릭)에서는 포인터 잠금이 걸리지 않아 이동·사격은 사람 확인 필요.
- 결과: EditMode **180/180**, PlayMode **10/10**(입력 패키지 자체 테스트 2개 생략). 새 PlayMode 테스트:
  `Combat_SentriesTakeCover_EliteFlanks`(8초 안에 경계병 엄폐 도착·정예 측면 목표), `Grenade_DroppedNextToEnemy_DamagesIt`,
  발소리·총성·탄착 횟수 확인. `LeftMouse_ShootsAndDamagesAnEnemy` 는 사격 소리에 표적이 엄폐로 숙여 머리 높이 탄이 빗나가므로 표적 AI를 정지시켜 총 피해만 검사.
- 시작 지점 6초 정지 시 HP 100/100(REGULAR) 유지.

## 2026-11-25 (2) WebGL 내비메시 경고 — 실제 원인과 수정

- 포털 세션 보고: WebGL에서 `Failed to create agent because there is no valid NavMesh` ×7 가 남아 있었음.
  앞서(e609bb1) "해결"로 적은 것은 **틀린 확인**이었다 — 콘솔을 패턴 필터로 읽어 결과가 비어 보였을 뿐, 경고는 그대로였다.
- 진짜 원인: WebGL 플레이어에서는 적의 `NavMeshAgent.OnEnable` 이 `NavMeshSurface.OnEnable`(구운 데이터 등록)보다 먼저 실행돼 에이전트가 영구히 내비메시 밖에 남음.
- 수정: SliceBuilder가 씬의 `NavMeshAgent` 를 **꺼진 상태로 저장**, `EnemyAgent.Start`(모든 OnEnable 이후)에서 켜고, 그래도 밖이면 `SamplePosition`→`Warp`, 실패 시 `[Enemy] ... still no NavMesh` 경고.
- 확인: 새 빌드(15.3 MB)를 캐시 우회로 열어 콘솔 전체(필터 없이) 확인 → 내비메시 경고 0건. 4초 간격 화면에서 적 위치 변화 확인. EditMode 180/180, PlayMode 10/10.

## 2026-11-25 (2) — 효과음 2차 (허브 세션, 클라우드)

- `Core/SfxSynth.cs`: 웹 `audio.js` 의 합성기(`nz`·`osc`, 선형 어택 + 0.0008까지 지수 감쇠, RBJ 바이쿼드 필터)를 오프라인 PCM으로 이식.
  레시피: reload(무기 재장전 시간 × 0.55에 두 번째 클릭), click, hit, kill, hurt, whiz, ui, impact(concrete·metal·wood·sand·flesh), explosion-body,
  무기 종류별 총성 몸통(ASSAULT RIFLE·SMG·SHOTGUN·LMG·SNIPER RIFLE·SIDEARM·SPECIAL·ENEMY — 녹음 층의 재생 속도·음량 포함).
- `Runtime/SliceFx.cs`(PC 세션 1차 위에 확장): 시작 시 합성음을 `AudioClip.Create` 로 한 번 생성. 무기별 총성(소음 권총은 녹음 없이 작게),
  수류탄 폭발 = CC0 녹음 + 합성 저음, 재장전·빈 탄창 딸깍·명중/사살 확인음·피격음, 머리 1.6 m 안을 스친 적 탄 'whiz', 표면별 탄착음
  (Ground=모래, Cover=나무 상자, 벽=콘크리트), 교전 중 원거리 전투 배경(`battle.mp3`, 0.18).
- CC0 `explosion.mp3`·`battle.mp3` 를 `Assets/Resources/Audio/` 에 추가(대장: `apps/special-soldier/docs/ASSET_LICENSES.md`).
- 검증: dotnet `CoreTests~` **199/199**(새 SfxSynth 테스트 19개 — 웹 `audio.js` 의 총성 표와 수치 대조 포함). **Unity 재생은 아직 확인하지 않았습니다.**

## 2026-11-25 (3) — 미션 목표·결과 등급·포털 보고 (허브 세션, 클라우드)

- `Core/Mission.cs`: 웹 `missions.js`·`main.js` 이식. 목표 종류 Kill(그룹)·Reach·Interact(길게 누르기, 손 떼면 처음부터)·Defend(카운트다운)·Any(순서 무관, v0.20).
  `MissionStats` 등급 = 정확도(45%↑ 2점, 25%↑ 1점) + 경보(0회 2, 1회 1) + 사망(0회 2, 1회 1) + 헤드샷 30%↑ 1 → 7 S / 5 A / 3 B / C, 포털 RP 60/45/30/15, 사살 점수(헤드샷 ×1.5).
- 슬라이스 미션 "SLICE 01": ① 순서 무관 — 콤파운드 소탕(돌격병 2 + 중화기병, group `compound`) + 콤파운드 안 정보 단말기에서 [E] 3초 다운로드 ② 북쪽 탈출 지점(반경 8 m) 도착.
  적을 다 쓰러뜨려도 정보·탈출 전에는 끝나지 않음. HUD 상단에 목표 줄, 단말기 근처에서 "HOLD [E]" 진행 막대, 결과 화면에 등급·시간·사살(헤드샷)·정확도·경보·점수·포털 RP.
- 경보: 전투 상태로 5초 버틴 적의 그룹당 1회(웹 callT 근사). 통계: 사격·명중(발사당), 플레이어 헤드샷 사살.
- WebGL에서 끝나면 `Plugins/WebGL/PortalBridge.jslib` 가 부모 페이지에 웹 게임과 같은 `game_result` 메시지를 보냄(`game: special-soldier-unity`, `engine: unity`).
- PC 세션의 PlayMode `KillingEveryEnemy_Wins` → `MissionFlow_ClearCompound_DownloadIntel_Extract_WinsWithGrade` 로 교체(새 규칙에 맞춤).
- 검증: dotnet `CoreTests~` **212/212**(미션 테스트 13개, 웹 `main.js` 등급 공식 문자열 대조 포함). **Unity 컴파일·PlayMode는 아직.**

## 2026-11-25 (4) — 하늘과 조명 (허브 세션, 클라우드)

- **HDRI 하늘 5종**(Poly Haven CC0, 1K, MD5 검증): `Assets/Resources/Sky/sky_{day,dawn,storm,dusk,night}.hdr`, 받기 `Tools~/fetch-hdris.mjs`.
- `Core/SkyPresets.cs`: 웹 `sky.js` 프리셋 5종(night·dawn·storm·facility·dusk) 그대로 + 슬라이스용 맑은 낮(day). 하늘·안개·햇빛 색·세기·방향·비·바람·폭풍·노출.
  web→Unity 축 변환(z 반전), 노출 → URP Post Exposure(EV = log2), FogExp2 → ExponentialSquared(같은 공식), 전환은 웹처럼 `min(1, dt × 0.6)`.
  번개 `LightningClock`: 첫 번개 6 s, 이후 5–17 s, 섬광 5/s 감쇠·두 번 깜빡임, 천둥 0.3–1.8 s 뒤(합성음 `thunder` 추가).
- **HDRI 노출 자동 보정**: HDRI마다 촬영 밝기가 달라(중앙값 day 0.35 ~ storm 1.49) 노출 1로 두면 폭풍·해 질 녘·밤이 하얗게 뜸 —
  `HdriExposure` = 웹 프리셋 하늘 그라디언트의 선형 휘도 ÷ HDRI 중앙값(day 1.33, dawn 0.31, storm 0.05, dusk 0.13, night 0.023).
  톤매핑한 대조 이미지로 눈 확인: `docs/game-dev/screenshots/unity-sky-presets-hdri.jpg`, 도구 `Tools~/hdri-preview.py [--stats]`.
- `Runtime/SkyDirector.cs`: 하늘(Skybox/Panoramic + HDRI), 해 방향·색·세기, 안개, 하늘 기반 환경광(`DynamicGI.UpdateEnvironment` 0.5 s 간격), 노출,
  비 파티클(비 양 × 2600/s, 바람 방향), 번개 섬광·천둥. 선택: 실행 인자 `-sky dusk`, WebGL 주소 `?sky=dusk`, 게임 중 **[K]** 순환. HUD 오른쪽 위에 날씨 라벨.
- `SliceBuilder`: `Settings/Sky_Panoramic.mat`(빌드에서 셰이더 유지), Sky 오브젝트, 후처리 Bloom(임계 1.0·0.55)·Vignette 0.22·채도 +6, URP SSAO 렌더러 기능(리플렉션으로 추가 — 없으면 건너뜀).
- 검증: dotnet `CoreTests~` **230/230**(하늘 테스트 15개, `sky.js` 수치 대조 5개 포함). **Unity 화면은 아직 확인하지 않았습니다.**

## 2026-11-25 (5) — UI Toolkit HUD (허브 세션, 클라우드)

- `Core/HudModel.cs`: 웹 `hud.js` 이식 — 나침반 방위(0 = 북 +Z, 시계 방향), 나침반 띠 위치(±90°), 8방위, 미니맵 투영(반경 70 m, 플레이어 방향이 위,
  목표는 테두리 R−10 에 고정), 인지 단계(HIDDEN / SUSPICIOUS 0.3 / DETECTED 0.75 / COMBAT · N ENGAGING), 조준선 간격 4 + 탄퍼짐 × 7,
  레이더 표시(사격 후 2.5 s), 피격 방향 호 1.6 s, 킬 피드 5줄·4.5 s.
- `Runtime/HudToolkit.cs`(UIDocument + 코드로 만든 화면, 스타일 `Assets/UI/SliceHud.uss`, 테마 `Assets/UI/SliceTheme.tss`, 패널 `Settings/SliceHudPanel.asset` 1920×1080 기준):
  위 가운데 나침반(목표 방향 노란 삼각형) + 방위 숫자, 왼쪽 위 인지 막대·목표·적/사살/시간, 오른쪽 위 날씨·회전 미니맵(N 표시)·킬 피드,
  왼쪽 아래 체력·방어구·수류탄, 오른쪽 아래 탄약·무기·모드·슬롯, 가운데 동적 조준선·명중 X(헤드샷 노랑, 사살 빨강)·피격 방향 호·재장전 막대·
  [E] 진행 막대·수류탄 경고(11 m), 월드 목표 표시(거리, 뒤에 있으면 아래쪽), 번개 섬광, 결과 화면(등급).
- 연결: EnemyAgent.LastFireTime, WeaponController.LastHitWasHead(명중 표시 0.22 s로 웹과 맞춤), GameDirector.EnemyKilled 이벤트. IMGUI `Hud.cs` 는 씬에서 빠지고 예비로 남음.
- 검증: dotnet `CoreTests~` **242/242**(HUD 테스트 12개, `hud.js` 상수 대조 포함). PlayMode `HudTests.cs` 2개 추가. **Unity 화면은 아직 확인하지 않았습니다.**

## 2026-11-25 (6) — PC 첫 컴파일: 효과음 2차·미션·하늘·UI Toolkit HUD (PC Unity 세션)

- 허브 커밋 e0974f6(효과음 2차)·e544ebd(미션)·6b7e79c(하늘)·8ab6049(UI Toolkit HUD)를 한 번에 `run-batch.ps1 -WebGL`.
  **컴파일 오류 0**(네 묶음 모두 수정 없이 컴파일 — `Painter2D.Arc`·`Angle.Degrees`·`RuntimePanelUtils.CameraTransformWorldToPanel`·`Rotate` 이름 그대로).
- 결과: EditMode **242/242**, PlayMode **12/12**(입력 패키지 자체 테스트 2개 생략) — 새 `Hud_ShowsObjectiveCompassAndAmmo`·`Hud_KillFeedListsAKill`,
  `MissionFlow_..._WinsWithGrade`(`[Portal] special-soldier-unity SLICE 01 B score 0 rp 30`), 시작 지점 6초 정지 HP 100/100.
  슬라이스 로그 `[Slice] HUD: UI Toolkit (panel ok, style ok, theme ok)`. exe 110.6 MB, WebGL 18.7 MB.
- 중복 작업: PC 세션도 같은 시간에 UXML 기반 UI Toolkit HUD를 만들었으나(푸시 전) 허브의 `HudToolkit` 이 기능이 더 많아 PC 쪽을 버림.
  다음부터는 두 세션 모두 시작 전에 STUDIO_HUB "작업 중" 표에 먼저 적기로 함.
- **WebGL에서 찾은 문제 2개와 수정**
  1. 글리프: 기본 런타임 글꼴에 `✓ ○ ◎ ▸ ▶` 가 없어 빈칸으로 보임 → `HudToolkit.AsciiGlyphs` 가 화면에 쓸 때만 `[x] [ ] HEADSHOT > >` 로 바꿈
     (목표 줄·킬 피드; Core 문구는 웹과 동일 유지). `° · —` 는 정상 표시 확인.
  2. **HiDPI에서 HUD가 화면 밖으로**: Windows 125 % 배율(devicePixelRatio 1.25, 캔버스 1600×950 / CSS 1280×760)에서 UI Toolkit 패널이
     한 번 더 1.25배 확대돼 오른쪽·아래(미니맵·체력·무기)가 잘리고 나침반이 오른쪽으로 치우침(`screenshots/unity-hud-webgl-dpr125-overflow.jpg`).
     `config.devicePixelRatio = 1` 로 같은 빌드를 열면 전부 맞음 → `SliceBuilder.BuildWebGL` 이 빌드 뒤 `index.html` 에서 이 줄을 켜도록 함
     (`PinWebGLPixelRatio`). HiDPI 화면에서 3D가 조금 덜 선명한 대신 그리기 부담이 줄어듦.
- 글자 대비: 낮 HDRI 하늘이 거의 흰색이라 위쪽 글자가 잘 안 보여 `SliceHud.uss` 의 `.hud-text` 외곽선 0.6→0.85, 그림자 추가.
- **하늘 5종 화면**(WebGL, [K] 순환, 1280×760): `screenshots/unity-sky-{day,dawn,storm,dusk,night}.jpg`, HUD 전체 `unity-hud.jpg`.
  - day·dawn: 자연스러움(dawn 가벼운 비). 비 파티클·[K] 순환·날씨 이름 표시 정상.
  - **storm·dusk·night: 하늘 돔이 거의 검은색인데 땅은 밝게 비춰짐**(storm 은 "09:10 DAY"). `HdriExposure`(storm 0.05, dusk 0.13, night 0.023)가
    웹의 어두운 하늘 그라디언트에 맞춘 값이라 의도일 수 있으나, 햇빛·환경광과 균형이 안 맞아 보임 → 허브에 조정 요청(`SkyPresets`, PC는 값 미변경).
  - 번개 섬광·천둥은 화면 캡처 간격(7 s) 안에 잡히지 않아 **미확인**. SSAO 셰이더 변형은 빌드 로그에 포함 확인.
- 여전히 사람 확인 필요: 포인터 잠금 이동·사격, 소리 크기 균형(합성음·총성·천둥), 번개.

## 2026-11-25 (6) — 적 인지 웹 일치 + 하늘 노출 재보정 (허브 세션)

- **적 인지(웹 `enemies.js` 그대로)**: 안 보이면 인지값 초당 −0.18(전투 중에도) — 이전의 슬라이스 전용 0.12 감쇠·0.6/0.2 리셋 제거.
  시야 거리 = 기본 × (1 − 밤×0.5) × 자세(서기 1 / 웅크림 0.72 / 엎드림 0.5) × 난이도 × 경계 1.25 × 손전등 1.5 × (1 − min(0.3, 비×0.2)), 전투 중 최소 90 %.
  `EnemyAgent` 가 현재 하늘의 밤·비 값과 플레이어 자세를 넣음(`VisionNow`). 예: 경계병 맑은 낮 72 m → 밤에 웅크리면 26 m.
- **하늘 노출 재보정(PC 세션 WebGL 스크린샷 피드백)**: 웹 그라디언트 밝기에 직접 맞춘 값(storm 0.05·night 0.023)은 Unity에서 하늘이 거의 검게 나오고
  땅은 밝게 비춰졌음 → `Mood`(낮 대비 하늘 밝기: day 1, dawn 0.75, storm 0.45, dusk 0.55, night 0.12)로 바꿈.
  `HdriExposure` = 낮 하늘 휘도 × Mood ÷ HDRI 중앙값(day 1.33, dawn 0.61, storm 0.14, dusk 0.27, night 0.12), 해/달 세기 × `LightScale`(0.4 + 0.6 × Mood).
  새 대조 이미지 `docs/game-dev/screenshots/unity-sky-presets-hdri.jpg`. **Unity WebGL에서 다시 확인 필요.**
- 검증: dotnet `CoreTests~` **249/249**.

## 2026-11-25 (7) — 설정·일시정지 메뉴 (허브 세션, 클라우드)

- `Core/GameSettings.cs`: 웹 `save.js` DEFAULT_SETTINGS·`menu.js` 슬라이더 이식 — 시야각 60–100(78), 마우스 감도 0.2–3(1, 0.05 단위), 전체 음량·음악 0–1(0.7·0.5),
  Y 반전, 난이도, (슬라이스 추가) 날씨. 단위에 맞춰 반올림·범위 제한, 저장 JSON이 깨지거나 모르는 값이면 기본값.
  시점 속도 = 웹 0.0022 rad/px × 감도, 조준경 줌 때 ÷ lerp(1, 배율, 0.75).
- `Runtime/SettingsStore.cs`: PlayerPrefs(WebGL은 브라우저 저장소)에 저장, 변경 이벤트. 테스트는 `UseDefaultsForTests()` 로 저장값 영향 없음.
- `Runtime/PauseMenu.cs` + `Assets/UI/PauseMenu.uss`: **Esc** 로 열고 닫음(게임 정지, 소리 정지). 시야각·감도·Y 반전·전체 음량·음악 슬라이더,
  난이도(다음 재시작부터, 안내 문구), 날씨 5종(즉시), 재개·미션 재시작, 조작 키 안내. WebGL에서 브라우저가 Esc로 마우스 잠금을 풀면 자동으로 메뉴가 열림.
- 적용: PlayerMotor(감도·Y 반전), WeaponController(시야각), SliceFx(전체 음량·음악), SkyDirector(저장된 날씨, [K] 순환은 저장 안 함),
  GameDirector.CurrentDifficulty(코드 지정 → `-difficulty` → 저장값 순, 지연 평가).
- 검증: dotnet `CoreTests~` **253/253**(설정 테스트 4개, 웹 기본값·슬라이더·시점 공식 대조). PlayMode `PauseMenuTests` 2개 추가, 기존 PlayMode 테스트는 기본 설정으로 고정.
  **Unity 컴파일·화면은 아직 확인 전.**
