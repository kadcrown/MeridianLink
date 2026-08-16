#!/bin/sh
set -e

echo "Starting MeridianLink Container..."

# The prisma schema lives at /app/prisma/schema.prisma inside the image.
# If a volume is mounted at /app/prisma, it may shadow the schema file.
# We copy the schema into the volume dir if it's missing, then push.

SCHEMA_SRC="/app/prisma/schema.prisma"

# Always ensure the schema file exists in the volume mount
if [ ! -f "$SCHEMA_SRC" ]; then
  echo "schema.prisma not found — copying from image backup..."
  cp /app/prisma-backup/schema.prisma /app/prisma/schema.prisma
fi

echo "Applying database schema (prisma db push)..."
npx prisma db push --schema=/app/prisma/schema.prisma --skip-generate

echo "Starting MeridianLink Next.js server on port ${PORT:-3000}..."
exec node server.js
