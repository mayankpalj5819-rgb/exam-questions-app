#!/bin/bash
set -e

PROJECT_DIR="/opt/render/project/src"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"

if [ ! -d "$STANDALONE_DIR" ]; then
  STANDALONE_DIR="$(pwd)/.next/standalone"
  PROJECT_DIR="$(pwd)"
fi

cd "$PROJECT_DIR"

# Load .env.production if it exists
if [ -f ".env.production" ]; then
  set -a
  source .env.production
  set +a
  echo "Loaded .env.production"
fi

# Ensure required env vars
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://jee-pyq-vault.onrender.com}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-render-jee-pyq-vault-production-secret-2024}"
export DATABASE_URL="${DATABASE_URL:-file:$STANDALONE_DIR/db/custom.db}"

echo "=== Render Startup ==="
echo "PORT: $PORT"
echo "NODE: $(node -v)"
echo "DB: $(test -f $STANDALONE_DIR/db/custom.db && echo exists || echo MISSING)"

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "FATAL: server.js not found at $STANDALONE_DIR/server.js"
  ls -la .next/standalone/ 2>/dev/null || echo ".next/standalone/ does not exist"
  exit 1
fi

cd "$STANDALONE_DIR"

# Ensure static files, public, and db are present
[ -d "$PROJECT_DIR/.next/static" ] && [ ! -d ".next/static" ] && mkdir -p .next && cp -r "$PROJECT_DIR/.next/static" .next/
[ -d "$PROJECT_DIR/public" ] && [ ! -d "public" ] && cp -r "$PROJECT_DIR/public" .
[ -d "$PROJECT_DIR/db" ] && [ ! -d "db" ] && cp -r "$PROJECT_DIR/db" .

echo "Starting server..."
exec node server.js