<#
  PaqRap - despliegue completo en AWS en UNA instancia EC2 (pensado para cuenta student / Learner Lab).

  Solo necesita AWS CLI v2 con credenciales activas (aws configure). NO hace falta Docker local.
  El script crea TODA la infraestructura (red, grupo de seguridad y servidor), la instancia clona el
  repositorio, construye la imagen y deja la aplicacion publica. Al final espera a que responda y
  muestra la URL.

  Requisito: el repositorio de GitHub debe ser PUBLICO (la instancia lo clona sin credenciales).

  Uso (desde la carpeta del proyecto, normalmente no hace falta ningun parametro):
    powershell -ExecutionPolicy Bypass -File deploy\aws\desplegar-ec2.ps1
  Opciones:
    -RepoUrl https://github.com/usuario/paqrap.git   (por defecto, el "origin" del repositorio local)
    -Rama main                                       (rama a desplegar)
    -CarpetaProyecto .                               (carpeta con backend/ y docker-compose.yml)
    -TipoInstancia t3.small  -Region us-east-1  -Pila paqrap-ec2  -CidrSsh 203.0.113.10/32
    -SinEspera                                       (no esperar a que la aplicacion responda)
#>
param(
    [string]$RepoUrl = '',
    [string]$Rama = 'main',
    [string]$CarpetaProyecto = '.',
    [ValidateSet('t3.micro', 't3.small', 't3.medium')]
    [string]$TipoInstancia = 't3.small',
    [string]$Region = $(if ($env:AWS_REGION) { $env:AWS_REGION } elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { 'us-east-1' }),
    [string]$Pila = 'paqrap-ec2',
    [string]$CidrSsh = '',
    [switch]$SinEspera
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

# URL del repositorio: la que se pase o el "origin" del repositorio local (sin usuario ni token)
if (-not $RepoUrl -and (Get-Command git -ErrorAction SilentlyContinue)) {
    $origen = (git -C (Join-Path $PSScriptRoot '..\..') remote get-url origin 2>$null)
    if ($LASTEXITCODE -eq 0 -and $origen) { $RepoUrl = ([string]$origen) -replace '^https://[^@/]+@', 'https://' }
}
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
Write-Host "Repositorio $RepoUrl (rama $Rama)" -ForegroundColor Gray

$parametros = @(
    "RepoUrl=$RepoUrl",
    "Rama=$Rama",
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
Write-Host "Infraestructura lista: $url" -ForegroundColor Green

if (-not $SinEspera) {
    Write-Host 'Esperando a que la aplicacion termine de compilar y responda (hasta 25 minutos)...' -ForegroundColor Cyan
    $limite = (Get-Date).AddMinutes(25)
    $listo = $false
    while ((Get-Date) -lt $limite) {
        try {
            $r = Invoke-WebRequest -Uri "$url/api/salud" -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) { $listo = $true; break }
        } catch { }
        Start-Sleep -Seconds 20
    }
    if ($listo) { Write-Host "PaqRap esta en linea: $url" -ForegroundColor Green }
    else { Write-Host "Aun no responde. Siga intentando en unos minutos: $url/api/salud" -ForegroundColor Yellow }
} else {
    Write-Host 'La compilacion dentro de la instancia tarda 10-15 minutos. Revise /api/salud antes de usarla.'
}
Write-Host "Salud: $url/api/salud"
Write-Host "Para el visualizador en Vercel use BACKEND_URL=$url"
Write-Host "Para borrar todo: aws cloudformation delete-stack --region $Region --stack-name $Pila"
