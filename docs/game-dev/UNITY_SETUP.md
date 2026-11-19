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
