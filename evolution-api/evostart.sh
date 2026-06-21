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
echo "→ EvoApi built to /dist"

cd /home/runner/workspace

 #──────────────────────────────────────────────────

export DATABASE_PROVIDER=

# Generate Prisma client
npm run db:generate

# Deploy migrations
npm run db:deploy