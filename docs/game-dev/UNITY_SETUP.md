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

## 2026-11-25 (8) — 공용 섬 지형: 웹판과 Unity판이 같은 섬 (허브 세션, 클라우드)

- **웹**: `src/world/world.js` 의 섬 공식(rawHeight·FLATS·SIZE)을 three.js 없는 `src/world/terrain.js` 로 옮김(+ `splatAt`). `world.js` 는 그대로 다시 내보냄 →
  hud.js·build.js 등 기존 import 영향 없음. 이전 공식과 121×121 = 14,641점 **높이 완전 동일** 확인. 새 `tests/terrain.test.mjs`, 웹 `npm test` **22/22**.
- **Unity**: `Core/IslandTerrain.cs` — 웹 terrain.js·util.js(hash·noise2·fbm·smooth) 줄 단위 이식. 웹 모듈에서 만든 픽스처(`Tools~/gen-terrain-fixture.mjs`)와
  609점 높이(오차 < 1e-9 m)·153점 재질 배합·노이즈(비트 단위) 일치. `HeightGrid` 로 Unity Terrain 높이맵.
- `SliceBuilder.BuildIsland`: 섬 전체(1.2 km) Terrain — 높이 513², 재질 배합 512²(모래·풀·바위·콘크리트, 웹 CC0 사진 텍스처를 빌드 때 복사, 타일 2.5 m),
  바다(섬 높이 0). 슬라이스는 섬 기지 평지(16 m) 가운데 — 월드 (0,0,0) = 섬 (0, 16, −95), 벽 안은 전부 평지. NavMesh는 경기장 190 m 범위만.
  평평한 Ground 판은 섬이 없을 때만 예비로.
- 지도: `docs/game-dev/screenshots/island-terrain-shared.png`.
- 함께 고친 것: 내 하늘 커밋이 Unity 전용 HDRI 행을 웹 대장에 넣어 웹 크레딧 테스트가 실패하던 문제 → Unity 전용 대장 `apps/unity-studio/ASSET_LICENSES.md` 로 이동.
- 검증: dotnet `CoreTests~` **258/258**. **Unity 지형 화면은 아직 확인 전.**

## 2026-11-25 (9) — 공용 섬 식생 + 좌표 거울상 수정 (허브 세션, 클라우드)

- **웹**: 나무·야자수·바위·고사리 배치를 `src/world/vegetation.js` 로 분리하고 **자체 시드(VEG_SEED)** 로 바꿈. 전에는 기지 건설 전체가 쓰는 난수를
  이어 써서 앞에 소품 하나만 추가해도 섬의 모든 나무가 뒤섞였고 브라우저 밖에서 재현할 수 없었음. 규칙·밀도는 그대로(나무 1,565·야자수 221·바위 176·고사리 3,992),
  **웹의 나무 위치는 이번에 한 번 바뀜**. `World` 의 높이 격자·보간도 `terrain.js`(gridHeights·heightAtGrid)로 옮겨 공유. 웹 `npm test` 26/26.
- **Unity**: `Core/IslandVegetation.cs`(mulberry32 비트 단위, Float32 격자 보간, 배치 규칙) — 웹 모듈에서 만든 픽스처와 개수·합계·샘플 전부 일치.
  `SliceBuilder.BuildVegetation`: GLB의 Blender Tree·Palm·Rock 모델을 160 m 칸·재질별로 합친 메시(WebGL 그리기 호출 절약, 생성 파일은 `Assets/Imported/Vegetation`, 커밋 안 함). 고사리는 아직 제외.
- **좌표 거울상 수정**: 지형 커밋에서 섬 좌표를 Unity에 그대로 옮겨 Unity 섬이 웹 섬의 거울상이 될 뻔했음(three.js 오른손 좌표 ↔ Unity 왼손 좌표).
  `IslandTerrain.ToWorld/ToIsland` 로 z 반전(하늘의 해 방향과 같은 규칙), 지형 높이·재질·식생 모두 이 변환을 사용. 테스트 추가.
- 지도 갱신: `docs/game-dev/screenshots/island-terrain-shared.png`. dotnet `CoreTests~` **266/266**. **Unity 화면 확인 전.**

## 2026-11-25 (10) — 캠페인 미션 01 SILENT LANDING 이식 (허브 세션, 클라우드, U4)

- **같은 미션 정의**: `Core/Campaign.cs` 에 웹 `missions.js` MISSIONS[0] 을 옮김 — 보초 9명의 위치·순찰로·방향·그룹, 플레이어 시작점(해변 0, 328.5),
  밤 하늘, 경보 무전, 증원(QRF) 3명, 목표 2개(해변 보초 전멸 → 정글 길 입구 도달). `CampaignTests` 가 missions.js 를 직접 읽어 숫자를 대조(웹을 바꾸면 실패해 알려 줌).
- **경보 규칙 웹과 일치**: 교전 5초를 버틴 적이 증원을 부르면 경보는 **미션당 1번만** 셈(`MissionRunner.RaiseAlarm`, 웹 `flags.alarm`). 전에는 분대마다 셈.
  첫 경보에 무전 줄(HUD, 6초)과 꺼져 있던 증원 3명이 켜져 플레이어 위치로 옴(`GameDirector.OnAlarm`).
- **씬 생성**: `SliceBuilder.BuildCampaignScene` → `Assets/Scenes/Mission01.unity`(공용 섬 + 식생, 미션 구역만 NavMesh, 섬 좌표 → `IslandTerrain.ToWorld`, 웹 각도 → `WebAngles`).
  하늘·HUD·일시정지 구성은 두 씬이 같은 함수(`BuildSkyRig`, `BuildDirectorRig`)를 씀. 메뉴 `Special Soldier > Build Campaign Mission Scenes`.
- **열기**: 플레이어 빌드는 빌드 목록의 모든 씬을 넣음(Island Slice가 첫 씬). `SceneRouter` 가 `-mission m01`(명령줄)·`?mission=m01`(WebGL 주소)로 미션 01을 엶.
- 아직 없는 것: 감시탑·레이더·모래주머니 초소·보트(저격수는 탑 대신 땅에서 자리를 지킴), 브리핑 화면. dotnet `CoreTests~` **275/275**. **Unity 컴파일·화면 확인 전.**

## 2026-11-25 (11) — 병사 애니메이션: Quaternius UAL(CC0) + 웹 절차 포즈 (허브 세션, 클라우드, U3)

- **에셋**: Quaternius Universal Animation Library [Standard] — itch.io 공식 무료 받기(가격 0, 결제 없음), 팩 안 `License.txt` 와 itch 페이지 모두 CC0.
  `Assets/ThirdParty/Quaternius/UAL/UAL1_Standard.fbx`(23.8 MB, 동작 43개, 루트 모션 없는 판)를 커밋. 다시 받기·검증: `node apps/unity-studio/Tools~/fetch-ual.mjs`(SHA-256). 대장: `apps/unity-studio/ASSET_LICENSES.md`.
  Standard 판에는 **소총 동작이 없음**(권총·근접·구르기 등). 그래서 다리·몸통·머리만 UAL을 쓰고 소총 팔은 웹 규칙으로 움직임.
- **방식**: 게임 병사는 스킨 메시가 아니라 관절별 단단한 부품(body·legL/R·shinL/R·upper·arms·head, 웹과 같은 리그). 적마다 보이지 않는 UAL Humanoid 마네킹(`Rig`)이
  Animator로 동작을 재생하고, `Runtime/SoldierAnimator` 가 뼈가 쉬는 자세에서 회전한 만큼을 부품에 옮김(엉덩이→body, 허벅지→legL/R, 종아리→shinL/R, 가슴→upper, 머리→head).
  컨트롤러는 코드로 생성(`Editor/Slice/SoldierAnimBuilder.cs` → `Assets/Animation/Soldier.controller`): 속도×웅크림 2D 블렌드(Idle·Walk·Jog·Sprint·Crouch Idle/Fwd), 피격(가슴·머리), 사망(Death01).
  import 설정은 Quaternius Unity 안내 그대로(Bake Axis Conversion, Humanoid, `_Loop` 반복).
- **UAL이 없을 때**: `Core/SoldierPose` — 웹 `models.js` poseSoldier 와 `enemies.js` 걸음 갱신을 그대로 옮김(`Tools~/gen-pose-fixture.mjs` 가 웹 함수 원문을 실행해 만든 93개 자세·10개 걸음 표본과 1e-12 이내 일치).
  소총 조준(목표 쪽 ±0.6 rad, 평소 −0.25)·사격 반동은 두 방식 모두 이 규칙.
- **게임 연결**: `EnemyAgent.WantsCrouch`(엄폐 숨기 + 후퇴 지점 도착, 웹 규칙) → 웅크림, 피격 부위 → Hit_Chest/Hit_Head, 사망 → Death01. 예전 대체 동작(모델 0.55 m 가라앉기, 사망 시 −80° 넘어뜨리기)은 애니메이터가 없을 때만.
- 테스트: dotnet `CoreTests~` **281/281**(포즈·걸음 웹 대조, 클립 선택, 필요한 클립 9개가 FBX 안에 있는지). PlayMode `SoldierAnimTests` 2개 추가(PC). **Unity 컴파일·화면 확인 전** —
  뼈 방향 가정(마네킹·병사 모두 +z를 봄, glTFast x축 반전)이 틀리면 `pitchSign`·`rigYaw` 로 조정.

## 2026-11-25 (12) — WebGL 크기: 식생을 GPU 인스턴싱으로 (허브 세션, 클라우드)

- PC 측정(88ad854 빌드 리포트): WebGL 33.6 MB, 비압축 사용자 에셋 73.3 MB 중 **메시 55.7 MB(76%)** — 거의 다 식생 칸별로 합친 메시(칸 하나 1~3 MB).
  나무마다 정점을 복사해 합쳤기 때문. 지형 텍스처는 작음. Unity 로고 스플래시 2.7 MB.
- 수정: `Runtime/InstancedVegetation` 이 모델 메시는 한 번만(GLB 그대로), 나무마다 변환 행렬 하나(64바이트, 전체 약 125 KB)로 `Graphics.RenderMeshInstanced` 로 그림.
  160 m 칸, 카메라 시야 밖·420 m 밖(안개 끝 240 m) 칸은 건너뜀, 그림자는 화면 밖 40 m 까지. 기울기·크기·위치는 웹 배치 그대로. 재질은 인스턴싱을 켠 복사본(`Assets/Imported/Vegetation`, 커밋 안 함).
- `BuildWebGL`: `PlayerSettings.SplashScreen.show = false`(Unity 6 Personal 허용).
- 예상: 식생 메시 55.7 MB → 1 MB 미만. **PC 측정 전.** PlayMode `VegetationTests` 추가.

## 2026-11-25 (13) — 미션 01 해변 구조물 (허브 세션, 클라우드, U4)

- `Core/IslandProps.cs`: 웹 `src/world/build.js` 의 소품 함수(sandbags·crate·barrel·ammoBox·lamp·tower·radar·building)와 `world.js` walls 를 옮김.
  해변 구역: 모래주머니 6, 나무 오두막(문은 바다 쪽), 감시탑 2(저격수 탑 10, 284), 해안 레이더, 상자 3·드럼통 2·탄약 상자, 불 켜진 가로등 2, 대전차 장애물 9(mulberry(1337) 순서까지 같음).
- 대조: `Tools~/gen-props-fixture.mjs` 가 **웹 build.js 해변 부분 원문을 그대로 실행**해(가짜 world 에 호출 기록) 50개 호출을 픽스처로 씀 → C# 이 같은 순서·같은 값(1e-9)으로 만드는지 테스트.
  웹 `top(x, z)`(world.groundAt) 도 옮겨서 저격수가 서는 탑 갑판 높이 10.913 m 일치.
- Unity: `BuildCampaignScene` 이 GLB의 Blender 모델(Watchtower·Radar·LampPost·Hedgehog·P_sandbags·P_crate·P_barrel·P_ammo·P_wall_wood·P_roof)을 웹 위치·크기로 놓고,
  웹과 같은 상자 충돌체(이름으로 탄착음 재질 구분), 가로등 점광원, 레이더 접시 회전(`Runtime/Spinner`). 미션 씬 NavMesh 는 충돌체 기준으로 구워 탑 갑판도 걸을 수 있는 면 → 저격수가 탑 위에서 지킴.
- dotnet `CoreTests~` **284/284**. **Unity 화면 확인 전**(다음 묶음).

## 2026-11-25 (14) — 미션 02 DEEP JUNGLE 이식 (허브 세션, 클라우드, U4)

- **미션 진행기 확장(`Core/Mission.cs`)**: 목표마다 무전(radio), 시작 훅(OnStart), 완료 훅(OnDone), 사용자 조건(Custom, 예: 폭발 지점에서 30 m 벗어나기),
  미션 플래그, 증원 요청(WaveRequested), 스크립트 이벤트(EventRaised "detonate"). 웹 advance() 순서 그대로(이전 목표 done → 다음 목표 start → radio).
- **미션 02 데이터(`Core/Campaign.cs` M02)**: 순찰 A·B, 통신소 수비대(탑 위 저격수 포함), 발전기 초소, 목표 5개(침투 → [통신소 소탕 / 발전기 차단] 순서 자유 → C4 설치 → 30 m 이탈·폭파 → 역습 격퇴).
  발전기를 통신소보다 먼저 끊으면 역습이 3명, 아니면 5명(웹 powerCut). 경보 시 순찰조가 플레이어 위치로 수색.
- **웹 대조 강화**: `Tools~/gen-campaign-fixture.mjs` 가 **missions.js 미션 객체를 그대로 실행**해 setup() 배치, 목표, 상호작용 지점, 경보·시작·완료 훅의 무전·증원·플래그를 모든 경우로 기록 →
  `CampaignParityTests` 가 M01·M02 대조(이 과정에서 M01 의 빠진 무전 "COMMAND: Beach is secure…" 를 찾아 고침).
- **정글 구조물(`Core/IslandProps` Jungle·GenOutpost)**: 통신소 건물·콘솔·중계 철탑(Blender CommsTower, 30 m 충돌체는 설 수 없음)·발전기·모래주머니·탑·가로등, 발전기 초소 — 웹 원문 실행 결과와 39개 호출 일치.
- **Unity**: 이름 붙은 증원(꺼진 채로 씬에 배치, `GameDirector.SendWave`), 폭파 시 폭발 3번 + 철탑 넘어짐(웹 컷신 대신), 경보 수색. `Mission02.unity` 는 `Campaign.All` 로 자동 생성, `?mission=m02`.
- dotnet `CoreTests~` **294/294**. PlayMode `Mission02Tests` 2개 추가. **Unity 확인 전**(그다음 묶음).


## 2026-11-25 (7) — 하늘 재보정·일시정지 메뉴·섬 지형/식생·두 에디션 연결 (PC Unity 세션)

- **하늘 재보정(fd35aa7)**: WebGL storm 화면에서 회색 구름이 보이고 땅 밝기와 맞음(전에는 검은 돔). 
- **일시정지 메뉴(dd25198)** 첫 컴파일: `PauseMenuTests` 의 `KeyControl` using 누락(CS0246) 수정, 마스터 볼륨이 첫 소리 전엔 적용 안 되던 문제
  (`SliceFx` 가 첫 소리 때 생성) → `SettingsStore.Edit` 에서 `AudioListener.volume` 설정. PlayMode 14/14.
- **run-batch.ps1**: `Start-Process -Wait` 가 Unity가 남기는 VBCSCompiler 서버까지 기다려 init 후 ~10분 멈춤 → Unity 프로세스만 `WaitForExit`.
- **섬 지형(eb0335f)·식생(88ad854)**: `[Slice] island terrain 513² heights (-7.0..31.8 m) … ground at slice origin y = 0.00`,
  `vegetation: 1565 trees, 221 palms, 176 rocks → 123 merged meshes`. EditMode 269/269, PlayMode 14/14. WebGL 벽 너머 나무·모래 텍스처 확인.
  **WebGL 18.7 → 33.6 MB**: Build Report 비압축 Meshes 55.7 MB(76 %, 식생 합친 메시 칸당 1–3 MB), Textures 12.9 MB(스플래시 로고 2.7 MB 포함)
  → 허브가 GPU 인스턴싱·스플래시 끄기로 수정(e3c2443): `vegetation … → instanced: 3 models (6 mesh parts, 6 instancing materials), 65 cells`.
- **두 에디션 연결**(docs/game-dev/EDITIONS_ROADMAP.md): 클래식 PLAY MODE → 유니티판(?difficulty=&return=) → 일시정지 CLASSIC EDITION → 클래식, 브라우저 왕복 확인.
  WebGL에서 찾은 문제 2개 수정(e509344): ① 주소 난이도가 매번 설정을 덮어써 일시정지 메뉴가 REGULAR로 보이고 못 바꿈 → 저장 설정에 1회 반영,
  ② 포인터 잠금 거부 promise 가 Unity 오류 alert 를 띄움(게임은 계속 진행) → index.html 에서 그 rejection 만 삼킴.
  주의: 캔버스를 CSS로 늘리면 UI Toolkit 클릭 좌표가 어긋남(검증용 늘림에서만 발생, 실제 페이지 아님).
- 일시 오류: Windows 빌드 단계에서 `[CoreBusinessMetrics] … SQLite "disk I/O error"`(디스크 670 GB 여유) — 다른 프로젝트 Unity가 같은 캐시를 쓰던 때, 재실행으로 해결.
- **미션 01(4027b57)·병사 애니메이션(5997b22)**: `MISSION 01 SILENT LANDING: scene saved … 9 enemies + 3 QRF, sky night`,
  `soldier animation: controller ok Assets/Animation/Soldier.controller (9 UAL clips)`, `animation: Quaternius UAL rig`, Humanoid 아바타 경고 없음.

## 2026-11-25 (15) — 미션 03 BLACK COBRA BASE + 장갑차 (허브 세션, 클라우드, U4)

- **기지 구조물(`Core/IslandProps.Base`)**: 외벽(남·북·동 문), 모서리 저격탑 4, 병영 2(침상), 무기고, HQ(두 방·유리창·정보 단말 책상), 통신 오두막·레이더,
  모터풀(트럭 3·컨테이너), 벙커 엘리베이터 건물, 마당 엄폐물, 깃대, 가로등 8. 웹 build.js 기지 부분 원문 실행 결과와 **449개 호출 일치**(새 도우미: truck·container·glass).
- **장갑차(APC)**: `EnemyType.Apc`(웹 표와 숫자 대조 — 이번에 기존 5종도 전부 웹 표 대조 테스트 추가), 소화기 피해 10%·폭발물 100%(`Damageable.DamageFilter`, 수류탄은 explosive),
  포탑만 1.3 rad/s 로 회전·조준이 맞아야 사격, 포구 높이 2.85 m·3.2 m 앞, 파괴 시 폭발과 그을린 차체(넘어지지 않음). Blender `APC`·`turret` 사용.
- **미션 03(`Core/Campaign.M03`)**: 폭풍, 남문 돌파 → [HQ 경비 소탕 / 모터풀 연료차 폭파(70 m 안 차량 파괴)] 순서 자유 → HQ 단말 다운로드 4초(사이렌 + 증원 5) → 벙커 엘리베이터.
  경보 시 장갑차 수색 + 증원 2. 웹 미션 객체 실행 결과(배치·목표·훅·플래그)와 대조.
- **소리**: 웹 audio.js 의 `alarm` 사이렌을 `SfxSynth` 에 옮김.
- 구조물은 정적이지만 **static batching 에서 제외**(메시 복사로 WebGL 이 커지는 것 방지).
- dotnet `CoreTests~` **302/302**. PlayMode `Mission03Tests` 2개. **Unity 확인 전**(그다음 묶음).

## 2026-11-25 (16) — 미션 04 UNDERGROUND ZERO + 보안 카메라 (허브 세션, 클라우드, U4)

- **지하 시설(`Core/IslandProps.Facility`)**: 벙커 아래 60 m(FAC_Y −60). 엘리베이터 홀 → 카메라 복도·보안문 → 유리 칸막이 연구실 → 생물 금고 → 복도 → 서버실·업링크 콘솔·북쪽 엘리베이터.
  웹 `buildFacility()` 원문 실행 결과와 **173개 호출 + 지점 5개 + 카메라 2대 일치**. 웹은 바닥을 FAC_Y 평면으로 처리 → Unity 는 방마다 바닥·천장 판(충돌체).
  비상등은 붉은 점광원 깜박임(`Runtime/LightPulse`).
- **보안 카메라(`Core/SecurityCam` + `Runtime/SecurityCamera`)**: ±0.7 rad 회전, 15 m·시야각(cos > 0.55)·시선 확인, 감지 게이지 0.9/s(웅크리면 0.5/s), 0.4/s 감소, 1.2 에서
  시설 봉쇄 → 사이렌, 무전, 경보 1회, 모두 수색. 10 hp 라 한 번 맞히면 꺼짐. 웹 규칙 문자열 대조 테스트.
- **미션 04(`Core/Campaign.M04`)**: 보안문 해제 2.5초(문이 4 m 올라감, 닫힌 동안 NavMesh 를 막음) → 연구실 소탕 → 샘플 확보 → 업링크 시작 → 45초 방어(2초 뒤부터 11초마다 2명, 살아 있는 증원 5명 미만일 때) → 북쪽 엘리베이터.
  진행기에 목표별 매 프레임 훅(`OnTick`) 추가. 같은 증원 묶음을 여러 번 부를 수 있게 `GameDirector.Activate` 가 "다음 N명" 을 켬.
- 미션 배치에 높이(`SpawnDef.Y`, `SpawnY`) 추가 — 지하 배치와 M03 건물 안(y 16) 병사. 웹 미션 객체 실행 결과와 높이까지 대조.
- dotnet `CoreTests~` **310/310**. PlayMode `Mission04Tests` 2개. **Unity 확인 전**.

## 2026-11-25 (17) — 미션 05 LAST EXTRACTION: 캠페인 5개 모두 이식 (허브 세션, 클라우드, U4)

- **비행장·항구(`Core/IslandProps.Airfield`)**: 활주로·띠 표시, 격납고(지하 엘리베이터 출구), 관제탑, 헬리패드(원판·노란 고리·H 표시)와 모래주머니, 활주로 엄폐물·트럭·연료탱크·가로등,
  항구 컨테이너·크레인·화물선·부두. 웹 build.js 원문 실행 결과와 **110개 호출 일치**. 평면 표시는 충돌체 없는 얇은 판.
- **보스 COMMANDER VIPER(`EnemyType.Viper`)**: 웹 표 숫자(950 hp·320 armor·1.2배 크기·수류탄). 체력 절반 미만에서 2단계(웹 bossPhase2):
  고함 무전·사이렌·증원 4명, 속도 5.2·탄 퍼짐 2.1(`ViperEnraged`). 대조 테스트에 크기(scale)를 추가하다 **중보병 1.14배** 가 빠진 것을 찾아 고침.
- **미션 05(`Core/Campaign.M05`)**: 황혼, VIPER 제거 → 헬리패드 → 녹색 연막(`Runtime/SmokeColumn`) → 착륙지 60초 방어(9초마다 3명, 살아 있는 7명 미만일 때, 네 방향 순환)
  → 헬기가 웹 곡선(8.5초, 동쪽 240 m·위 70 m·남쪽 120 m 에서 감속 진입)으로 착륙 → 착륙 후에만 탑승 가능(`Objective.Enabled`) → 임무 완료.
- 웹 대조: 미션 객체 실행에 보스 2단계 이벤트(웹 Missions.event 원문)와 헬기·종료 호출까지 기록 → `CampaignParityTests` 가 M01–M05 전부 대조.
- dotnet `CoreTests~` **316/316**. PlayMode `Mission05Tests` 2개. **Unity 확인 전**.
- 캠페인 현황: Unity 판에서 **MISSION 01–05 전부 플레이 가능한 씬**(`Mission01–05.unity`, `?mission=m01…m05`). 아직: 미션 선택·브리핑 화면, 인트로 컷신, 분대원(아군 AI), 드론·열상·야간투시 장비.

## 2026-11-25 (18) — Unity 캠페인 흐름: 브리핑·진행 저장·다음 미션 (허브 세션, 클라우드)

- **진행(`Core/CampaignProgress`)**: 웹 규칙 그대로 — 미션 i 는 i ≤ progress 일 때 열림, 클리어하면 progress = max(progress, i + 1), 최고 기록은 등급이 같거나 좋으면 교체('CBAS').
  웹 main.js·menu.js 원문 대조 테스트. 저장은 `Runtime/ProgressStore`(PlayerPrefs `special-soldier.campaign`, WebGL 은 브라우저 저장소).
- **브리핑(`Runtime/BriefingScreen`)**: 캠페인 씬을 열면 미션 코드·이름·구역·브리핑 문장·최고 기록·난이도를 보여 주고 START(Enter/Space/버튼)까지 게임 멈춤. 테스트(설정 Volatile)와 `-nobrief` 에서는 생략.
- **다음 미션**: 이기면 기록 저장, 결과 화면 `N — NEXT MISSION (이름)`, 마지막 미션은 `CAMPAIGN COMPLETE`. 첫 클리어 표시.
- **일시정지 메뉴**: CAMPAIGN 줄 — M01–M05 버튼(잠김 / 최고 등급), 누르면 그 미션 씬으로.
- dotnet `CoreTests~` **320/320**. PlayMode `CampaignFlowTests`(M01 승리 → 진행 1, M02 열림, 다음 씬 Mission02). **Unity 확인 전**.

## 2026-11-25 (19) — 전술 장비: 야간투시·열상·전술등·구급상자·정찰 드론 (허브 세션, 클라우드)

- **규칙(`Core/Gear`)**: 웹 gear.js·player.js 그대로 — 해금(야간투시·전술등·구급상자 처음부터, 드론은 미션 01, 열상은 미션 02 클리어 후; 캠페인 밖에서는 전부),
  같은 시야 모드를 다시 누르면 꺼짐, 구급상자 미션당 2개·+65·가득 차면 못 씀, 드론 배터리 45초 비행·60초 충전·15 % 이상에서 출발·지하(y < −30) 신호 없음,
  드론은 땅 위 2–72 m·나에게서 230 m 안, 0.3초마다 150 m·시야 cos > 0.82·시선이 닿는 적을 표시(레이더 30초). 웹 원문 문자열 대조 테스트.
- **Unity(`Runtime/GearController`, 플레이어에 붙음)**: N/T 는 URP 후처리 볼륨(야간투시: 밝기↑·녹색·노이즈·비네트, 열상: 흑백·대비↑ + 살아 있는 적 흰색으로 빛남),
  L 은 카메라에 달린 스포트라이트(55 m), H 구급상자, B 드론(플레이어 조작을 멈추고 별도 카메라로 WASD·Space·Ctrl 비행), X/F 선택·사용. HUD 왼쪽 위에 장비 줄(켜진 것 `>`, 드론 배터리, 구급상자 수).
- dotnet `CoreTests~` **326/326**. PlayMode `GearPlayTests`. **Unity 확인 전**.

## 2026-11-25 (20) — 미션 인트로 컷신 + 웹 미션 05 문사수 변경 감지 (허브 세션, 클라우드)

- **인트로(`Core/Cinematic` + `Runtime/IntroDirector`)**: 웹 cinematics.js 그대로 — 샷마다 from → to 로 smoothstep 이동, look 지점을 바라봄, FOV 50,
  첫 0.25초·마지막 0.7초 페이드, Enter/Space 건너뛰기. 브리핑 START 뒤에 재생, 그동안 플레이어 조작·적·미션 시계 정지. 검은 위아래 띠 + 자막.
  M02–M05 샷 데이터는 웹 미션 객체에서 뽑은 픽스처와 대조. **M01 의 보트 인트로는 아직 없음**(바로 시작).
- **웹 변경 감지**: 웹 세션이 v0.23 에서 미션 05 끝에 **헬기 문사수(M134) 장면**을 추가 → 픽스처 생성기가 새 목표 종류 'gunner' 에서 바로 멈춰 알려 줌.
  Unity 미션 05 는 아직 탑승에서 끝남 — `CampaignParityTests.MissionFiveDoorGunnerGap` 이 경고로 계속 보여 줌(이식하면 지우기).
- dotnet `CoreTests~` **333 통과 + 경고 1**(문사수 미이식). **Unity 확인 전**. PC Unity 세션은 09:57 에 보관됨 → 다시 열어야 확인 가능.

## 2026-11-25 (21) — 미션 05 헬기 문사수: 웹 v0.23 따라잡기 (허브 세션, 클라우드)

- **규칙(`Core/DoorGun`)**: 웹 gunner.js 그대로 — 6초 이륙 + 항구(60, −385) 둘레 반지름 82 m·고도 36 m·0.12 rad/s 반시계 선회 40초, 오른쪽 문 카메라(1.45 m 밖·2.35 m 위),
  조준 ±1.25 rad·위아래 −1.15…0.3, M134 46 피해·1500 rpm·퍼짐 1.1°·거리 감쇠 90–320 m(×0.7), 회전 가속(6)·감속(2)·0.6 이상에서 발사, 한 발 +0.0105 열·식힘 0.05/0.32 초당·1 에서 과열·0.35 아래 회복,
  2·14·26초에 항구 증원 4명씩(첫·마지막에 장갑차). 웹 원문 문자열 대조 + 비행 경로·과열 테스트.
- **미션 05**: 탑승 뒤 새 목표 "Cover the exfil — man the door gun" → 끝나면 임무 완료(웹과 같은 목표 6개). 문사수 공백 테스트 제거 — **Unity 캠페인이 다시 웹과 목표 단위로 일치**.
  NavMesh 구역을 항구까지 넓힘. 웹의 마지막 카메라 아웃트로(헬기 귀환)는 무전 한 줄로 대신.
- **Unity(`Runtime/DoorGunner`)**: 남은 적 정리, 플레이어를 헬기 문에 태우고 Core 경로로 비행, 마우스 조준·사격(히트스캔, 부위·거리 피해, 명중·사살·점수 집계), 과열 무전, HUD 줄.
- dotnet `CoreTests~` **336/336**(경고 없음). **Unity 확인 전**.

## 2026-11-25 (22) — 컴파일 검토 + 미션 01 보트 인트로 (허브 세션, 클라우드)

- **Unity 없이 코드 검토**(PC Unity 세션이 보관돼 컴파일을 못 하는 동안): M02 이후 Runtime·Editor·PlayMode 30여 파일을 Unity 6.6 API 기준으로 따로 검토 →
  ① `Mission03Tests` 에 `using SpecialSoldier.Core` 빠짐(PlayMode 테스트 어셈블리 전체 컴파일 실패였을 것) — 고침
  ② `GameDirector` 경보 루프가 도는 중에 증원이 `enemies` 에 추가됨(InvalidOperationException) — 복사본으로 순회
  ③ 보안문 `NavMeshObstacle` 크기를 이미 스케일된 문에 또 곱함(약 25 m 폭으로 막힘) — `Vector3.one`
  ④ 런타임 카메라의 URP 데이터는 `GetUniversalAdditionalCameraData()`(중복 추가 방지).
  나머지 Unity 6 API(RenderMeshInstanced, Volume, NavMeshSurface, 애니메이터 편집 API, UI Toolkit 스타일 등)는 이상 없음으로 판단 — **실제 컴파일은 여전히 PC 필요**.
- **미션 01 보트 인트로**: 웹 playBoatIntro 그대로 — 보트가 35초 동안 z 760 에서 해변(3.2, 331.5)까지 들어오고, 여섯 샷이 보트를 따라 움직임(선형, 카메라 0.9 m 이상),
  자막·무전("Bravo Team, this is Command…"). Blender `Boat` + 분대원 6명(웹 좌석, 앉은 자세 — 운전수는 서 있음). 끝나면 보트는 해변에 정박, 운전수와 한 명만 남음.
  보트·대원의 앞 방향(z 반전 + glTF x 반전)은 **화면 확인 필요**.
- dotnet `CoreTests~` **337/337**.

## 2026-11-25 (23) — 분대원 SQUAD 07 (허브 세션, 클라우드)

- **규칙(`Core/Squad`)**: 웹 squad.js 그대로 — REAPER·NOMAD·ATLAS, 대형 오프셋(−2.6, 3.2)·(2.6, 3.8)·(0, 6.4)을 플레이어 시선에 맞춰 회전, 1.6 m(교전 중 14 m) 넘게 멀면 min(7.2, 1.5 + 1.2·거리) m/s로 따라옴,
  75 m 이상 떨어지거나 층이 15 m 다르면 순간 재집결, 0.4초마다 60 m 안 보이는 가장 가까운 적(무기 자유 전에는 교전 중인 적만), 2–4발 점사(0.1초 간격)·1.4–3.6초 쉬기·조준 0.25 rad 안에서만,
  8 피해(50–140 m 감쇠 ×0.6), 체력 200·초당 4 회복, 0이 되면 18초 쓰러졌다 120으로 복귀, 빗나간 탄 35 %·폭발 50 %, 무전 대사. 웹 원문 문자열 대조 테스트.
- **Unity(`Runtime/SquadMate`)**: NavMeshAgent 로 대형 지점 추적, 사격은 히트스캔(사살은 집계, 플레이어 스타일 점수 없음), 적 애니메이션 리그 재사용(쓰러지면 무릎 꿇기, 웹처럼 웅크림 0.8·조준 −0.35/0),
  청록색 틴트로 적과 구분. "무기 자유"는 첫 총성·폭발(`GameDirector.ReportNoise`) — "REAPER: Contact! Weapons free!". 인트로 동안 정지, 문사수 시작 때 사라짐(웹 squad.clear).
- (추가) **적도 분대원을 노림**(웹 규칙): 플레이어가 안 보일 때 경계 중이거나 분대가 사격을 시작했으면 min(시야 × 1.2, 70) m 안 보이는 분대원을 목표로 — 감지 1.2/s 상승, 1.1 m 높이 조준·탄 퍼짐 × 1.2 (`Perception.SeesSquad`, 웹 원문 대조). 분대원 이름표: HUD 가 45 m 안 앞쪽 분대원 머리 위에 이름(쓰러지면 빨간 "— DOWN")을 표시(`HudToolkit.SquadTags`).
- dotnet `CoreTests~` **340/340**. PlayMode `SquadPlayTests`. **Unity 확인 전**.


## 2026-11-26 — 캠페인 5개 미션·장비·분대·컷신 첫 Unity 실행 (PC Unity 세션)

- 대상: 허브 커밋 ~f54356c·0351379(M03–M05, 컷신·보트 인트로, 문 사수, 전술 장비, 분대원·이름표, 적이 분대도 조준).
- 컴파일 오류 3건(클라우드 dotnet 에선 통과): `IntroDirector` 지역변수 `m` 겹침(CS0136), `IslandPropsTests` 의 NUnit 3.5 이후 `Using<T>(Func<T,T,bool>)`,
  `EnemyTypeParityTests` 가 Windows CRLF 에서 정규식 불일치 → 수정(e2ae4e5).
- PlayMode 2/33: `GearController` 의 `MaterialPropertyBlock` 필드 초기화가 "CreateImpl is not allowed … MonoBehaviour constructor" → Awake 로(1690b01).
  남은 3개는 테스트 가정(문 사수 5프레임, 교전 중 분대 14 m 규칙, 순찰 측정 중 발각) → 고침. **최종 EditMode 341/341, PlayMode 31/31.**
- run-batch: EditMode 가 결과를 쓰고 "Shut down." 후 28분간 종료하지 않음 → 60 s 뒤 중지·결과 파일로 판정.
- 슬라이스: M01 night 9+3 QRF · M02 dawn 17+5 · M03 storm 18+2+5 · M04 facility 11+8 · M05 dusk 11+37, `extraction helicopter Blender Heli`.
- **WebGL 23.5 MB**(미션 5개 포함; 어제 33.6 MB): Meshes 55.7 → 6.3 MB(식생 GPU 인스턴싱), Textures 12.9 MB 가 가장 큼. 인스턴싱 오류 없음.
- 화면(`screenshots/unity-mission0{1,3,5}*.jpg`): M01 브리핑 → 보트 인트로(자막·분대 야간투시경) → 해변(감시탑·야자수·오두막·모래주머니),
  M03 폭풍 기지 남문 "HIDDEN", M05 활주로 인트로·컨테이너 야적장 "Eliminate COMMANDER VIPER".
- 허브에 넘긴 화면 문제: ① M01 시작 4 s 만에 "COMBAT · 9 ENGAGING"(잠입 미션인데 인트로 중 적 AI 가 도는 듯) ② 밤 바다가 밝은 하늘색
  ③ 컷신 중 HUD(적 수·장비 키) 표시 ④ 폭풍(흐림)인데 나무 그림자가 진하고 날카로움.
- **허브 화면 수정 bf1f6de 확인**(EditMode 341/341, PlayMode 31/31, WebGL 23.5 MB): ① M01 시작 SUSPICIOUS → 3 s 뒤 정면 17 m 보초 1명만 교전("COMBAT · 1 ENGAGING", 전에는 4 s 만에 9명)
  ② 밤 바다 짙은 남색 ③ 컷신 중 HUD 숨김 — 모두 확인(`screenshots/unity-mission01-boat-intro.jpg`·`-first-contact.jpg`).
  남은 것: 바다 위 세로 빛기둥(달 반사로 보이나 과다 노출), 시작 지점이 보초 시야 안(17 m), 헬기·트럭·APC 방향·분대 이름표는 마우스 시점 회전이 안 돼 미확인.

## 2026-11-27 — 탈것 방향 확인(허브 f3b51f1 VehicleFacingTests) — PC

- 허브가 Unity 없이 쓴 `VehicleFacingTests` 첫 실행: 장갑차 통과, **헬기 −179°·보트 −173°·모터풀 트럭 180° 반대**.
  원인 하나: 섬 각도 → Unity 를 `−yaw` 로 바꾼 곳(헬기 접근·문사수 비행, 보트, `SliceBuilder.BuildProps`). glTF +z 모델은
  가져오기가 x 를, 섬이 z 를 뒤집으므로 맞는 식은 `180° − yaw` = `WebAngles.EnemyYawToWorldDeg`(적·보안 카메라가 이미 씀).
- 수정: `GameDirector`·`DoorGunner`(헬기 yaw, 문사수 기울기 roll 부호도 거울 규칙대로), `IntroDirector`·`SliceBuilder`(보트 0°/해변 −7°,
  승무원 좌석은 보트 기준 `(−x, z)`·`−r` 로 바꿔 세계 위치는 그대로), `BuildProps` 전 모델 `EnemyYawToWorldDeg`.
- `SoldierAnimTests`: 슬라이스 보초가 시작 때 SUSPICIOUS(제자리) → 플레이어를 치운 뒤 PATROL 로 돌아올 때까지(최대 10 s) 기다렸다 측정.
- 결과: EditMode 341/341, PlayMode 35/37(2 건너뜀, 실패 0, 방향 4개 통과), WebGL 23.5 MB. 브라우저: 밤바다 빛기둥 사라짐,
  보트 선수가 섬 쪽·승무원 좌석 정상(`screenshots/unity-mission01-boat-ride.jpg`, `unity-mission01-boat-facing.jpg`). 콘솔 오류 0.
- 운영 포털(release fc57783) `?mission=m01` 로드·콘솔 오류 0 확인(4922327 빌드).
## 2026-11-27 — 분대 이름표·M03 폭풍 그림자 확인, 지형 파일 손상 수정 — PC

- 브라우저에서 마우스 시점 회전이 안 돼 미뤘던 두 가지를 PlayMode 테스트로 확인(`HudSquadTagStormTests`, 플레이어를 코드로 돌림):
  - 분대원 이름표: M01 에서 REAPER 를 바라보면 머리 위 이름 표시, 뒤돌면 숨김 → 통과.
  - M03 폭풍 그림자: storm 1.00·rain 1.00 에서 태양 그림자 Soft, 세기 0.28(맑은 날 1) → 통과(허브 SkyDirector 흐림 규칙).
- **찾은 버그: `.gitattributes` 가 `*.asset` 을 전부 텍스트(eol=lf)로 다뤘는데, Unity 는 `IslandTerrain.asset`(TerrainData)과
  `*_NavMesh.asset` 을 바이너리로 저장함.** git 이 바이너리 속 CR 바이트를 지워(1.9 MB 지형 파일에 CRLF 0쌍, 다시 만들면 8쌍·4바이트 더 김)
  새로 연 에디터가 "Unknown error occurred while loading 'Assets/Settings/IslandTerrain.asset'" 로 지형을 못 읽음.
  전체 run-batch 는 slice 단계가 지형을 새로 만들어 가려졌음 — 저장소에서 바로 열면(다른 PC·허브) 지형이 깨진 상태였음.
  수정: 두 경로를 `binary` 로 지정, slice 다시 실행, `git add --renormalize` 로 온전한 파일 커밋(내비메시는 바이트 변화 없음).
- 전체 run-batch -WebGL 재실행(14분): EditMode 341/341, PlayMode 37/39(2 건너뜀, 실패 0 — 새 테스트 2개 포함), WebGL 22.9 MB. 브라우저 `?mission=m03`: 지형·비·옅은 나무 그림자 정상, 콘솔 오류 0.

## 2026-11-27 — SURVIVAL WORLD Unity 판 첫 검증(허브 6bda782·95549f1) — PC

- 컴파일 오류 0. `SurvivalSceneBuilder.BuildSceneBatch` → `[Survival] scene saved: Assets/Survival/SurvivalIsland.unity (models all 7)`.
- EditMode 347/347(Survival 규칙 6 포함). PlayMode `SurvivalPlayTests` 2/2 — 새 `Ground_FacesUp_Wolf_HeadLeads`: 지형 법선 위쪽,
  달리는 늑대의 head−tail 방향 · 이동 방향 = 0.78(머리 먼저, `LookRotation(face)` 그대로 맞음).
- WebGL `BuildWebGL` 18.5 MB, 브라우저 콘솔 오류 0. 지형·Blender 나무 정상(`apps/game-lab/survival-world/screenshots/unity-webgl-dawn.jpg`).
- **문제: IMGUI HUD 한글이 WebGL 에서 안 보임**(숫자만 표시) — Unity 기본 글꼴에 한글이 없음. 저장소에 글꼴 파일 없음 →
  한글 글꼴(예: Noto Sans KR, OFL) 하위 집합을 무료 에셋 절차로 넣거나 HUD 를 영어로. 허브 결정.
- 사람 확인 남음: 마우스 시점 방향, 밤 조명·모닥불 빛, 벽 회전(R) — 포인터 잠금이 필요.
- 허브 0dea61c(Noto Sans KR 하위 집합 85 kB) 후 씬·WebGL 재빌드(18.5 MB): **한글 HUD 정상 표시**(체력·배고픔·1일째·조작 안내·소지품), 콘솔 오류 0 — `screenshots/unity-webgl-korean-hud.jpg`.
