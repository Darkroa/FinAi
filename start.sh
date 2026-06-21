#!/bin/bash
set -euo pipefail

# ====================== Kill existing processes ======================
echo "→ Cleaning up old processes..."
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "evolution-api" 2>/dev/null || true


# ====================== Start FastAPI Backend ======================
echo "→ Starting FastAPI backend on port 8000..."

export PATH="/home/runner/workspace/.pythonlibs/bin:$PATH"
export PYTHONPATH="/home/runner/workspace"

cd /home/runner/workspace

python3 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "FastAPI Backend started (PID: $BACKEND_PID)"

# Wait a bit for backend to initialize
sleep 5

# ====================== Start React Frontend (Vite) ======================
echo "→ Starting React Frontend (Vite) on port 5000..."

cd /home/runner/workspace/frontend

echo "✅ All services started successfully!"
exec ./node_modules/.bin/vite --port 5000 --host 0.0.0.0 2>&1

# Give it time to start
sleep 4


# ====================== Start Evolution API (First) ======================
echo "→ Starting Evolution API production server ..."

cd /home/runner/workspace/evolution-api

echo "✅ Evolution API should be starting now (v${EVO_VERSION})"

# Start Evolution API in background
npm run start:prod &
EVO_PID=$!
echo "Evolution API started (PID: $EVO_PID)"

