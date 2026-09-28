@echo off
setlocal
cd /d "%~dp0"

set "SOXE_DATA=%APPDATA%\SoXeOrganizationData"
if not exist "%SOXE_DATA%" mkdir "%SOXE_DATA%"
echo [%date% %time%] Da chay file Chay-So-Xe.bat>"%SOXE_DATA%\SoXeBat.log"

if not exist "%~dp0SoXeLauncher.exe" (
  echo Khong tim thay SoXeLauncher.exe. Hay giai nen day du file ZIP roi chay lai.
  echo Khong tim thay SoXeLauncher.exe>>"%SOXE_DATA%\SoXeBat.log"
  pause
  exit /b 1
)

start "So Xe" "%~dp0SoXeLauncher.exe"

endlocal
