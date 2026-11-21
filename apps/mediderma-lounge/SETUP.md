# 다른 PC 에서 개발 이어가기

이 게임(`apps/mediderma-lounge`)은 GitHub 저장소 **nyuwave1-pixel/robot-platform** 의
**`main`** 브랜치에 들어 있습니다 (PR #32 로 병합).

## 1. 필요한 프로그램

| 무엇 | 언제 | 받는 곳 |
|---|---|---|
| Git | 항상 | https://git-scm.com |
| Node.js 22 (20 이상) | 항상 | https://nodejs.org — 폴더의 `.nvmrc` 로 nvm 사용 가능 |
| VS Code (권장) | 편집 | 폴더를 열면 추천 확장 목록이 뜹니다 (`.vscode/extensions.json`) |
| Python 3.13 | 3D 모델을 **다시 만들 때만** (Blender 파이프라인) | https://python.org |
| ffmpeg | 사운드를 **다시 만들 때만** | https://ffmpeg.org |

게임을 실행·수정·테스트하는 데는 Git 과 Node 만 있으면 됩니다. 3D 모델·텍스처·사운드 결과물은 이미 저장소(`public/`)에 들어 있습니다.

## 2. 받아서 실행

```bash
git clone https://github.com/nyuwave1-pixel/robot-platform.git
cd robot-platform/apps/mediderma-lounge
```

macOS · Linux · WSL:
```bash
bash scripts/setup.sh
npm run dev
```

Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
npm run dev
```

브라우저에서 http://localhost:3200 을 엽니다. `npm run setup` 은 언제든 무엇이 준비됐는지 점검해 줍니다.

## 3. 자주 쓰는 명령

```bash
npm run dev               # 개발 서버 (저장하면 바로 반영)
npm test                  # 단위 테스트
npm run build             # 타입체크 + dist/ 빌드
npm run smoke             # 빌드본을 헤드리스 브라우저로 점검 (setup --smoke 필요)
npm run optimize:models   # public/models/*.glb meshopt 압축 (새 모델을 넣은 뒤)
```

## 4. 3D 모델을 다시 만들 때 (선택)

```bash
bash scripts/setup.sh --blender --assets     # Windows: scripts\setup.ps1 -Blender -Assets
.bl/bin/python tools/blender/build_real_character.py   # 실사 캐릭터 (여성·남성·동작)
.bl/bin/python tools/blender/build_signature.py        # 시그니처 캐릭터 (Higgsfield 원본은 저장소에 포함)
.bl/bin/python tools/blender/import_quaternius.py      # 광장 자연 소품
npm run optimize:models
```
Windows 에서는 `.bl/bin/python` 대신 `.\.bl\Scripts\python.exe` 를 씁니다.

- `--assets` 는 CC0 무료 에셋 원본(약 500MB)을 공식 출처에서 받아 SHA-256 을 확인합니다. itch.io 팩은 Playwright 로 받으므로 `--smoke` 도 함께 쓰세요.
- 원본은 `tools/assets/incoming/` 에 저장되고 저장소에는 올라가지 않습니다 (언제든 다시 받을 수 있음). 출처·라이선스: `docs/ASSET_LICENSES.md`.
- Higgsfield 로 만든 시그니처 캐릭터 원본은 다시 받을 수 없어 `tools/assets/source/higgsfield_signature/` 에 저장소째 넣어 두었습니다.

## 5. 배포

Vercel 프로젝트 `mediderma-lounge` (Root Directory = `apps/mediderma-lounge`) 로 배포합니다.
공개 주소: https://mediderma-lounge-parkjong-s-projects.vercel.app
Vercel 무료 플랜은 하루 배포 100회 제한이 있습니다 (같은 저장소에 연결된 다른 프로젝트들의 빌드도 함께 셉니다).

## 6. 작업 흐름 팁

- 작업 전 `git pull`, 끝나면 `git add -A && git commit -m "..." && git push` — 두 PC 가 같은 브랜치(main 또는 작업 브랜치)를 쓰면 항상 먼저 pull 하세요.
- 저장소의 줄바꿈은 `.gitattributes` 로 LF 통일, 바이너리 에셋은 binary 로 지정돼 Windows 에서도 깨지지 않습니다.
- 비밀 값(API 키 등)은 저장소에 올리지 말고 각 PC 의 `.env.local` 에 두세요 (`.gitignore` 에 포함).
