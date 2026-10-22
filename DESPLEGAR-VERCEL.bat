@echo off
rem PaqRap: publica el visualizador en Vercel (el backend se publica aparte: Render o AWS).
setlocal
title PaqRap - Vercel
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\desplegar-vercel.ps1" %*
if errorlevel 1 (
  echo.
  echo Ocurrio un problema. Revise los mensajes anteriores.
  pause
  exit /b 1
)
echo.
pause
exit /b 0
