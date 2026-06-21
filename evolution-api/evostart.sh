#!/bin/bash
set -e

echo "=== Evolution Api Build========="

cd /home/runner/workspace


#───────────────────────────────────────────Evolution install────────────────

echo "→ Installing evolution-api dependencies..."
cd /home/runner/workspace/evolution-api
npm install 

echo "→ Building EvoApi..."
npm run build
echo "→ EvoApi built to /dist"


#───────────────────────────────────────────────Evolution db───────────────

echo "→ Running dbPrisma Migration ..."

export DATABASE_PROVIDER="${DATABASE_PROVIDER:-postgresql}"

echo "→ Generate Prisma client ..."
npm run db:generate

echo "→ Deploy migrations ..."
npm run db:deploy


#──────────────────────────────────────────────Run Evolution Server ──────────


# Development with hot reload
npm run dev:server

# Production build and run
npm run build
npm run start:prod