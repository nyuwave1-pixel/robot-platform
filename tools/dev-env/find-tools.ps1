# Shared tool locator for Windows PCs. Dot-source it:  . "$PSScriptRoot\..\..\tools\dev-env\find-tools.ps1"
# Order for each tool: environment variable override -> standard install folders -> PATH.
# Nothing here installs or changes anything.
$script:DevEnvVersions = Get-Content -Raw (Join-Path $PSScriptRoot 'versions.json') | ConvertFrom-Json

function Find-UnityEditor {
  param([string]$Version = $script:DevEnvVersions.unity)
  if ($env:UNITY_EDITOR -and (Test-Path $env:UNITY_EDITOR)) { return $env:UNITY_EDITOR }
  $roots = @("$env:ProgramFiles\Unity\Hub\Editor\$Version\Editor\Unity.exe",
             "$env:ProgramFiles\Unity $Version\Editor\Unity.exe",
             "$env:ProgramFiles\Unity\Editor\Unity.exe")
  # Unity Hub may be configured to install editors elsewhere (secondaryInstallPath.json)
  $hubCfg = Join-Path $env:APPDATA 'UnityHub\secondaryInstallPath.json'
  if (Test-Path $hubCfg) {
    $alt = (Get-Content -Raw $hubCfg | ConvertFrom-Json)
    if ($alt) { $roots += (Join-Path $alt "$Version\Editor\Unity.exe") }
  }
  foreach ($p in $roots) { if (Test-Path $p) { return $p } }
  return $null
}

function Find-Blender {
  param([string]$Version = $script:DevEnvVersions.blender)
  if ($env:BLENDER_EXE -and (Test-Path $env:BLENDER_EXE)) { return $env:BLENDER_EXE }
  $p = "$env:ProgramFiles\Blender Foundation\Blender $Version\blender.exe"
  if (Test-Path $p) { return $p }
  $cmd = Get-Command blender -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Find-UnityHub {
  foreach ($p in @("$env:ProgramFiles\Unity Hub\Unity Hub.exe", "${env:LOCALAPPDATA}\Programs\Unity Hub\Unity Hub.exe")) {
    if (Test-Path $p) { return $p }
  }
  return $null
}
