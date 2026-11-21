# 개발 환경 세팅 — 다른 PC에서 이어서 작업하기

저장소만 받으면 어느 PC에서나 같은 환경으로 게임을 실행·수정·빌드할 수 있습니다.
작업 브랜치: `claude/relaxed-ramanujan-83okpi` (PR #31)

## 1. 필요한 프로그램

| 프로그램 | 용도 | 필수 |
|---|---|---|
| [Git](https://git-scm.com/) | 저장소 받기·올리기 | 필수 |
| [Node.js 22](https://nodejs.org/) (20 이상) | 게임 실행·빌드·테스트 | 필수 |
| [Blender 5.3](https://www.blender.org/download/) | 3D 모델 수정·재빌드 | 모델을 고칠 때만 |
| [Claude Code](https://claude.ai/code) | AI와 함께 작업 | 선택 |

Blender 대신 Python 3.13에 `pip install bpy==5.3.0` 을 설치해도 에셋을 빌드할 수 있습니다.

## 2. 저장소 받기

```powershell
git clone https://github.com/nyuwave1-pixel/robot-platform.git
cd robot-platform
git checkout claude/relaxed-ramanujan-83okpi
cd apps/special-soldier
```

## 3. 자동 세팅 (한 번만)

**Windows** — 저장소 루트의 공용 세팅 스크립트를 씁니다(Unity·Blender·Node·Python 확인/설치, `npm ci`, 경로 저장). 자세한 내용: [`docs/game-dev/NEW_PC_SETUP.md`](../../docs/game-dev/NEW_PC_SETUP.md)

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\tools\dev-env\setup.ps1 -Install
```

(`tools\dev-env\setup.cmd` 를 더블클릭하면 설치 없이 확인만 합니다.)

**macOS / Linux**

```bash
bash scripts/setup.sh
```

도구 버전 확인 → 패키지 설치(`npm ci`) → 단위 테스트 → Blender 위치 확인까지 진행합니다. 에셋까지 다시 만들려면 `--assets` 를 붙입니다.

## 4. 자주 쓰는 명령 (apps/special-soldier 폴더에서)

| 명령 | 내용 |
|---|---|
| `npm run dev` | 게임 실행 → 브라우저에서 http://localhost:5180 |
| `npm test` | 단위 테스트 |
| `npm run test:e2e` | 헤드리스 브라우저 전체 QA (캠페인 완주 포함, 수십 분) |
| `npm run assets` | Blender로 3D 에셋 재빌드 (`-- --render` 를 붙이면 미리보기 렌더까지) |
| `npm run build` | 웹 배포용 `dist/` |
| `npm run build:single` | 한 파일짜리 HTML (`dist-single/index.html`) |
| `npm run build:win` | Windows 실행 파일 (`release/`) |

`npm run assets` 는 Blender를 `BLENDER_EXE` 환경 변수(Windows 세팅 스크립트가 저장) → 운영체제 기본 설치 위치 → PATH → `bpy` 모듈 순서로 찾습니다.
직접 지정: `$env:BLENDER_EXE = "D:\Blender\blender.exe"` (PowerShell) / `export BLENDER_EXE=/path/to/blender` (macOS/Linux)

## 5. 작업 내용 올리기

```powershell
git pull
git add -A
git commit -m "작업 내용"
git push
```

다른 PC에서는 `git pull` 만 하면 이어서 작업할 수 있습니다. `release/`, `dist/`, `node_modules/` 는 저장소에 올라가지 않습니다(각 PC에서 다시 만듭니다).

## 6. 설치 없이 브라우저에서 작업 (GitHub Codespaces)

GitHub 저장소 페이지 → **Code → Codespaces → 브랜치 선택 후 Create codespace**.
`.devcontainer/devcontainer.json` 설정대로 Node 22·Python 3.13·bpy(Blender 모듈)가 자동 설치되고,
`npm run dev` 를 실행하면 포트 5180이 브라우저로 열립니다.

## 7. Claude Code로 작업

- **PC에서**: 이 폴더에서 `claude` (다른 기기에서도 보려면 `claude remote-control`).
- **클라우드에서**: claude.ai/code 새 세션 → 환경 **robot-platform** 선택(시작 시 Blender 모듈과 패키지 자동 설치).
- 작업 기록: [`docs/BLENDER.md`](docs/BLENDER.md), [`production/handover.md`](production/handover.md), [`docs/QA_REPORT.md`](docs/QA_REPORT.md)

## 확인된 범위

Linux에서 `scripts/setup.sh` 와 `npm run assets` 를 끝까지 실행해 확인했습니다.
Codespaces 설정은 이 환경에서 실제로 띄워 보지 못했습니다. Windows 세팅 스크립트는 다른 세션이 작성한 `tools/dev-env/setup.ps1` 입니다. 문제가 생기면 출력 화면을 공유해 주세요.
