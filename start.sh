#!/bin/bash
set -euo pipefail

# ── Clean up stale processes ───────────────────────────────────────────────────
echo "→ Cleaning up old processes..."
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "node.*dist/server" 2>/dev/null || true

# ── Generate evolution-api/.env from runtime secrets ──────────────────────────
echo "→ Writing evolution-api/.env..."
cat > /home/runner/workspace/evolution-api/.env << ENVEOF
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
echo "✅ evolution-api/.env written"

# ── FastAPI backend ────────────────────────────────────────────────────────────
echo "→ Starting FastAPI backend on port 8000..."
export PATH="/home/runner/workspace/.pythonlibs/bin:$PATH"
export PYTHONPATH="/home/runner/workspace"
cd /home/runner/workspace
python3 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

sleep 4

# ── Evolution API ──────────────────────────────────────────────────────────────
echo "→ Starting Evolution API on port 8080..."
cd /home/runner/workspace/evolution-api
npm run start:prod &
EVO_PID=$!
echo "Evolution API started (PID: $EVO_PID)"

sleep 2

# ── React frontend (Vite) — foreground; keeps the workflow alive ───────────────
echo "→ Starting React frontend (Vite) on port 5000..."
cd /home/runner/workspace/frontend
echo "✅ All services started"
exec ./node_modules/.bin/vite --port 5000 --host 0.0.0.0
