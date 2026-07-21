#!/bin/bash
set -e

PROJECT_DIR="/opt/render/project/src"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"

if [ ! -d "$STANDALONE_DIR" ]; then
  STANDALONE_DIR="$(pwd)/.next/standalone"
  PROJECT_DIR="$(pwd)"
fi

cd "$PROJECT_DIR"

# Load .env.production
if [ -f ".env.production" ]; then
  set -a; source .env.production; set +a
fi

export NEXTAUTH_URL="${NEXTAUTH_URL:-https://jee-pyq-vault.onrender.com}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-render-jee-pyq-vault-prod-secret-x8k2m9p}"
export DATABASE_URL="${DATABASE_URL:-file:$STANDALONE_DIR/db/custom.db}"

echo "=== Startup ==="
echo "node: $(node -v)"
echo "PORT: $PORT"

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "FATAL: server.js not found"
  exit 1
fi

cd "$STANDALONE_DIR"

# Ensure assets exist
[ -d "$PROJECT_DIR/.next/static" ] && [ ! -d ".next/static" ] && { mkdir -p .next; cp -r "$PROJECT_DIR/.next/static" .next/; }
[ -d "$PROJECT_DIR/public" ] && [ ! -d "public" ] && cp -r "$PROJECT_DIR/public" .
[ -d "$PROJECT_DIR/db" ] && [ ! -d "db" ] && cp -r "$PROJECT_DIR/db" .

echo "DB: $(test -f db/custom.db && echo OK || echo MISSING)"
echo "Starting server on PORT=$PORT..."

exec node server.js