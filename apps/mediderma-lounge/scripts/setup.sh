#!/usr/bin/env bash
# MEDIDERMA LOUNGE 개발 환경 한 번에 준비 (macOS · Linux · WSL)
#   bash scripts/setup.sh            # 게임 개발만 (Node 의존성)
#   bash scripts/setup.sh --blender  # + Blender 파이프라인 (Python 3.13 가상환경 .bl)
#   bash scripts/setup.sh --assets   # + 무료 에셋 원본 내려받기 (수백 MB, Blender 로 다시 만들 때만 필요)
#   bash scripts/setup.sh --smoke    # + 헤드리스 브라우저 점검용 Playwright
set -euo pipefail
cd "$(dirname "$0")/.."
want() { [[ " ${ARGS[*]-} " == *" $1 "* ]]; }
ARGS=("$@")

echo "▶ Node $(node -v 2>/dev/null || echo '없음')"
node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' || { echo "Node 20 이상이 필요합니다 (.nvmrc = 22). https://nodejs.org"; exit 1; }
npm ci

if want --blender || want --assets; then
  PY=${PYTHON:-python3.13}
  command -v "$PY" >/dev/null || { echo "Python 3.13 이 필요합니다 (bpy 5.3). PYTHON=경로 로 지정할 수 있습니다."; exit 1; }
  [ -d .bl ] || "$PY" -m venv .bl
  .bl/bin/pip install -q -r tools/blender/requirements.txt
  echo "▶ Blender(bpy) 준비됨: .bl/bin/python tools/blender/<스크립트>.py"
fi
if want --assets; then
  .bl/bin/python tools/assets/fetch_free_assets.py
fi
if want --smoke; then
  npm i --no-save playwright
  npx playwright install chromium
fi
npm run -s setup
