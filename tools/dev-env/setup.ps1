# Game development environment setup for a Windows PC (robot-platform repo).
#
#   Check only (default, changes nothing):
#     powershell -ExecutionPolicy Bypass -File tools\dev-env\setup.ps1
#   Install what is missing (asks before each install), npm install, save tool paths:
#     powershell -ExecutionPolicy Bypass -File tools\dev-env\setup.ps1 -Install
#   Same without questions:
#     powershell -ExecutionPolicy Bypass -File tools\dev-env\setup.ps1 -Install -Yes
#
# Never uninstalls or upgrades anything that is already installed.
# Unity ID sign-in and the Unity licence cannot be automated: the script tells you when to do them.
param([switch]$Install, [switch]$Yes)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'find-tools.ps1')
$V = $script:DevEnvVersions
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$rows = New-Object System.Collections.Generic.List[object]
function Row($name, $ok, $detail) { $rows.Add([pscustomobject]@{ Item = $name; OK = $(if ($ok) { 'OK' } else { '--' }); Detail = $detail }) }
function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Ask($q) { if ($Yes) { return $true }; return (Read-Host "$q [y/N]") -match '^[yY]' }
function WingetInstall($id, $label) {
  if (-not $Install) { return $false }
  if (-not (Has 'winget')) { Write-Host "  winget not found: install $label manually."; return $false }
  if (-not (Ask "Install $label ($id) with winget?")) { return $false }
  winget install --id $id -e --accept-source-agreements --accept-package-agreements
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  return $LASTEXITCODE -eq 0
}

Write-Host "== robot-platform game dev setup  ($repo)" -ForegroundColor Cyan
Write-Host ("   mode: " + $(if ($Install) { 'install missing tools' } else { 'check only' }))

# --- Git + repo
if (-not (Has 'git')) { WingetInstall 'Git.Git' 'Git' | Out-Null }
if (Has 'git') {
  $branch = (git -C $repo rev-parse --abbrev-ref HEAD 2>$null)
  Row 'Git' $true ((git --version) + " | branch: $branch")
  if ($branch -ne $V.repoBranch) { Write-Host "  Note: game work lives on branch $($V.repoBranch)  ->  git checkout $($V.repoBranch)" -ForegroundColor Yellow }
} else { Row 'Git' $false 'https://git-scm.com/download/win' }

# --- Node.js
if (-not (Has 'node')) { WingetInstall 'OpenJS.NodeJS.LTS' 'Node.js LTS' | Out-Null }
if (Has 'node') {
  $nv = (node --version); $major = [int]($nv.TrimStart('v').Split('.')[0])
  Row 'Node.js' ($major -ge [int]$V.node) "$nv (need >= $($V.node))"
} else { Row 'Node.js' $false 'https://nodejs.org' }

# --- Python (Blender headless scripts, optional MCP for Unity via uv)
$py = if (Has 'python') { (python --version 2>&1) } else { $null }
if (-not $py -or $py -notmatch 'Python 3') { if (WingetInstall "Python.Python.$($V.python)" "Python $($V.python)") { $py = (python --version 2>&1) } }
Row 'Python' ($py -match 'Python 3') $(if ($py) { $py } else { 'optional: https://www.python.org' })

# --- Blender
$blender = Find-Blender
if (-not $blender) { if (WingetInstall 'BlenderFoundation.Blender' 'Blender') { $blender = Find-Blender } }
if ($blender) {
  $bv = (& $blender --version 2>$null | Select-Object -First 1)
  Row 'Blender' ($bv -match [regex]::Escape($V.blender)) "$bv  ($blender)"
  if ($bv -notmatch [regex]::Escape($V.blender)) { Write-Host "  Note: assets are authored with Blender $($V.blender); other versions may export differently." -ForegroundColor Yellow }
} else { Row 'Blender' $false "Blender $($V.blender): https://www.blender.org/download/" }

# --- Unity Hub + Editor
$hub = Find-UnityHub
if (-not $hub) { if (WingetInstall 'Unity.UnityHub' 'Unity Hub') { $hub = Find-UnityHub } }
Row 'Unity Hub' ([bool]$hub) $(if ($hub) { $hub } else { 'https://unity.com/download' })
$unity = Find-UnityEditor
if (-not $unity -and $hub -and $Install -and (Ask "Install Unity $($V.unity) (Windows IL2CPP + WebGL) with Unity Hub?")) {
  & $hub -- --headless install --version $V.unity --module windows-il2cpp webgl
  $unity = Find-UnityEditor
  if (-not $unity) { Write-Host "  Hub could not install $($V.unity) by version alone. Install it from Unity Hub > Installs, or https://unity.com/releases/editor/archive" -ForegroundColor Yellow }
}
if ($unity) {
  $mods = (Get-ChildItem (Join-Path (Split-Path $unity) 'Data\PlaybackEngines') -Directory -ErrorAction SilentlyContinue | ForEach-Object Name) -join ', '
  Row 'Unity Editor' $true "$($V.unity)  ($unity)  modules: $mods"
} else { Row 'Unity Editor' $false "Unity $($V.unity) via Unity Hub > Installs" }

# --- Optional IDE / SDK
Row 'VS Code' (Has 'code') $(if (Has 'code') { 'installed' } else { 'optional: winget install Microsoft.VisualStudioCode' })
Row '.NET SDK' (Has 'dotnet') $(if (Has 'dotnet') { ((dotnet --list-sdks) -join '; ') } else { 'optional (Unity C# IntelliSense)' })
Row 'uv' (Has 'uv') $(if (Has 'uv') { (uv --version) } else { 'only needed for MCP for Unity (see docs/game-dev/UNITY_CLAUDE_INTEGRATION.md)' })
Row 'Claude Code' (Has 'claude') $(if (Has 'claude') { (claude --version) } else { 'install the Claude desktop app or Claude Code' })

# --- Project dependencies + saved tool paths
if ($Install) {
  $ss = Join-Path $repo 'apps\special-soldier'
  if ((Has 'npm') -and (Test-Path (Join-Path $ss 'package.json')) -and (Ask 'Run npm ci in apps\special-soldier?')) {
    Push-Location $ss; try { npm ci } finally { Pop-Location }
    Row 'special-soldier npm' ($LASTEXITCODE -eq 0) 'npm ci'
  }
  if ($blender -and $env:BLENDER_EXE -ne $blender) { [Environment]::SetEnvironmentVariable('BLENDER_EXE', $blender, 'User'); Write-Host "  Saved BLENDER_EXE (user env)" }
  if ($unity -and $env:UNITY_EDITOR -ne $unity) { [Environment]::SetEnvironmentVariable('UNITY_EDITOR', $unity, 'User'); Write-Host "  Saved UNITY_EDITOR (user env)" }
}

# --- Unity licence (read-only check, only when an editor exists)
if ($unity) {
  $log = Join-Path $env:TEMP 'robot-platform-unity-licence.log'
  $p = Start-Process -FilePath $unity -ArgumentList @('-batchmode', '-nographics', '-quit', '-logFile', "`"$log`"") -Wait -PassThru -NoNewWindow
  $lic = Select-String -Path $log -Pattern 'No valid Unity Editor license' -Quiet
  Row 'Unity licence' (-not $lic -and $p.ExitCode -eq 0) $(if ($lic) { 'NOT ACTIVE: Unity Hub > sign in > Preferences > Licenses > Add > free Personal licence' } else { "exit $($p.ExitCode)" })
}

$rows | Format-Table -AutoSize
$missing = @($rows | Where-Object { $_.OK -ne 'OK' -and $_.Detail -notmatch '^optional' })
if ($missing.Count -eq 0) { Write-Host 'All required tools are ready.' -ForegroundColor Green }
else { Write-Host "$($missing.Count) item(s) need attention. Re-run with -Install, or follow docs\game-dev\NEW_PC_SETUP.md" -ForegroundColor Yellow }
