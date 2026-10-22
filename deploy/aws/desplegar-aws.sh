#!/usr/bin/env bash
# PaqRap - despliegue en AWS (ECS Fargate + Application Load Balancer).
# Requisitos: AWS CLI v2 configurado (aws configure) y Docker.
# Uso: ./deploy/aws/desplegar-aws.sh [region] [pila]
#   Variables opcionales: CORS_ORIGENES, CERTIFICADO_ARN, REPOSITORIO
set -euo pipefail

REGION="${1:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}"
PILA="${2:-paqrap}"
REPOSITORIO="${REPOSITORIO:-paqrap}"
CORS_ORIGENES="${CORS_ORIGENES:-*}"
CERTIFICADO_ARN="${CERTIFICADO_ARN:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(cd "$DIR/../.." && pwd)"

command -v aws >/dev/null || { echo "Instale AWS CLI v2 y ejecute 'aws configure'."; exit 1; }
command -v docker >/dev/null || { echo "Instale Docker."; exit 1; }

CUENTA="$(aws sts get-caller-identity --query Account --output text)"
REGISTRO="$CUENTA.dkr.ecr.$REGION.amazonaws.com"
ETIQUETA="$(date +%Y%m%d%H%M%S)"
IMAGEN="$REGISTRO/$REPOSITORIO:$ETIQUETA"
echo "Cuenta $CUENTA, region $REGION, imagen $IMAGEN"

if ! aws ecr describe-repositories --repository-names "$REPOSITORIO" --region "$REGION" >/dev/null 2>&1; then
  echo "==> Creando el repositorio ECR $REPOSITORIO"
  aws ecr create-repository --repository-name "$REPOSITORIO" --region "$REGION" --image-scanning-configuration scanOnPush=true >/dev/null
fi

echo "==> Iniciando sesion de Docker en ECR"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRO"

echo "==> Construyendo la imagen (visualizador + backend)"
docker build --platform linux/amd64 -f "$RAIZ/backend/Dockerfile" -t "$IMAGEN" "$RAIZ"

echo "==> Subiendo la imagen"
docker push "$IMAGEN"

PARAMETROS=("ImageUri=$IMAGEN" "CorsOrigenes=$CORS_ORIGENES")
if [ -n "$CERTIFICADO_ARN" ]; then PARAMETROS+=("CertificadoArn=$CERTIFICADO_ARN"); fi

echo "==> Creando/actualizando la pila $PILA (puede tardar 5-10 minutos)"
aws cloudformation deploy --region "$REGION" --stack-name "$PILA" \
  --template-file "$DIR/paqrap-ecs-fargate.yml" --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset --parameter-overrides "${PARAMETROS[@]}"

URL="$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$PILA" \
  --query "Stacks[0].Outputs[?OutputKey=='UrlAplicacion'].OutputValue" --output text)"
echo
echo "PaqRap desplegado en AWS: $URL"
echo "La primera vez el servicio tarda 2-3 minutos en pasar la verificacion de salud."
echo "Para el visualizador en Vercel use BACKEND_URL=$URL"
