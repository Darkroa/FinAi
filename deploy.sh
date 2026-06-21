#!/bin/bash
set -e

echo "=== FinAi Production Build ==="

cd /home/runner/workspace

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "→ Installing front🔚 dependencies..."
cd /home/runner/workspace/frontend
npm install --legacy-peer-deps

echo "→ Building frontend..."
npm run build
echo "→ Frontend built to frontend/dist"

#── start evolution runner 
echo "→ Running the Evo starter..."
cd /home/runner/workspace/evolution-api

echo "→ Making evostart.sh executable..."
chmod +x evostart.sh
echo "→ Setting up Evo server..."
exec bash evostart.sh 


# ─────── Python requirements────────────
cd /home/runner/workspace

echo "→ Installing 🐍Python 🐍requirements..."
pip install -r requirements.txt
echo "→ Requirements installed done"

echo "→ Making start.sh executable..."
chmod +x start.sh

echo "→ Starting FastAPI server..."
exec bash start.sh


