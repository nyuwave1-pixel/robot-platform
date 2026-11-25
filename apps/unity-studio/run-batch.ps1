# Unity studio batch pipeline (Windows PowerShell). Run from the repo root AFTER the editor licence is active:
#   powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1
# 1) first open initialises the project (ProjectSettings, Packages), 2) adds URP + glTFast, 3) imports the shared GLB and
# makes one Windows build, 4) builds the playable Island Slice scene + player, 5) runs the EditMode tests, 6) plays the slice scene with simulated input (PlayMode tests). Logs go to apps\unity-studio\Logs\batch-*.log (git-ignored); each step prints its [Studio] lines.
param([switch]$WebGL)  # -WebGL: also make the browser build for the BIT PARK portal (Builds\WebGL)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\..\tools\dev-env\find-tools.ps1')
$unity = Find-UnityEditor  # UNITY_EDITOR env var, else the pinned version in tools\dev-env\versions.json
if (-not $unity) { throw "Unity $($script:DevEnvVersions.unity) not found. Run tools\dev-env\setup.ps1 or set UNITY_EDITOR." }
$proj = Join-Path $PSScriptRoot '.'
$logs = Join-Path $PSScriptRoot 'Logs'; New-Item -ItemType Directory -Force $logs | Out-Null
function Step($name, $extra, [switch]$NoQuit) {
  $log = Join-Path $logs "batch-$name.log"
  $p = Start-Process -FilePath $unity -ArgumentList (@('-batchmode', '-nographics', '-projectPath', "`"$proj`"", '-logFile', "`"$log`"") + $extra + $(if ($NoQuit) { @() } else { @('-quit') })) -PassThru -NoNewWindow
  # Wait for Unity itself, not its whole process tree: Start-Process -Wait also waited for the VBCSCompiler server Unity
  # leaves running after a compile, which held a finished step for ~10 min (2026-11-25). Touching Handle keeps ExitCode readable.
  $null = $p.Handle; $p.WaitForExit()
  Write-Host "== $name exit $($p.ExitCode)"
  Select-String -Path $log -Pattern '\[Studio\]|\[Slice\]|No valid Unity Editor license|error CS|Exception' | ForEach-Object { $_.Line }
  if ($p.ExitCode -ne 0) { throw "$name failed (exit $($p.ExitCode)); see $log" }
}
Step 'init' @()
Step 'packages' @('-executeMethod', 'StudioBootstrap.AddPackages')
Step 'build' @('-executeMethod', 'StudioBootstrap.ImportAndBuild')
Step 'slice' @('-executeMethod', 'SpecialSoldier.EditorTools.SliceBuilder.BuildSliceAndPlayer')
$results = Join-Path $logs 'editmode-results.xml'
Step 'tests' @('-runTests', '-testPlatform', 'EditMode', '-testResults', "`"$results`"") -NoQuit
if (Test-Path $results) { $x = [xml](Get-Content $results); $r = $x.'test-run'; Write-Host "== EditMode tests: $($r.passed) passed, $($r.failed) failed, $($r.total) total" }
$results = Join-Path $logs 'playmode-results.xml'
Step 'playtests' @('-runTests', '-testPlatform', 'PlayMode', '-testResults', "`"$results`"") -NoQuit
if (Test-Path $results) { $x = [xml](Get-Content $results); $r = $x.'test-run'; Write-Host "== PlayMode tests: $($r.passed) passed, $($r.failed) failed, $($r.total) total" }
Write-Host "Playable build: apps\unity-studio\Builds\Slice\IslandSlice.exe"
if ($WebGL) {
  Step 'webgl' @('-executeMethod', 'SpecialSoldier.EditorTools.SliceBuilder.BuildWebGL')
  Write-Host "Browser build: apps\unity-studio\Builds\WebGL\index.html  (then: node tools\portal\export-bitpark-feed.mjs)"
}
