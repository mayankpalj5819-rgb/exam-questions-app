#!/bin/bash
set -e

# Set required env vars if not already set
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://jee-pyq-vault.onrender.com}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-jee-pyq-vault-default-secret-change-in-production}"
export DATABASE_URL="${DATABASE_URL:-file:./db/custom.db}"
export NODE_VERSION="${NODE_VERSION:-20}"

echo "=== Render Startup ==="
echo "NODE_VERSION: $NODE_VERSION"
echo "DATABASE_URL: $DATABASE_URL"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "PORT: $PORT"
echo "CWD: $(pwd)"
echo ""

# Determine project and standalone directory
PROJECT_DIR="/opt/render/project/src"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"

if [ ! -d "$STANDALONE_DIR" ]; then
  STANDALONE_DIR="$(pwd)/.next/standalone"
  PROJECT_DIR="$(pwd)"
fi

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "ERROR: server.js not found at $STANDALONE_DIR/server.js"
  echo "Contents of $(pwd):"
  ls -la
  exit 1
fi

cd "$STANDALONE_DIR"

# Copy db and public into standalone dir if not already there
if [ -d "$PROJECT_DIR/db" ] && [ ! -d "$STANDALONE_DIR/db" ]; then
  cp -r "$PROJECT_DIR/db" "$STANDALONE_DIR/db"
  echo "Copied db/ to standalone"
fi

if [ -d "$PROJECT_DIR/public" ] && [ ! -d "$STANDALONE_DIR/public" ]; then
  cp -r "$PROJECT_DIR/public" "$STANDALONE_DIR/public"
  echo "Copied public/ to standalone"
fi

# Copy static assets
if [ -d "$PROJECT_DIR/.next/static" ] && [ ! -d "$STANDALONE_DIR/.next/static" ]; then
  mkdir -p "$STANDALONE_DIR/.next"
  cp -r "$PROJECT_DIR/.next/static" "$STANDALONE_DIR/.next/static"
  echo "Copied .next/static to standalone"
fi

echo "DB exists: $(test -f db/custom.db && echo yes || echo no)"
echo "DB size: $(du -h db/custom.db 2>/dev/null | cut -f1)"
echo "Starting server on PORT=$PORT..."
echo "========================"

exec node server.js