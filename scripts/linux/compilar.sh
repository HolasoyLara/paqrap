#!/usr/bin/env bash
# PaqRap - compila el visualizador (Next.js en modo estatico) y el backend (Spring Boot) y deja
# el ejecutable unico en dist/paqrap-app.jar. Si faltan Java 21 o Node.js 20+, los descarga.
# Uso: bash scripts/linux/compilar.sh [--con-pruebas]
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/comun.sh"

METAS="-DskipTests package"
[ "${1:-}" = "--con-pruebas" ] && METAS="package"
inicio=$SECONDS

paso "Buscando JDK 21 y Node.js..."
JDK="$(obtener_java jdk)"
NODE_BIN="$(obtener_node)"
echo "    JDK:  $JDK" >&2
echo "    Node: $NODE_BIN" >&2
export JAVA_HOME="$JDK"
export PATH="$NODE_BIN:$JDK/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
export MAVEN_USER_HOME="$LOCAL/maven"

cd "$RAIZ/frontend"
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  paso "Instalando dependencias del visualizador (npm ci)..."
  npm ci --no-audit --no-fund
fi
paso "Compilando el visualizador (Next.js, salida estatica)..."
node scripts/build-estatico.mjs

cd "$RAIZ/backend"
paso "Compilando el backend (Spring Boot)..."
# shellcheck disable=SC2086
sh ./mvnw -B -ntp "-Dmaven.repo.local=$LOCAL/maven/repository" $METAS

mkdir -p "$RAIZ/dist"
cp target/paqrap-app.jar "$JAR"
ok "Compilacion lista: dist/paqrap-app.jar ($(du -h "$JAR" | cut -f1), $(((SECONDS - inicio) / 60)) min)"
