# PaqRap - levanta o baja la version en contenedores (docker compose):
#   backend  -> http://localhost:8080  (API + visualizador incluido)
#   frontend -> http://localhost:3000  (visualizador Next.js que reenvia /api al backend)
# Requisito: Docker Desktop instalado y en ejecucion.
# Uso: INICIAR-DOCKER.bat / DETENER-DOCKER.bat   o   docker.ps1 -Accion iniciar|detener [-SinNavegador]
param(
    [ValidateSet('iniciar', 'detener')]
    [string]$Accion = 'iniciar',
    [switch]$SinNavegador
)

. (Join-Path $PSScriptRoot 'comun.ps1')

try {
    $docker = Get-Command docker.exe -ErrorAction SilentlyContinue
    if (-not $docker) { throw 'No se encontro Docker. Instale Docker Desktop: https://www.docker.com/products/docker-desktop/' }
    if ((Invocar-Proceso $docker.Source 'info').Codigo -ne 0) {
        $escritorio = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
        if (Test-Path -LiteralPath $escritorio) {
            Escribir-Paso 'Abriendo Docker Desktop y esperando a que el motor este listo...'
            Start-Process -FilePath $escritorio -WindowStyle Minimized
            $limite = (Get-Date).AddMinutes(3)
            while ((Invocar-Proceso $docker.Source 'info').Codigo -ne 0) {
                if ((Get-Date) -gt $limite) { throw 'Docker no termino de iniciar. Abra Docker Desktop y vuelva a intentarlo.' }
                Start-Sleep -Seconds 3
            }
        } else {
            throw 'Docker no esta en ejecucion. Inicie Docker Desktop y vuelva a intentarlo.'
        }
    }

    if ($Accion -eq 'detener') {
        Ejecutar-Comando 'Deteniendo los contenedores de PaqRap...' $script:Raiz 'docker compose down'
        Escribir-Ok 'Contenedores detenidos (los datos quedan en el volumen paqrap-datos).'
        exit 0
    }

    # La version local (INICIAR.bat) y la de Docker usan el mismo puerto 8080.
    if (Test-Path -LiteralPath $script:PidArchivo) {
        $id = 0
        [int]::TryParse((Get-Content -LiteralPath $script:PidArchivo -Raw).Trim(), [ref]$id) | Out-Null
        if ($id -gt 0 -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) {
            throw 'PaqRap ya corre localmente (INICIAR.bat). Use DETENER.bat antes de iniciar la version Docker.'
        }
    }
    Ejecutar-Comando 'Construyendo e iniciando los contenedores (la primera vez tarda varios minutos)...' $script:Raiz 'docker compose up -d --build'

    Escribir-Paso 'Esperando a que el backend responda...'
    $limite = (Get-Date).AddMinutes(4)
    while (-not (Servicio-Responde 8080)) {
        if ((Get-Date) -gt $limite) { throw 'El backend no respondio. Revise: docker compose logs backend' }
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 3
    }
    Write-Host ''
    Escribir-Ok 'PaqRap en Docker esta listo:'
    Write-Host '    Visualizador Next.js: http://localhost:3000'
    Write-Host '    API + visualizador:   http://localhost:8080'
    Write-Host '    Para apagarlo use DETENER-DOCKER.bat'
    if (-not $SinNavegador) { Start-Process 'http://localhost:3000' }
    exit 0
} catch {
    Escribir-Error "Docker: $($_.Exception.Message)"
    exit 1
}
