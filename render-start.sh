#!/bin/bash
set -e

# Required env vars for Next.js standalone
export DATABASE_URL="${DATABASE_URL:-file:./db/custom.db}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://jee-pyq-vault.onrender.com}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-prod-secret-jee-vault-2024}"

echo "Starting JEE PYQ Vault..."
echo "Node: $(node -v)"
echo "PORT: $PORT"
echo "DATABASE_URL: $DATABASE_URL"

# cd to standalone dir
cd .next/standalone

# Verify files
if [ ! -f server.js ]; then echo "FATAL: server.js missing"; exit 1; fi
if [ ! -f db/custom.db ]; then echo "FATAL: db missing"; exit 1; fi

echo "Starting Next.js server..."
exec node server.js
