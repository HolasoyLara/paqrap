#!/usr/bin/env bash
# PaqRap - detiene el sistema iniciado con iniciar.sh (cierra la corrida en curso y apaga el servicio).
# Uso: bash scripts/linux/detener.sh [puerto]
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"

PUERTO="${1:-$(puerto_guardado)}"
paso "Deteniendo PaqRap (puerto $PUERTO)..."
if servicio_responde "$PUERTO"; then
  http_post "http://localhost:$PUERTO/api/simulacion/detener" >/dev/null 2>&1 || true
  sleep 2
fi

terminar() { # pid
  kill "$1" 2>/dev/null || return 1
  for _ in $(seq 1 15); do kill -0 "$1" 2>/dev/null || return 0; sleep 1; done
  kill -9 "$1" 2>/dev/null || true
}

detenido=0
if [ -f "$PID_ARCHIVO" ]; then
  pid="$(tr -dc '0-9' <"$PID_ARCHIVO")"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && es_java "$pid"; then
    terminar "$pid" && detenido=1
  fi
  rm -f "$PID_ARCHIVO"
fi
if [ "$detenido" = 0 ] && command -v lsof >/dev/null 2>&1; then
  pid="$(lsof -ti "tcp:$PUERTO" -sTCP:LISTEN 2>/dev/null | awk 'NR == 1' || true)"
  if [ -n "$pid" ] && es_java "$pid"; then
    terminar "$pid" && detenido=1
  fi
fi

if [ "$detenido" = 1 ]; then ok "PaqRap se detuvo."; else aviso "PaqRap no estaba en ejecucion."; fi
