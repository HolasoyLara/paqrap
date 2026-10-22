#!/usr/bin/env bash
# PaqRap - funciones compartidas por los scripts de Linux y macOS.
# Nada se instala en el sistema: Java o Node portables (si faltan), Maven y sus dependencias, la
# base de datos y las bitacoras quedan en ~/.local/share/paqrap (o en $PAQRAP_LOCAL si se define).
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JAR="$RAIZ/dist/paqrap-app.jar"
LOCAL="${PAQRAP_LOCAL:-${XDG_DATA_HOME:-$HOME/.local/share}/paqrap}"
HERRAMIENTAS="$LOCAL/herramientas"
DATOS="$LOCAL/datos"
LOGS="$LOCAL/logs"
PID_ARCHIVO="$LOGS/paqrap.pid"
PUERTO_ARCHIVO="$LOGS/paqrap.puerto"
VERSION_NODE="v22.23.3"
JAVA_MINIMO=21

# La cache de npm/npx tambien queda en la carpeta de PaqRap (no en la del usuario).
export NPM_CONFIG_CACHE="$LOCAL/npm-cache"
export NPM_CONFIG_UPDATE_NOTIFIER=false

paso() { printf '\033[36m==> %s\033[0m\n' "$*" >&2; }
ok() { printf '\033[32m%s\033[0m\n' "$*" >&2; }
aviso() { printf '\033[33m%s\033[0m\n' "$*" >&2; }
error() { printf '\033[31m%s\033[0m\n' "$*" >&2; }

sistema() { case "$(uname -s)" in Darwin) echo mac ;; *) echo linux ;; esac; }
arquitectura() { case "$(uname -m)" in x86_64 | amd64) echo x64 ;; aarch64 | arm64) echo aarch64 ;; *) uname -m ;; esac; }

descargar() { # url archivo
  if command -v curl >/dev/null 2>&1; then curl -fL --retry 3 -o "$2" "$1" >&2; else wget -O "$2" "$1" >&2; fi
}

http_get() { # url
  if command -v curl >/dev/null 2>&1; then curl -fsS --max-time "${2:-3}" "$1"; else wget -qO- --timeout="${2:-3}" "$1"; fi
}

http_post() { # url
  if command -v curl >/dev/null 2>&1; then curl -fsS --max-time 20 -X POST "$1"; else wget -qO- --timeout=20 --post-data='' "$1"; fi
}

version_java() { # ruta de java -> version mayor (0 si no sirve)
  [ -n "$1" ] && [ -x "$1" ] || { echo 0; return; }
  "$1" -version 2>&1 | awk -F'"' '/version "/ && !v { split($2, a, "."); v = a[1] } END { print v + 0 }'
}

inicio_java() { # ruta de java -> carpeta real de instalacion (java.home)
  "$1" -XshowSettings:properties -version 2>&1 | awk -F' = ' '/^ *java\.home = / && !h { h = $2 } END { print h }'
}

es_java() { # pid -> verdadero si el proceso es una JVM
  case "$(ps -p "$1" -o comm= 2>/dev/null || true)" in *java*) return 0 ;; *) return 1 ;; esac
}

# Imprime la carpeta de un Java 21+ ($1 = jre | jdk). Si no hay, descarga Java 21 (Eclipse Temurin).
obtener_java() {
  local tipo="${1:-jre}" c inicio destino tmp interna
  for c in "${JAVA_HOME:+$JAVA_HOME/bin/java}" "$(command -v java 2>/dev/null || true)" \
    "$HERRAMIENTAS/jdk/bin/java" "$HERRAMIENTAS/jre/bin/java"; do
    [ -n "$c" ] || continue
    [ "$(version_java "$c")" -ge "$JAVA_MINIMO" ] || continue
    inicio="$(inicio_java "$c")"
    [ -n "$inicio" ] || continue
    if [ "$tipo" = jdk ] && [ ! -x "$inicio/bin/javac" ]; then continue; fi
    echo "$inicio"
    return 0
  done
  destino="$HERRAMIENTAS/$tipo"
  paso "No se encontro Java $JAVA_MINIMO o superior: descargando Java 21 ($tipo) portable (solo la primera vez)..."
  mkdir -p "$HERRAMIENTAS"
  tmp="$(mktemp -d)"
  descargar "https://api.adoptium.net/v3/binary/latest/21/ga/$(sistema)/$(arquitectura)/$tipo/hotspot/normal/eclipse?project=jdk" "$tmp/java.tar.gz"
  tar -xzf "$tmp/java.tar.gz" -C "$tmp"
  interna="$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | awk 'NR == 1')"
  rm -rf "$destino"
  if [ -d "$interna/Contents/Home" ]; then mv "$interna/Contents/Home" "$destino"; else mv "$interna" "$destino"; fi
  rm -rf "$tmp"
  echo "$destino"
}

# Imprime la carpeta bin de un Node.js 20+ (el del sistema o uno portable).
obtener_node() {
  local n so arq nombre tmp
  if n="$(command -v node 2>/dev/null)" && [ "$("$n" --version | sed -E 's/^v([0-9]+).*/\1/')" -ge 20 ]; then
    dirname "$n"
    return 0
  fi
  if [ -x "$HERRAMIENTAS/node/bin/node" ]; then echo "$HERRAMIENTAS/node/bin"; return 0; fi
  so="$(sistema)"; [ "$so" = mac ] && so=darwin
  arq="$(arquitectura)"; [ "$arq" = aarch64 ] && arq=arm64
  nombre="node-$VERSION_NODE-$so-$arq"
  paso "Descargando Node.js $VERSION_NODE portable (solo la primera vez)..."
  mkdir -p "$HERRAMIENTAS"
  tmp="$(mktemp -d)"
  descargar "https://nodejs.org/dist/$VERSION_NODE/$nombre.tar.gz" "$tmp/node.tar.gz"
  tar -xzf "$tmp/node.tar.gz" -C "$tmp"
  rm -rf "$HERRAMIENTAS/node"
  mv "$tmp/$nombre" "$HERRAMIENTAS/node"
  rm -rf "$tmp"
  echo "$HERRAMIENTAS/node/bin"
}

puerto_ocupado() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

servicio_responde() { http_get "http://localhost:$1/api/salud" 2>/dev/null | grep -q '"estado":"OK"'; }

puerto_guardado() {
  local p=""
  [ -f "$PUERTO_ARCHIVO" ] && p="$(tr -dc '0-9' <"$PUERTO_ARCHIVO")"
  echo "${p:-8080}"
}

abrir_navegador() {
  if [ "$(sistema)" = mac ]; then
    open "$1" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1 && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
    xdg-open "$1" >/dev/null 2>&1 &
  fi
}
