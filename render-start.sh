#!/bin/bash
# Render deployment startup script
# Copies the committed database to a writable location and starts the server

set -e

DB_DIR="/opt/render/project/src/db"
DB_FILE="$DB_DIR/custom.db"
WDB_DIR="/opt/render/data"
WDB_FILE="$WDB_DIR/custom.db"

# Create writable data directory
mkdir -p "$WDB_DIR"

# Copy database to writable location if it doesn't exist or is newer
if [ ! -f "$WDB_FILE" ] || [ "$DB_FILE" -nt "$WDB_FILE" ]; then
  echo "Copying database to writable location..."
  cp "$DB_FILE" "$WDB_FILE"
fi

# Set DATABASE_URL to writable location
export DATABASE_URL="file:$WDB_FILE"

# Run database migrations (schema changes)
npx prisma generate --no-engine 2>/dev/null || npx prisma generate 2>/dev/null || true

# Start the Next.js server
echo "Starting production server..."
exec node /opt/render/project/src/.next/standalone/server.js