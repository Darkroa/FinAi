#!/bin/bash
set -e

echo "=== FinAi Production Build ==="

echo "→ Installing frontend dependencies..."
cd /home/runner/workspace/frontend
npm install --legacy-peer-deps

echo "→ Building frontend..."
npm run build

echo "→ Frontend built to frontend/dist"
cd /home/runner/workspace

echo "→ Starting FastAPI server on port 8080..."
exec uvicorn src.api.main:app --host 0.0.0.0 --port 8080
