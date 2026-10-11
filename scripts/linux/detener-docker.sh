#!/usr/bin/env bash
# PaqRap - detiene los contenedores de PaqRap (los datos quedan en el volumen paqrap-datos).
# Uso: bash scripts/linux/detener-docker.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"

cd "$RAIZ"
paso "Deteniendo los contenedores de PaqRap..."
docker compose down
ok "Contenedores detenidos."
