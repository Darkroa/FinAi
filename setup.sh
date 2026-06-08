#!/bin/bash

# Kill any existing processes
fuser -k 8000/tcp 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

echo "Starting FastAPI Backend..."

# Start only the backend
exec python3 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000