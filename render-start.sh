#!/bin/bash
set -e

PROJECT_DIR="/opt/render/project/src"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"

if [ ! -d "$STANDALONE_DIR" ]; then
  STANDALONE_DIR="$(pwd)/.next/standalone"
  PROJECT_DIR="$(pwd)"
fi

cd "$STANDALONE_DIR"

# Copy db and public into standalone dir (standalone doesn't include these)
if [ -d "$PROJECT_DIR/db" ] && [ ! -d "$STANDALONE_DIR/db" ]; then
  cp -r "$PROJECT_DIR/db" "$STANDALONE_DIR/db"
  echo "Copied db/ to standalone"
fi

if [ -d "$PROJECT_DIR/public" ] && [ ! -d "$STANDALONE_DIR/public" ]; then
  cp -r "$PROJECT_DIR/public" "$STANDALONE_DIR/public"
  echo "Copied public/ to standalone"
fi

# Copy static assets from .next/static
if [ -d "$PROJECT_DIR/.next/static" ] && [ ! -d "$STANDALONE_DIR/.next/static" ]; then
  mkdir -p "$STANDALONE_DIR/.next"
  cp -r "$PROJECT_DIR/.next/static" "$STANDALONE_DIR/.next/static"
  echo "Copied .next/static to standalone"
fi

# Use absolute path for SQLite
export DATABASE_URL="file:$STANDALONE_DIR/db/custom.db"

echo "Starting from $STANDALONE_DIR"
echo "Database: $(du -h db/custom.db 2>/dev/null | cut -f1)"
echo "DB exists: $(test -f db/custom.db && echo yes || echo no)"

exec node server.js