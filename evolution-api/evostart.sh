#!/usr/bin/env bash
set -euo pipefail

echo "=== Evolution Api Build ======="
#=====================================#


EVO_VERSION="2.3.7"
EVO_DIR="/home/runner/workspace/evolution-api"

echo "→ Setting up Evolution API v${EVO_VERSION}..."

# Create parent directory if it doesn't exist
mkdir -p "$(dirname "$EVO_DIR")"

if [ -d "$EVO_DIR/.git" ]; then
    echo "   📂 Evolution API folder exists, checking version..."
    cd "$EVO_DIR"
    
    # Fetch latest tags
    git fetch --tags --force --quiet
    
    CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "unknown")
    
    if [ "$CURRENT_TAG" = "$EVO_VERSION" ]; then
        echo "   ✅ Already at v${EVO_VERSION}"
    else
        echo "   ♻️  Switching to v${EVO_VERSION}..."
        git checkout -q "$EVO_VERSION" 2>/dev/null || {
            echo "   🔄 Version not found locally, fetching..."
            git fetch origin tag "$EVO_VERSION" --no-tags
            git checkout -q "$EVO_VERSION"
        }
        echo "   ✅ Successfully switched to v${EVO_VERSION}"
    fi
else
    echo "   📦 Cloning Evolution API v${EVO_VERSION} for the first time..."
    git clone --depth 1 --branch "$EVO_VERSION" \
        https://github.com/EvolutionAPI/evolution-api.git "$EVO_DIR"
    echo "   ✅ Clone completed"
fi

echo "→ Evolution API v${EVO_VERSION} is ready"



# Go to workspace root
cd /home/runner/workspace

#─────────────────────────────────────────── Evolution API Install ────────────────────────

echo "→ Installing evolution-api dependencies..."
cd evolution-api


npm ci --omit=dev

echo "→ Building evolution ..."
npm run build

echo "✅ Evolution API built successfully to dist/"


#───────────────────────────────────────────────Evolution db───────────────

echo "→ Running dbPrisma Migration ..."

# Always set it (with fallback)
export DATABASE_PROVIDER="${DATABASE_PROVIDER:-postgresql}"

echo "→ Generate Prisma client ..."
npm run db:generate

echo "→ Deploy migrations ..."
npm run db:deploy || { echo "❌ Database migration failed"; exit 1; }

echo "✅ Database migration completed"


#──────────────────────────────────────────────Run Evolution Server ──────────


echo "→ Building production app ..."
npm run build

echo "→ Starting production server ..."
npm run start:prod





