#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Starting API server..."
exec node dist/src/main.js
