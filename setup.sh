#!/bin/bash
# ================================================
# FinForgeAI - One-command Setup Script
# Run this after docker-compose up --build
# ================================================

set -e  # Exit on any error

echo "🚀 Starting FinForgeAI Setup...."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until PGPASSWORD=finpass psql -h postgres -U finuser -d finforge -c "SELECT 1;" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Create Alembic migrations directory if not exists
mkdir -p migrations/versions

# Generate initial migration (if none exists)
if [ ! -f "migrations/versions/*.py" ]; then
  echo "📝 Generating initial database migration..."
  alembic revision --autogenerate -m "initial migration: users, events, trend_analysis"
fi

# Apply all migrations
echo "🔄 Applying database migrations..."
alembic upgrade head

# Create default admin user
echo "👤 Creating default admin user..."
python scripts/setup_admin.py

# Create necessary data directories
echo "📁 Creating data directories..."
mkdir -p data/raw_news data/processed_events data/backtests data/chroma_db logs

echo ""
echo "================================================================"
echo "✅ FinForgeAI Setup Completed Successfully!"
echo "================================================================"
echo ""
echo "🔗 Access Points:"
echo "   • Main Chat UI:        http://localhost:7860"
echo "   • Trading Dashboard:   http://localhost:7861"
echo "   • Streamlit Dashboard: http://localhost:8501"
echo "   • Admin Panel:         http://localhost:8502"
echo "   • API Docs:            http://localhost:8000/docs"
echo ""
echo "👑 Default Admin Login:"
echo "   Email:    admin@finevent.ai"
echo "   Password: AdminChangeMe123!"
echo ""
echo "⚠️  IMPORTANT: Change the admin password immediately in the Admin Dashboard!"
echo ""
echo "🎉 You can now start using FinForgeAI!"
echo "================================================================"
