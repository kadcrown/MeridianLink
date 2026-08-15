#!/bin/sh
set -e

echo "Starting MeridianLink Container..."

# If using SQLite and directory doesn't exist, ensure data dir is ready
if [ -d "/app/prisma" ]; then
  echo "Ensuring database schema is in sync..."
  npx prisma db push --skip-generate || true
fi

echo "Starting MeridianLink Next.js server on port ${PORT:-3000}..."
exec node server.js
