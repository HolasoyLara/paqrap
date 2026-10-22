# PaqRap - publica el visualizador Next.js en Vercel (entorno de pruebas).
# Vercel solo aloja el visualizador: la API Spring Boot debe estar publicada aparte (Render con
# render.yaml, AWS con DESPLEGAR-AWS.bat, etc.) y su URL se indica en -BackendUrl. Next.js reenvia
# /api/* a esa URL, asi que el navegador nunca sale del dominio de Vercel.
# Uso: DESPLEGAR-VERCEL.bat   o
#   powershell -ExecutionPolicy Bypass -File scripts\windows\desplegar-vercel.ps1 [-BackendUrl https://...] [-Token xxx] [-Preliminar]
# Sin -Token (ni la variable VERCEL_TOKEN) la CLI de Vercel pide iniciar sesion en el navegador.
param(
    [string]$BackendUrl = $env:BACKEND_URL,
    [string]$Token = $env:VERCEL_TOKEN,
    [switch]$Preliminar
)

. (Join-Path $PSScriptRoot 'comun.ps1')
$VersionVercel = '59.26.0'

try {
    $guardada = Join-Path $script:Local 'vercel-backend-url.txt'
    if (-not $BackendUrl -and (Test-Path -LiteralPath $guardada)) {
        $BackendUrl = (Get-Content -LiteralPath $guardada -Raw).Trim()
        Write-Host "Backend usado la vez anterior: $BackendUrl"
    }
    if (-not $BackendUrl) {
        Write-Host 'El visualizador en Vercel necesita la URL publica del backend (API Spring Boot).'
        Write-Host 'Ejemplos: https://paqrap-api.onrender.com   http://paqrap-alb-123.us-east-1.elb.amazonaws.com'
        $BackendUrl = Read-Host 'URL del backend'
    }
    $BackendUrl = ([string]$BackendUrl).Trim().TrimEnd('/')
    if ($BackendUrl -notmatch '^https?://[^\s"]+$') { throw 'La URL del backend debe empezar con http:// o https://' }
    New-Item -ItemType Directory -Force -Path $script:Local | Out-Null
    Set-Content -LiteralPath $guardada -Value $BackendUrl -Encoding Ascii

    Escribir-Paso "Verificando el backend en $BackendUrl/api/salud ..."
    try {
        $salud = Invoke-RestMethod -Uri "$BackendUrl/api/salud" -TimeoutSec 90
        Escribir-Ok "    Backend en linea (version $($salud.version))."
    } catch {
        Escribir-Aviso '    El backend no respondio (en Render gratuito tarda ~1 minuto en despertar). Se publica igual.'
    }

    $node = Obtener-Node
    $env:PATH = "$node;$env:PATH"
    $env:VERCEL_TELEMETRY_DISABLED = '1'
    $frontend = Join-Path $script:Raiz 'frontend'
    $modo = if ($Preliminar) { '' } else { '--prod' }
    $credencial = if ($Token) { "--token $Token" } else { '' }
    $comando = "npx --yes vercel@$VersionVercel deploy $modo --yes $credencial --build-env BACKEND_URL=$BackendUrl --env BACKEND_URL=$BackendUrl"
    Ejecutar-Comando 'Publicando el visualizador en Vercel (la primera vez crea el proyecto)...' $frontend $comando
    Escribir-Ok 'Listo. La URL publica es la que muestra Vercel arriba (Production / Preview).'
    exit 0
} catch {
    Escribir-Error "No se pudo publicar en Vercel: $($_.Exception.Message)"
    exit 1
}
