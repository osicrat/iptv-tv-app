#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/tizen"

echo "[1/2] Empacotando WGT"
tizen package -t wgt -s default

echo "[2/2] Resultado em tizen/*.wgt"
