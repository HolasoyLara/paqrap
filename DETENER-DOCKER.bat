@echo off
rem PaqRap: detiene los contenedores de PaqRap.
setlocal
title PaqRap - Docker
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\docker.ps1" -Accion detener %*
if errorlevel 1 (
  echo.
  echo Ocurrio un problema. Revise los mensajes anteriores.
  pause
  exit /b 1
)
timeout /t 4 /nobreak >nul 2>&1
exit /b 0
