#!/usr/bin/env bash
set -euo pipefail

echo "=== Evolution API Setup (install + build + migrate) ==="

EVO_DIR="/home/runner/workspace/evolution-api"
cd "$EVO_DIR"

# ── Generate .env from runtime secrets (needed for Prisma db:deploy) ──────────
echo "→ Writing .env..."
cat > "$EVO_DIR/.env" << ENVEOF
SERVER_NAME=FinAiEvobots
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8080
SERVER_DISABLE_DOCS=false
SERVER_DISABLE_MANAGER=false

CORS_ORIGIN=*
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${DATABASE_URL}
DATABASE_CONNECTION_CLIENT_NAME=evolution

DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_HISTORIC=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_IS_ON_WHATSAPP=true
DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
DATABASE_DELETE_MESSAGE=false

CACHE_REDIS_ENABLED=false
CACHE_LOCAL_ENABLED=true
CACHE_LOCAL_TTL=86400

AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false
ENVEOF
echo "✅ .env written"

# ── npm install ────────────────────────────────────────────────────────────────
if [ ! -d "$EVO_DIR/node_modules" ] || [ ! -f "$EVO_DIR/node_modules/.bin/prisma" ]; then
    echo "→ Installing npm dependencies..."
    npm install --legacy-peer-deps --ignore-scripts
    echo "✅ npm install done"
else
    echo "→ node_modules present, skipping npm install"
fi

# ── Generate Prisma client (must run before build) ────────────────────────────
echo "→ Running Prisma generate..."
node runWithProvider.js "npx prisma generate --schema ./prisma/DATABASE_PROVIDER-schema.prisma"
echo "✅ Prisma client generated"

# ── Build TypeScript → dist/ using tsup (skip tsc --noEmit type-check) ────────
if [ ! -d "$EVO_DIR/dist" ] || [ ! -f "$EVO_DIR/dist/main.js" ]; then
    echo "→ Building Evolution API with tsup..."
    npx tsup
    echo "✅ Build done"
else
    echo "→ dist/main.js present, skipping build"
fi

# ── Prisma: run migrations ─────────────────────────────────────────────────────
echo "→ Running Prisma migrations..."
node runWithProvider.js "rm -rf ./prisma/migrations && cp -r ./prisma/DATABASE_PROVIDER-migrations ./prisma/migrations && npx prisma migrate deploy --schema ./prisma/DATABASE_PROVIDER-schema.prisma"

echo "✅ Evolution API setup complete (server not started — start.sh handles that)"
