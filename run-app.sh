#!/usr/bin/env bash
# Spuštění Cartographeru jako desktopové aplikace (Linux / macOS).
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js není nainstalován — stáhni z https://nodejs.org (LTS)."
  exit 1
fi

[ -d node_modules ] || { echo "Instaluji závislosti…"; npm install; }
[ -f build/icon.png ] || npm run icon
[ -f out/index.html ] || { echo "Sestavuji aplikaci…"; npm run build; }

echo "Spouštím Cartographer…"
npx electron .
