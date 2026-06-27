#!/bin/bash
set -e

cd "$(dirname "$0")"

# Map Replit's DATABASE_URL to Evolution API's expected variable
if [ -n "$DATABASE_URL" ]; then
  export DATABASE_CONNECTION_URI="$DATABASE_URL"
fi

# Run DB migrations
DATABASE_PROVIDER=postgresql node runWithProvider.js "rm -rf ./prisma/migrations && cp -r ./prisma/postgresql-migrations ./prisma/migrations && npx prisma migrate deploy --schema ./prisma/postgresql-schema.prisma" 2>&1 || true

# Start the server
node dist/main.js
