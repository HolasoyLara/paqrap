@echo off
rem PaqRap: levanta la version en contenedores (requiere Docker Desktop).
setlocal
title PaqRap - Docker
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\docker.ps1" -Accion iniciar %*
if errorlevel 1 (
  echo.
  echo Ocurrio un problema. Revise los mensajes anteriores.
  pause
  exit /b 1
)
timeout /t 8 /nobreak >nul 2>&1
exit /b 0
