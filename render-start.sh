#!/bin/bash
# Render deployment startup script
set -e

# Determine standalone directory
if [ -d "/opt/render/project/src/.next/standalone" ]; then
  STANDALONE_DIR="/opt/render/project/src/.next/standalone"
else
  STANDALONE_DIR="$(pwd)/.next/standalone"
fi

cd "$STANDALONE_DIR"

# Use absolute path for SQLite
export DATABASE_URL="file:$STANDALONE_DIR/db/custom.db"

echo "Starting from $STANDALONE_DIR"
echo "Database: $(du -h db/custom.db 2>/dev/null | cut -f1)"

exec node server.js