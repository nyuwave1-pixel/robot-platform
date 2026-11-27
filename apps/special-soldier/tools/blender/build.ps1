# Rebuild every SPECIAL SOLDIER asset with the PC's Blender (any Windows PC).
#   powershell -ExecutionPolicy Bypass -File apps\special-soldier\tools\blender\build.ps1            # GLB + .blend + renders
#   powershell -ExecutionPolicy Bypass -File apps\special-soldier\tools\blender\build.ps1 -NoRender  # skip Cycles renders
# Blender is found through BLENDER_EXE or the pinned version in tools\dev-env\versions.json.
param([switch]$NoRender)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\..\..\..\tools\dev-env\find-tools.ps1')
$blender = Find-Blender
if (-not $blender) { throw "Blender $($script:DevEnvVersions.blender) not found. Run tools\dev-env\setup.ps1 or set BLENDER_EXE." }
$app = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$bargs = @('--background', '--python', 'tools\blender\build.py')
if ($NoRender) { $bargs += @('--', '--no-render') }
Push-Location $app
try { & $blender @bargs; if ($LASTEXITCODE -ne 0) { throw "Blender exited with $LASTEXITCODE" } } finally { Pop-Location }
