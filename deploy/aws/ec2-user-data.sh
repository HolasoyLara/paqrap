#!/bin/bash
# PaqRap en una sola instancia EC2 (Amazon Linux 2023) con Docker Compose.
# Uselo como "User data" al crear la instancia (t3.small o mayor, puertos 80 y 3000 abiertos
# en su grupo de seguridad). Cambie REPO_URL por la URL de su repositorio Git con la carpeta
# Resultado (si Resultado no es la raiz del repositorio, ajuste CARPETA).
set -euxo pipefail

REPO_URL="https://github.com/SU-USUARIO/paqrap.git"
CARPETA="Resultado"

dnf update -y
dnf install -y docker git
systemctl enable --now docker
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

cd /opt
git clone "$REPO_URL" paqrap
cd "paqrap/$CARPETA"
# el visualizador queda en el puerto 80 (backend + web estatica) y en el 3000 (Next.js)
sed -i 's/"8080:8080"/"80:8080"/' docker-compose.yml
docker compose up -d --build
