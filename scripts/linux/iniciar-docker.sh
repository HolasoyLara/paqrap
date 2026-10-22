#!/usr/bin/env bash
# PaqRap - levanta la version en contenedores (docker compose):
#   backend  -> http://localhost:8080  (API + visualizador incluido)
#   frontend -> http://localhost:3000  (visualizador Next.js que reenvia /api al backend)
# Uso: bash scripts/linux/iniciar-docker.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"

command -v docker >/dev/null 2>&1 || { error "No se encontro Docker (https://docs.docker.com/get-docker/)."; exit 1; }
docker info >/dev/null 2>&1 || { error "Docker no esta en ejecucion."; exit 1; }

cd "$RAIZ"
paso "Construyendo e iniciando los contenedores (la primera vez tarda varios minutos)..."
docker compose up -d --build

paso "Esperando a que el backend responda..."
limite=$((SECONDS + 240))
until servicio_responde 8080; do
  if [ "$SECONDS" -gt "$limite" ]; then error "El backend no respondio. Revise: docker compose logs backend"; exit 1; fi
  printf '.' >&2
  sleep 3
done
echo >&2
ok "PaqRap en Docker esta listo:"
echo "    Visualizador Next.js: http://localhost:3000" >&2
echo "    API + visualizador:   http://localhost:8080" >&2
echo "    Para apagarlo: bash scripts/linux/detener-docker.sh" >&2
abrir_navegador "http://localhost:3000"
