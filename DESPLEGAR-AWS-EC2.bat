@echo off
rem PaqRap: despliega en AWS una sola instancia EC2 (cuenta student). Requiere AWS CLI con credenciales. No requiere Docker local.
setlocal
title PaqRap - AWS EC2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\aws\desplegar-ec2.ps1" %*
if errorlevel 1 (
  echo.
  echo Ocurrio un problema. Revise los mensajes anteriores.
  pause
  exit /b 1
)
echo.
pause
exit /b 0
