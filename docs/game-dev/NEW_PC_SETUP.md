# 새 PC에서 게임 개발 환경 만들기

> 지금 상태·다음 할 일: [HANDOFF.md](HANDOFF.md). 게임 저장소 전부를 한 번에 받으려면 BIT PARK 포털의 `scripts/setup.ps1` (bitpark-portal `docs/WORKSPACE.md`).

어느 Windows PC에서든 같은 저장소·같은 도구 버전으로 이어서 작업하기 위한 순서입니다.
도구 버전은 [`tools/dev-env/versions.json`](../../tools/dev-env/versions.json) 한 곳에서 관리합니다(현재 Unity 6000.6.9f1, Blender 5.3, Node 22+, Python 3.13).

## 1. 저장소 받기

```bash
git clone https://github.com/nyuwave1-pixel/robot-platform.git C:\개발\robot-platform
```

```bash
cd C:\개발\robot-platform
```

```bash
git checkout claude/relaxed-ramanujan-83okpi
```

Git이 없으면 https://git-scm.com/download/win 에서 먼저 설치합니다. 폴더 위치는 자유지만, 홈 폴더 바로 아래 숨김 폴더(`.`으로 시작)는 피하세요(Claude 원격 연결이 막힙니다).

## 2. 셋업 스크립트

`tools\dev-env\setup.cmd` 를 더블클릭하면 **확인만** 합니다(아무것도 바꾸지 않음). 빠진 도구를 설치하려면:

```bash
powershell -ExecutionPolicy Bypass -File tools\dev-env\setup.ps1 -Install
```

| 단계 | 하는 일 |
|---|---|
| Git · Node.js · Python | 없으면 winget으로 설치(항목마다 묻고 진행) |
| Blender | `BLENDER_EXE` → `C:\Program Files\Blender Foundation\Blender 5.3\` 순서로 찾고, 없으면 winget 설치. 버전이 5.3이 아니면 경고 |
| Unity Hub · Editor | Hub가 없으면 winget 설치 → Hub 헤드리스 CLI로 Unity 6000.6.9f1 + Windows IL2CPP·WebGL 모듈 설치 시도 |
| 프로젝트 의존성 | `apps\special-soldier` 에서 `npm ci` |
| 경로 저장 | 찾은 경로를 사용자 환경변수 `BLENDER_EXE`, `UNITY_EDITOR` 에 저장 → 모든 스크립트가 이 값을 씀 |
| Unity 라이선스 | 배치 모드로 확인만 함 |

이미 설치된 프로그램은 지우거나 업그레이드하지 않습니다. 결과는 표로 출력되고, 필수 항목이 모두 OK면 `All required tools are ready.` 가 나옵니다.

## 3. 직접 해야 하는 것 (자동화 불가)

1. **Unity 라이선스:** Unity Hub → 오른쪽 위 계정 아이콘에서 로그인 → 톱니바퀴(Preferences) → Licenses → Add → 무료 Personal 라이선스.
   에디터를 따로 설치했다면 Hub → Installs → Locate 로 `Unity.exe` 를 등록합니다.
2. **Claude 앱:** Claude 데스크톱 앱을 설치하고 같은 계정으로 로그인합니다. 클라우드 세션에서 이 PC를 쓰려면 Settings → Claude Code → Remote Control 에 이 폴더를 추가합니다.
3. **GitHub 푸시 권한:** 첫 `git push` 때 뜨는 GitHub 로그인 창에서 로그인합니다.

## 4. 동작 확인

```bash
powershell -ExecutionPolicy Bypass -File apps\special-soldier\tools\blender\build.ps1 -NoRender
```

```bash
cd apps\special-soldier
```

```bash
npm test
```

```bash
powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1
```

Blender 빌드는 에셋 51종 이상과 `src\assets\assets.glb` 를 만들고, Unity 배치는 라이선스가 활성화된 뒤에만 됩니다(`docs/game-dev/UNITY_SETUP.md`).

## 5. 여러 PC에서 함께 작업할 때

- 시작 전 `git pull`, 끝나면 커밋·푸시. 같은 파일을 동시에 고칠 때는 [`STUDIO_HUB.md`](STUDIO_HUB.md) "작업 중" 표에 먼저 적습니다.
- 줄바꿈·바이너리 처리는 루트 `.gitattributes` 가 맞춰 줍니다(PowerShell은 CRLF, 나머지는 LF, GLB·blend·이미지·소리는 바이너리).
- PC마다 다른 경로는 환경변수(`BLENDER_EXE`, `UNITY_EDITOR`)로만 다룹니다. 스크립트에 경로를 직접 쓰지 마세요.
- Unity `Library/`, 빌드 결과물, Asset Store 에셋은 커밋하지 않습니다(`apps/unity-studio/.gitignore`).
- 무료 에셋 규칙은 [`.claude/skills/free-asset-pipeline/SKILL.md`](../../.claude/skills/free-asset-pipeline/SKILL.md) — 새 PC의 Claude Code도 이 저장소를 열면 자동으로 읽습니다.

## 6. Windows 검증 (2026-11-23, 사용자 PC · Windows 11 · PowerShell 5.1)

허브 세션이 클라우드에서 쓴 스크립트를 이 PC에서 처음 실행한 결과입니다. **고친 곳은 없습니다**(문법 오류·잘못된 판정 없음).

| 단계 | 결과 |
|---|---|
| `setup.ps1` (확인만) | 정상 종료. 문법 오류 없음. 판정이 실제와 일치: Git 2.55 · Node 24.18 · Python 3.12 · Blender 5.3.0 · Unity 6000.6.9f1(WebGL·Windows 모듈) · Claude Code OK / Unity Hub · VS Code · .NET SDK · uv 없음(직접 `dotnet`·`code`·`uv` 명령으로 다시 확인) / Unity 라이선스 NOT ACTIVE. "3 item(s) need attention" |
| `setup.cmd` | `setup.ps1` 과 같은 표 출력 후 `pause` 로 대기(더블클릭용으로 의도된 동작) |
| `find-tools.ps1` | `Find-UnityEditor` → `C:\Program Files\Unity\Hub\Editor\6000.6.9f1\Editor\Unity.exe`, `Find-Blender` → `C:\Program Files\Blender Foundation\Blender 5.3\blender.exe` |
| `build.ps1 -NoRender` | 종료 정상, 20초. GLB 6,948 kB · BLEND 1,799 kB. 커밋된 `assets.glb` 와 **루트 노드 53 · 메시 117 · 바이트 크기 7,115,696 동일**. (비교 후 재생성 파일은 되돌림 — 커밋 안 함) |
| `run-batch.ps1` | Unity.exe 경로 자동 탐색 성공 → `init` 단계에서 `No valid Unity Editor license found`(종료 198)로 멈춤 = 라이선스 없을 때의 정상 동작. 로그 `apps\unity-studio\Logs\batch-init.log`(git 제외) |
| `-Install` 모드 | **실행 안 함**(사용자 확인 필요) |
| `.gitattributes` | 위 작업 후 `git status` 깨끗함(줄바꿈 변환으로 인한 가짜 변경 없음) |

참고: 이 PC의 PowerShell 프로필이 실행마다 `VBCSCompilerPreWarmer ...` 3줄을 출력합니다. 스크립트 결과와 무관합니다.

### 6-b. 설치 진행 (2026-11-23, 사용자 승인 "다 설치")

| 도구 | 결과 |
|---|---|
| .NET 8 SDK 8.0.428 | ✅ winget 설치(관리자 승인 창 1회) → `dotnet test "apps/unity-studio/CoreTests~"` **159/159 통과** |
| VS Code 1.146.0 | ✅ winget |
| uv 0.13.9 | ✅ winget |
| Unity Hub | ❌ winget이 "이미 설치됨"으로 잘못 판정(Unity Editor의 제거 항목과 혼동). `--force` 로 다시 실행하니 "설치 성공"이라 했지만 파일이 생기지 않음(무인 설치에 관리자 권한이 안 붙은 것으로 추정). → **사용자가 https://unity.com/download 에서 직접 설치** |
| Unity CLI | ❌ 공식 스크립트(`irm https://unity.com/install.ps1 \| iex`)를 Claude 세션 안에서 실행하는 것이 자동 안전 검사에 막힘 → **사용자가 PowerShell에서 직접 실행** |

`setup.ps1` 수정 두 가지:
- winget 설치에 `--force` 추가(위 Unity Hub 오판정 대비).
- 시작할 때와 각 설치 뒤에 레지스트리에서 PATH를 다시 읽음 — 이전에는 방금 설치한 도구를 새 창을 열기 전까지 "없음"으로 표시했다.
