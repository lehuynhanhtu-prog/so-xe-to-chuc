@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0SoXeLauncher.exe" (
  start "" "%~dp0SoXeLauncher.exe"
) else (
  start "" "https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/"
)
endlocal
