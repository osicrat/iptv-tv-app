#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/webos"

echo "[1/2] Empacotando IPK"
ares-package .

echo "[2/2] Resultado em webos/*.ipk"
