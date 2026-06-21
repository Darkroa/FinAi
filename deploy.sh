#!/bin/bash
set -e

echo "=== FinAi Production Build ==="

cd /home/runner/workspace

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "→ Installing frontend dependencies..."
cd /home/runner/workspace/frontend
npm install --legacy-peer-deps

echo "→ Building frontend..."
npm run build
echo "→ Frontend built to frontend/dist"

cd /home/runner/workspace

# ── Python requirements ───────────────────────────────────────────────────────
echo "→ Installing 🐍Python 🐍requirements..."
pip install -r requirements.txt
echo "→ Requirements installed done"

echo "→ Making start.sh executable..."
chmod +x start.sh

echo "→ Starting FastAPI server..."
exec bash start.sh


