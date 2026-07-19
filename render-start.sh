#!/bin/bash
# Render deployment startup script
set -e

echo "=== Render Startup Script ==="

# Determine project root (where .next/standalone/ exists)
PROJECT_ROOT="${RENDER_PROJECT_ROOT:-/opt/render/project/src}"
echo "Project root: $PROJECT_ROOT"
ls -la "$PROJECT_ROOT/.next/standalone/server.js" 2>/dev/null || {
  echo "ERROR: server.js not found at $PROJECT_ROOT/.next/standalone/server.js"
  ls -la "$PROJECT_ROOT/.next/" 2>/dev/null | head -10
  exit 1
}

# Handle database
SRC_DB="$PROJECT_ROOT/db/custom.db"
DATA_DIR="/opt/render/data"
mkdir -p "$DATA_DIR"
WDB_FILE="$DATA_DIR/custom.db"

if [ -f "$SRC_DB" ]; then
  if [ ! -f "$WDB_FILE" ] || [ "$SRC_DB" -nt "$WDB_FILE" ]; then
    echo "Copying database to writable location..."
    cp "$SRC_DB" "$WDB_FILE"
  else
    echo "Using existing database at $WDB_FILE"
  fi
  export DATABASE_URL="file:$WDB_FILE"
else
  echo "WARNING: No database found at $SRC_DB, using default DATABASE_URL"
fi

echo "DATABASE_URL set"
echo "Starting production server..."

# Change to project root and start
cd "$PROJECT_ROOT"
exec node .next/standalone/server.js