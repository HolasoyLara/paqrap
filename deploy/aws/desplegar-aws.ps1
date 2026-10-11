<#
  PaqRap - despliegue en AWS (ECS Fargate + Application Load Balancer).

  Requisitos: AWS CLI v2 configurado (aws configure) y Docker en marcha.
  Pasos que hace:
    1. Crea (si no existe) el repositorio ECR "paqrap".
    2. Construye la imagen completa (backend/Dockerfile) y la sube a ECR.
    3. Crea o actualiza la pila CloudFormation (deploy/aws/paqrap-ecs-fargate.yml).
    4. Muestra la URL publica.

  Uso:
    powershell -ExecutionPolicy Bypass -File deploy\aws\desplegar-aws.ps1 [-Region us-east-1] [-Pila paqrap]
           [-CorsOrigenes https://mi-app.vercel.app] [-CertificadoArn arn:aws:acm:...]
#>
param(
    [string]$Region = $(if ($env:AWS_REGION) { $env:AWS_REGION } elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { 'us-east-1' }),
    [string]$Pila = 'paqrap',
    [string]$Repositorio = 'paqrap',
    [string]$CorsOrigenes = '*',
    [string]$CertificadoArn = ''
)

$ErrorActionPreference = 'Stop'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$plantilla = Join-Path $PSScriptRoot 'paqrap-ecs-fargate.yml'

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
Comprobar 'docker' 'Instale Docker Desktop: https://www.docker.com/products/docker-desktop/'

$cuenta = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0 -or -not $cuenta) { Write-Host 'No hay credenciales de AWS validas: ejecute "aws configure".' -ForegroundColor Red; exit 1 }
$cuenta = ([string]$cuenta).Trim()
$registro = "$cuenta.dkr.ecr.$Region.amazonaws.com"
$etiqueta = Get-Date -Format 'yyyyMMddHHmmss'
$imagen = "$registro/${Repositorio}:$etiqueta"
Write-Host "Cuenta $cuenta, region $Region, imagen $imagen" -ForegroundColor Gray

$existe = $true
$previo = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
aws ecr describe-repositories --repository-names $Repositorio --region $Region *> $null
if ($LASTEXITCODE -ne 0) { $existe = $false }
$ErrorActionPreference = $previo
if (-not $existe) {
    Ejecutar "Creando el repositorio ECR $Repositorio" { aws ecr create-repository --repository-name $Repositorio --region $Region --image-scanning-configuration scanOnPush=true | Out-Null }
}

Ejecutar 'Iniciando sesion de Docker en ECR' { aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $registro }
Push-Location $raiz
try {
    Ejecutar 'Construyendo la imagen (visualizador + backend)' { docker build --platform linux/amd64 -f backend/Dockerfile -t $imagen . }
} finally {
    Pop-Location
}
Ejecutar 'Subiendo la imagen a ECR' { docker push $imagen }

$parametros = @("ImageUri=$imagen", "CorsOrigenes=$CorsOrigenes")
if ($CertificadoArn) { $parametros += "CertificadoArn=$CertificadoArn" }
Ejecutar "Creando/actualizando la pila $Pila (puede tardar 5-10 minutos)" {
    aws cloudformation deploy --region $Region --stack-name $Pila --template-file $plantilla --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset --parameter-overrides $parametros
}

$url = (aws cloudformation describe-stacks --region $Region --stack-name $Pila --query "Stacks[0].Outputs[?OutputKey=='UrlAplicacion'].OutputValue" --output text).Trim()
Write-Host ''
Write-Host "PaqRap desplegado en AWS: $url" -ForegroundColor Green
Write-Host 'La primera vez el servicio tarda 2-3 minutos en pasar la verificacion de salud.'
Write-Host "Para el visualizador en Vercel use BACKEND_URL=$url"
