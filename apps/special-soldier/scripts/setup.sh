#!/usr/bin/env bash
# One-shot developer setup for macOS / Linux / Codespaces.
#   bash scripts/setup.sh            install packages, run unit tests, report Blender
#   bash scripts/setup.sh --assets   also rebuild the Blender assets
set -euo pipefail
cd "$(dirname "$0")/.."
step() { printf '\n== %s\n' "$1"; }
fail() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }

step "Tools"
command -v git >/dev/null || fail "git is not installed (https://git-scm.com/)"
command -v node >/dev/null || fail "Node.js 20+ is not installed (https://nodejs.org/)"
major=$(node -p 'process.versions.node.split(".")[0]')
[ "$major" -ge 20 ] || fail "Node.js $(node -v) is too old; install 20 or newer"
echo "git $(git --version | cut -d' ' -f3) · node $(node -v) · npm $(npm -v)"

step "Packages (npm ci)"
npm ci

step "Unit tests"
npm test

step "Blender"
node scripts/build-assets.mjs --check
if [ "${1:-}" = "--assets" ]; then step "Building Blender assets"; node scripts/build-assets.mjs; fi

step "Done"
echo "Play:   npm run dev      → http://localhost:5180"
echo "Build:  npm run build    → dist/   (single file: npm run build:single)"
echo "Assets: npm run assets   (Blender 5.3 or pip install bpy==5.3.0)"
