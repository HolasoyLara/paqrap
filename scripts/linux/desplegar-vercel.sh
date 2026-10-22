#!/usr/bin/env bash
# PaqRap - publica el visualizador Next.js en Vercel (entorno de pruebas).
# Vercel solo aloja el visualizador; la API Spring Boot se publica aparte (Render con render.yaml,
# AWS con deploy/aws/desplegar-aws.sh...) y Next.js reenvia /api/* a esa URL.
# Uso: bash scripts/linux/desplegar-vercel.sh [url-del-backend]
#   Variables opcionales: VERCEL_TOKEN (sin ella la CLI pide iniciar sesion), PRELIMINAR=1 (despliegue preview)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"
VERSION_VERCEL="59.26.0"

URL_BACKEND="${1:-${BACKEND_URL:-}}"
GUARDADA="$LOCAL/vercel-backend-url.txt"
if [ -z "$URL_BACKEND" ] && [ -f "$GUARDADA" ]; then
  URL_BACKEND="$(cat "$GUARDADA")"
  echo "Backend usado la vez anterior: $URL_BACKEND" >&2
fi
if [ -z "$URL_BACKEND" ]; then
  echo "El visualizador en Vercel necesita la URL publica del backend (API Spring Boot)." >&2
  echo "Ejemplos: https://paqrap-api.onrender.com   http://paqrap-alb-123.us-east-1.elb.amazonaws.com" >&2
  read -r -p "URL del backend: " URL_BACKEND
fi
URL_BACKEND="${URL_BACKEND%/}"
case "$URL_BACKEND" in http://* | https://*) ;; *) error "La URL del backend debe empezar con http:// o https://"; exit 1 ;; esac
mkdir -p "$LOCAL"
echo "$URL_BACKEND" >"$GUARDADA"

paso "Verificando el backend en $URL_BACKEND/api/salud ..."
if http_get "$URL_BACKEND/api/salud" 90 >/dev/null 2>&1; then
  ok "    Backend en linea."
else
  aviso "    El backend no respondio (en Render gratuito tarda ~1 minuto en despertar). Se publica igual."
fi

NODE_BIN="$(obtener_node)"
export PATH="$NODE_BIN:$PATH"
export VERCEL_TELEMETRY_DISABLED=1
cd "$RAIZ/frontend"
MODO="--prod"
[ "${PRELIMINAR:-0}" = "1" ] && MODO=""
paso "Publicando el visualizador en Vercel (la primera vez crea el proyecto)..."
# shellcheck disable=SC2086
npx --yes "vercel@$VERSION_VERCEL" deploy $MODO --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} \
  --build-env "BACKEND_URL=$URL_BACKEND" --env "BACKEND_URL=$URL_BACKEND"
ok "Listo. La URL publica es la que muestra Vercel arriba (Production / Preview)."
