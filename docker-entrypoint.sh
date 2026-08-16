#!/bin/sh
set -e

echo "Starting MeridianLink Container..."

# Ensure /app/prisma exists and has appropriate permissions (especially when mounted as a volume)
mkdir -p /app/prisma
chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
chmod -R 775 /app/prisma 2>/dev/null || true

SCHEMA_SRC="/app/prisma/schema.prisma"
if [ ! -f "$SCHEMA_SRC" ]; then
  echo "schema.prisma not found in volume — copying from backup..."
  cp /app/prisma-backup/schema.prisma /app/prisma/schema.prisma 2>/dev/null || true
  chown nextjs:nodejs /app/prisma/schema.prisma 2>/dev/null || true
fi

echo "Applying database schema (prisma db push)..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --schema=/app/prisma/schema.prisma --skip-generate || true
else
  npx prisma db push --schema=/app/prisma/schema.prisma --skip-generate || true
fi

chown -R nextjs:nodejs /app/prisma 2>/dev/null || true

echo "Starting MeridianLink Next.js server on port ${PORT:-3000}..."
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec nextjs node server.js
else
  exec node server.js
fi
