@echo off
rem Double-click: check the game dev environment. Add -Install to install missing tools.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
pause
