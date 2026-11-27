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
function Step($name, $extra, [switch]$NoQuit, [string]$Results) {
  $log = Join-Path $logs "batch-$name.log"
  $t0 = Get-Date
  $p = Start-Process -FilePath $unity -ArgumentList (@('-batchmode', '-nographics', '-projectPath', "`"$proj`"", '-logFile', "`"$log`"") + $extra + $(if ($NoQuit) { @() } else { @('-quit') })) -PassThru -NoNewWindow
  # Wait for Unity itself, not its whole process tree: Start-Process -Wait also waited for the VBCSCompiler server Unity
  # leaves running after a compile, which held a finished step for ~10 min (2026-11-25). Touching Handle keeps ExitCode readable.
  $null = $p.Handle
  $code = $null
  while (-not $p.WaitForExit(5000)) {
    # Test runs: Unity sometimes writes the results, logs "Shut down." and then never exits (seen 2026-11-26, 28 min).
    # Once the results file is new and the log has said "Shut down." for 60 s, stop it and judge the step by the results.
    if ($Results -and (Test-Path $Results) -and (Get-Item $Results).LastWriteTime -gt $t0 -and
        (Select-String -Path $log -Pattern '^Shut down\.' -Quiet) -and ((Get-Date) - (Get-Item $log).LastWriteTime).TotalSeconds -gt 60) {
      Write-Host "== $name : Unity finished the tests but did not exit; stopping it"
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; $p.WaitForExit()
      $r = ([xml](Get-Content $Results)).'test-run'; $code = $(if ([int]$r.failed -gt 0) { 2 } else { 0 }); break
    }
  }
  if ($null -eq $code) { $code = $p.ExitCode }
  Write-Host "== $name exit $code"
  Select-String -Path $log -Pattern '\[Studio\]|\[Slice\]|No valid Unity Editor license|error CS|Exception' | ForEach-Object { $_.Line }
  if ($code -ne 0) { throw "$name failed (exit $code); see $log" }
}
Step 'init' @()
Step 'packages' @('-executeMethod', 'StudioBootstrap.AddPackages')
Step 'build' @('-executeMethod', 'StudioBootstrap.ImportAndBuild')
Step 'slice' @('-executeMethod', 'SpecialSoldier.EditorTools.SliceBuilder.BuildSliceAndPlayer')
$results = Join-Path $logs 'editmode-results.xml'
Step 'tests' @('-runTests', '-testPlatform', 'EditMode', '-testResults', "`"$results`"") -NoQuit -Results $results
if (Test-Path $results) { $x = [xml](Get-Content $results); $r = $x.'test-run'; Write-Host "== EditMode tests: $($r.passed) passed, $($r.failed) failed, $($r.total) total" }
$results = Join-Path $logs 'playmode-results.xml'
Step 'playtests' @('-runTests', '-testPlatform', 'PlayMode', '-testResults', "`"$results`"") -NoQuit -Results $results
if (Test-Path $results) { $x = [xml](Get-Content $results); $r = $x.'test-run'; Write-Host "== PlayMode tests: $($r.passed) passed, $($r.failed) failed, $($r.total) total" }
Write-Host "Playable build: apps\unity-studio\Builds\Slice\IslandSlice.exe"
if ($WebGL) {
  Step 'webgl' @('-executeMethod', 'SpecialSoldier.EditorTools.SliceBuilder.BuildWebGL')
  Write-Host "Browser build: apps\unity-studio\Builds\WebGL\index.html  (then: node tools\portal\export-bitpark-feed.mjs)"
}
