#!/bin/sh
set -eu

cd /app/apps/api

case "${APP_PROCESS:-api}" in
  api)
    echo "==> Starting API server..."
    exec node dist/src/main.js
    ;;
  backup-worker)
    echo "==> Starting backup worker..."
    exec node dist/src/worker.js
    ;;
  *)
    echo "Unsupported APP_PROCESS: ${APP_PROCESS}" >&2
    exit 64
    ;;
esac
