<#
  PaqRap - despliegue en AWS en UNA instancia EC2 (pensado para cuenta student).

  Requisitos: AWS CLI v2 con credenciales activas (aws configure). NO hace falta Docker local:
  la instancia clona el repositorio de GitHub y construye la imagen ella misma.

  Antes de ejecutar: suba este proyecto a un repositorio PUBLICO de GitHub (o use una URL
  accesible) y tenga la URL HTTPS a mano, por ejemplo https://github.com/usuario/paqrap.git

  Uso:
    powershell -ExecutionPolicy Bypass -File deploy\aws\desplegar-ec2.ps1 -RepoUrl https://github.com/usuario/paqrap.git
           [-CarpetaProyecto Resultado] [-TipoInstancia t3.small] [-Region us-east-1] [-Pila paqrap-ec2]
           [-CidrSsh 203.0.113.10/32]

  Si no pasa -RepoUrl, el script se la pide.
#>
param(
    [string]$RepoUrl = '',
    [string]$CarpetaProyecto = 'Resultado',
    [ValidateSet('t3.micro', 't3.small', 't3.medium')]
    [string]$TipoInstancia = 't3.small',
    [string]$Region = $(if ($env:AWS_REGION) { $env:AWS_REGION } elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { 'us-east-1' }),
    [string]$Pila = 'paqrap-ec2',
    [string]$CidrSsh = ''
)

$ErrorActionPreference = 'Stop'
$plantilla = Join-Path $PSScriptRoot 'paqrap-ec2.yml'

function Comprobar([string]$comando, [string]$ayuda) {
    if (-not (Get-Command $comando -ErrorAction SilentlyContinue)) {
        Write-Host "No se encontro '$comando'. $ayuda" -ForegroundColor Red
        exit 1
    }
}
function Ejecutar([string]$descripcion, [scriptblock]$bloque) {
    Write-Host "==> $descripcion" -ForegroundColor Cyan
    & $bloque
    if ($LASTEXITCODE -ne 0) { Write-Host "Fallo: $descripcion" -ForegroundColor Red; exit $LASTEXITCODE }
}

Comprobar 'aws' 'Instale AWS CLI v2: https://aws.amazon.com/cli/ y ejecute "aws configure".'

if (-not $RepoUrl) {
    $RepoUrl = Read-Host 'URL HTTPS de su repositorio en GitHub (ej. https://github.com/usuario/paqrap.git)'
}
$RepoUrl = $RepoUrl.Trim()
if ($RepoUrl -notmatch '^https://github\.com/.+') {
    Write-Host 'La URL debe ser HTTPS de GitHub, por ejemplo https://github.com/usuario/paqrap.git' -ForegroundColor Red
    exit 1
}

$cuenta = aws sts get-caller-identity --query Account --output text 2>$null
if ($LASTEXITCODE -ne 0 -or -not $cuenta) {
    Write-Host 'No hay credenciales de AWS validas. En AWS Academy/Learner Lab copie las credenciales vigentes con "aws configure" (incluya aws_session_token).' -ForegroundColor Red
    exit 1
}
Write-Host "Cuenta $(([string]$cuenta).Trim()), region $Region, instancia $TipoInstancia" -ForegroundColor Gray

$parametros = @(
    "RepoUrl=$RepoUrl",
    "CarpetaProyecto=$CarpetaProyecto",
    "TipoInstancia=$TipoInstancia"
)
if ($CidrSsh) { $parametros += "CidrSsh=$CidrSsh" }

Ejecutar "Creando/actualizando la pila $Pila (tarda 2-3 minutos; la app tarda 10-15 minutos mas en compilarse)" {
    aws cloudformation deploy --region $Region --stack-name $Pila `
        --template-file $plantilla --no-fail-on-empty-changeset --parameter-overrides $parametros
}

$url = (aws cloudformation describe-stacks --region $Region --stack-name $Pila --query "Stacks[0].Outputs[?OutputKey=='UrlAplicacion'].OutputValue" --output text).Trim()
Write-Host ''
Write-Host "PaqRap desplegado en AWS: $url" -ForegroundColor Green
Write-Host 'La compilacion dentro de la instancia tarda 10-15 minutos. Revise /api/salud antes de usarla.'
Write-Host "Salud: $url/api/salud"
Write-Host 'Para el visualizador en Vercel use BACKEND_URL=' -NoNewline
Write-Host $url
