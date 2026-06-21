#!/bin/bash
set -e

echo "=== Evolution Api Build========="

cd /home/runner/workspace

# ── Evolution ──────────────────────────────────────────────────────────────────
echo "→ Installing evolution-api dependencies..."
cd /home/runner/workspace/evolution-api
npm install 

echo "→ Building EvoApi..."
npm run build
echo "→ Frontend built to frontend/dist"

cd /home/runner/workspace

# ── Python requirements ───────────────────────────────────────────────────────