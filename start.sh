#!/bin/bash
# Kill any existing processes on used ports
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

# Start FastAPI backend in background
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 3

# Start React frontend (Vite) on port 5000
cd /home/runner/workspace/frontend && exec npm run dev 2>&1
