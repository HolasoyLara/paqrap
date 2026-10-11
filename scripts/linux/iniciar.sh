#!/usr/bin/env bash
# PaqRap - inicia el sistema (API + visualizador) en segundo plano y abre el navegador.
# Uso: bash scripts/linux/iniciar.sh [puerto]
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"

mkdir -p "$LOGS" "$DATOS"
PUERTO="${1:-}"

previo="${PUERTO:-$(puerto_guardado)}"
if servicio_responde "$previo"; then
  ok "PaqRap ya esta en ejecucion: http://localhost:$previo"
  abrir_navegador "http://localhost:$previo"
  exit 0
fi

if [ -z "$PUERTO" ]; then
  PUERTO=8080
  while puerto_ocupado "$PUERTO" && [ "$PUERTO" -lt 8100 ]; do PUERTO=$((PUERTO + 1)); done
fi
if puerto_ocupado "$PUERTO"; then error "El puerto $PUERTO esta ocupado por otro programa."; exit 1; fi

paso "Buscando Java 21..."
JAVA_DIR="$(obtener_java jre)"
echo "    Java: $JAVA_DIR" >&2
if [ ! -f "$JAR" ]; then
  aviso "No existe dist/paqrap-app.jar: se compilara primero (unos minutos, solo esta vez)."
  bash "$RAIZ/scripts/linux/compilar.sh"
fi

LOG="$LOGS/paqrap.log"
TEMPORALES="$LOCAL/tmp"
rm -rf "$TEMPORALES" && mkdir -p "$TEMPORALES"
paso "Iniciando PaqRap en el puerto $PUERTO..."
cd "$RAIZ"
PAQRAP_DATOS_DIR="$DATOS" PAQRAP_DATOS_EXTERNOS="$RAIZ/datos-externos" \
  nohup "$JAVA_DIR/bin/java" -Dfile.encoding=UTF-8 -Duser.timezone=America/Lima -XX:+UseSerialGC -XX:-UsePerfData \
  "-Djava.io.tmpdir=$TEMPORALES" -jar "$JAR" --server.port="$PUERTO" >"$LOG" 2>&1 </dev/null &
PID=$!
echo "$PID" >"$PID_ARCHIVO"
echo "$PUERTO" >"$PUERTO_ARCHIVO"

limite=$((SECONDS + 180))
until servicio_responde "$PUERTO"; do
  if ! kill -0 "$PID" 2>/dev/null; then
    error "PaqRap se cerro al iniciar. Ultimas lineas de $LOG:"
    tail -n 25 "$LOG" >&2 || true
    rm -f "$PID_ARCHIVO"
    exit 1
  fi
  if [ "$SECONDS" -gt "$limite" ]; then error "PaqRap no respondio a tiempo. Revise $LOG"; exit 1; fi
  printf '.' >&2
  sleep 2
done
echo >&2
ok "PaqRap esta listo: http://localhost:$PUERTO"
echo "    Bitacora: $LOG" >&2
echo "    Para apagarlo: bash scripts/linux/detener.sh" >&2
abrir_navegador "http://localhost:$PUERTO"
