#!/usr/bin/env bash
# PaqRap - despliegue completo en AWS en UNA instancia EC2 (cuenta student / Learner Lab).
# Solo necesita AWS CLI v2 con credenciales activas (aws configure). No hace falta Docker local:
# el script crea la red, el grupo de seguridad y el servidor; la instancia clona el repositorio
# (debe ser PUBLICO), construye la imagen y queda publica. Al final espera a que responda.
#
# Uso: bash deploy/aws/desplegar-ec2.sh [region] [pila]
#   Variables opcionales: REPO_URL (por defecto el "origin" local), RAMA (main), CARPETA (.),
#   TIPO_INSTANCIA (t3.small), CIDR_SSH, SIN_ESPERA=1
set -euo pipefail

REGION="${1:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"
PILA="${2:-paqrap-ec2}"
RAMA="${RAMA:-main}"
CARPETA="${CARPETA:-.}"
TIPO_INSTANCIA="${TIPO_INSTANCIA:-t3.small}"
CIDR_SSH="${CIDR_SSH:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v aws >/dev/null || { echo "Instale AWS CLI v2 y ejecute 'aws configure'."; exit 1; }

REPO_URL="${REPO_URL:-}"
if [ -z "$REPO_URL" ] && command -v git >/dev/null; then
  REPO_URL="$(git -C "$DIR/../.." remote get-url origin 2>/dev/null | sed -E 's#^https://[^@/]+@#https://#' || true)"
fi
if ! [[ "$REPO_URL" =~ ^https://github\.com/.+ ]]; then
  echo "Indique la URL HTTPS de GitHub: REPO_URL=https://github.com/usuario/paqrap.git bash $0"; exit 1
fi

CUENTA="$(aws sts get-caller-identity --query Account --output text 2>/dev/null)" || {
  echo "No hay credenciales de AWS validas. En AWS Academy/Learner Lab use 'aws configure' (incluya aws_session_token)."; exit 1; }
echo "Cuenta $CUENTA, region $REGION, instancia $TIPO_INSTANCIA"
echo "Repositorio $REPO_URL (rama $RAMA)"

PARAMETROS=("RepoUrl=$REPO_URL" "Rama=$RAMA" "CarpetaProyecto=$CARPETA" "TipoInstancia=$TIPO_INSTANCIA")
if [ -n "$CIDR_SSH" ]; then PARAMETROS+=("CidrSsh=$CIDR_SSH"); fi

echo "==> Creando/actualizando la pila $PILA (2-3 minutos; la app tarda 10-15 minutos mas en compilarse)"
aws cloudformation deploy --region "$REGION" --stack-name "$PILA" \
  --template-file "$DIR/paqrap-ec2.yml" --no-fail-on-empty-changeset --parameter-overrides "${PARAMETROS[@]}"

URL="$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$PILA" \
  --query "Stacks[0].Outputs[?OutputKey=='UrlAplicacion'].OutputValue" --output text)"
echo
echo "Infraestructura lista: $URL"

if [ -z "${SIN_ESPERA:-}" ]; then
  echo "Esperando a que la aplicacion termine de compilar y responda (hasta 25 minutos)..."
  LISTO=""
  for _ in $(seq 1 75); do
    if curl -fsS -m 10 "$URL/api/salud" >/dev/null 2>&1; then LISTO=1; break; fi
    sleep 20
  done
  if [ -n "$LISTO" ]; then echo "PaqRap esta en linea: $URL"; else echo "Aun no responde. Intente en unos minutos: $URL/api/salud"; fi
fi
echo "Salud: $URL/api/salud"
echo "Para el visualizador en Vercel use BACKEND_URL=$URL"
echo "Para borrar todo: aws cloudformation delete-stack --region $REGION --stack-name $PILA"
