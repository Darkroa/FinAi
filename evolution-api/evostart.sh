#!/usr/bin/env bash
set -euo pipefail

echo "=== Evolution API Build & Deploy ======="

# ========================== Evolution API Setup ==========================
EVO_VERSION="2.3.7"
EVO_DIR="/home/runner/workspace/evolution-api"

echo "→ Setting up Evolution API v${EVO_VERSION}..."

mkdir -p "$(dirname "$EVO_DIR")"

if [ -d "$EVO_DIR/.git" ]; then
    echo "   📂 Evolution API folder exists, checking version..."
    cd "$EVO_DIR"
    
    git fetch --tags --force --quiet
    
    CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "unknown")
    
    if [ "$CURRENT_TAG" = "$EVO_VERSION" ]; then
        echo "   ✅ Already at v${EVO_VERSION}"
    else
        echo "   ♻️  Switching to v${EVO_VERSION}..."
        git checkout -q "$EVO_VERSION" 2>/dev/null || {
            echo "   🔄 Fetching tag..."
            git fetch origin tag "$EVO_VERSION" --no-tags
            git checkout -q "$EVO_VERSION"
        }
        echo "   ✅ Successfully switched to v${EVO_VERSION}"
    fi
else
    echo "   📦 Cloning Evolution API v${EVO_VERSION}..."
    git clone --depth 1 --branch "$EVO_VERSION" \
        https://github.com/EvolutionAPI/evolution-api.git "$EVO_DIR"
    echo "   ✅ Clone completed"
fi

echo "→ Evolution API v${EVO_VERSION} is ready"

# ====================== Dependencies & Build ======================
cd "$EVO_DIR"

echo "→ Installing dependencies..."
npm ci

echo "→ Building evolution ..."
npm run build

echo "✅ Evolution API built successfully!"

# ====================== Database Migration ======================
echo "→ Running dbPrisma Migration ..."

export DATABASE_PROVIDER="${DATABASE_PROVIDER:-postgresql}"

echo "→ Generate Prisma client ..."
npm run db:generate

echo "→ Deploy migrations ..."
npm run db:deploy || { echo "❌ Database migration failed"; exit 1; }

echo "✅ Database migration completed"

# ====================== Start Production Server ======================
echo "→ Starting Evolution API production server ..."

if npm run start:prod; then
    echo "✅ Evolution API started successfully! (v${EVO_VERSION})"
else
    echo "❌ Evolution API failed to start!"
    exit 1
fi