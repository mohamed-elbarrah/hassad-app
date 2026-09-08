#!/bin/sh
set -eu

cd /app/apps/api

echo "==> Starting API server..."
exec node dist/src/main.js
