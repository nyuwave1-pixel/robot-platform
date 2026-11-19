# Unity studio batch pipeline (Windows PowerShell). Run from the repo root AFTER the editor licence is active:
#   powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1
# 1) first open initialises the project (ProjectSettings, Packages), 2) adds URP + glTFast, 3) imports the shared GLB and
# makes one Windows build. Logs go to apps\unity-studio\Logs\batch-*.log (git-ignored); each step prints its [Studio] lines.
$ErrorActionPreference = 'Stop'
$unity = 'C:\Program Files\Unity\Hub\Editor\6000.6.9f1\Editor\Unity.exe'
$proj = Join-Path $PSScriptRoot '.'
$logs = Join-Path $PSScriptRoot 'Logs'; New-Item -ItemType Directory -Force $logs | Out-Null
function Step($name, $extra) {
  $log = Join-Path $logs "batch-$name.log"
  $p = Start-Process -FilePath $unity -ArgumentList (@('-batchmode', '-nographics', '-projectPath', "`"$proj`"", '-logFile', "`"$log`"") + $extra + @('-quit')) -Wait -PassThru -NoNewWindow
  Write-Host "== $name exit $($p.ExitCode)"
  Select-String -Path $log -Pattern '\[Studio\]|No valid Unity Editor license|error CS|Exception' | ForEach-Object { $_.Line }
  if ($p.ExitCode -ne 0) { throw "$name failed (exit $($p.ExitCode)); see $log" }
}
Step 'init' @()
Step 'packages' @('-executeMethod', 'StudioBootstrap.AddPackages')
Step 'build' @('-executeMethod', 'StudioBootstrap.ImportAndBuild')
