#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8000}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

if ! python3 -m reloadserver -h >/dev/null 2>&1; then
	echo "reloadserver not found; installing from PyPI..."
	python3 -m pip install --user reloadserver
fi

cd "$ROOT"
echo "Serving ${ROOT} at http://localhost:${PORT}/ (auto-reload on file changes)"
echo "  http://localhost:${PORT}/"
echo "  http://localhost:${PORT}/teaching/"

exec python3 -m reloadserver "$PORT"
