# MEDIDERMA LOUNGE 개발 환경 한 번에 준비 (Windows PowerShell)
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1            # 게임 개발만
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -Blender   # + Blender 파이프라인 (.bl)
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -Assets    # + 무료 에셋 원본 (수백 MB)
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -Smoke     # + Playwright
param([switch]$Blender, [switch]$Assets, [switch]$Smoke)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$nodeMajor = [int]((node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 20) { throw "Node 20 이상이 필요합니다 (.nvmrc = 22). https://nodejs.org" }
npm ci

if ($Blender -or $Assets) {
  if (-not (Test-Path .bl)) { py -3.13 -m venv .bl }
  .\.bl\Scripts\pip.exe install -q -r tools\blender\requirements.txt
  Write-Host "Blender(bpy) 준비됨: .\.bl\Scripts\python.exe tools\blender\<스크립트>.py"
}
if ($Assets) { .\.bl\Scripts\python.exe tools\assets\fetch_free_assets.py }
if ($Smoke) {
  npm i --no-save playwright
  npx playwright install chromium
}
npm run -s setup
