@echo off
rem PaqRap: publica la imagen completa en AWS (ECS Fargate + balanceador). Requiere AWS CLI y Docker.
setlocal
title PaqRap - AWS
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\aws\desplegar-aws.ps1" %*
if errorlevel 1 (
  echo.
  echo Ocurrio un problema. Revise los mensajes anteriores.
  pause
  exit /b 1
)
echo.
pause
exit /b 0
