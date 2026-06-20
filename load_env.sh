#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  FinAi — Environment Loader
#  Usage:
#    source load_env.sh            → export current project env
#    source load_env.sh .env.local → also load a .env file
#    bash load_env.sh --show       → print non-secret env summary
#    bash load_env.sh --check      → validate required keys exist
# ─────────────────────────────────────────────────────────────

set -a  # auto-export everything we set

# ── 1. Core paths ────────────────────────────────────────────
export PYTHONPATH="/home/runner/workspace"
export PATH="/home/runner/workspace/.pythonlibs/bin:$PATH"

# ── 2. App ports / URLs ──────────────────────────────────────
export PORT="${PORT:-8000}"
export VITE_PORT="${VITE_PORT:-5000}"
export API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api}"

# ── 3. Load .env file if supplied or if .env exists ──────────
_ENV_FILE="${1:-}"
if [[ -z "$_ENV_FILE" && -f ".env" ]]; then
  _ENV_FILE=".env"
fi

if [[ -n "$_ENV_FILE" && -f "$_ENV_FILE" ]]; then
  echo "📦 Loading env from: $_ENV_FILE"
  while IFS= read -r line || [[ -n "$line" ]]; do
    # skip blank lines and comments
    [[ -z "$line" || "$line" == \#* ]] && continue
    # strip inline comments
    line="${line%%#*}"
    line="${line%"${line##*[![:space:]]}"}"  # rtrim
    # only process KEY=VALUE lines
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
      _KEY="${line%%=*}"
      echo "  ✓ $_KEY"
    fi
  done < "$_ENV_FILE"
  echo ""
fi

set +a

# ── 4. --show mode ───────────────────────────────────────────
if [[ "$1" == "--show" ]]; then
  echo "══════════════════════════════════════════════════════"
  echo "  FinAi — Current Environment"
  echo "══════════════════════════════════════════════════════"
  echo "  PYTHONPATH           = $PYTHONPATH"
  echo "  API_BASE_URL         = $API_BASE_URL"
  echo "  PORT                 = $PORT"
  echo "  VITE_PORT            = $VITE_PORT"
  echo ""
  echo "  ── Database ──────────────────────────────────────"
  echo "  DATABASE_URL         = ${DATABASE_URL:+[SET]}"
  echo "  SUPABASE_URL         = ${SUPABASE_URL:+[SET]}"
  echo "  SUPABASE_KEY         = ${SUPABASE_KEY:+[SET]}"
  echo "  SUPABASE_DB_URL      = ${SUPABASE_DB_URL:+[SET]}"
  echo ""
  echo "  ── Auth / App ────────────────────────────────────"
  echo "  JWT_SECRET_KEY       = ${JWT_SECRET_KEY:+[SET]}"
  echo "  REDIS_URL            = ${REDIS_URL:-not set}"
  echo ""
  echo "  ── AI Providers (priority order) ─────────────────"
  echo "  GITHUB_API_KEY       = ${GITHUB_API_KEY:+[SET]}"
  echo "  GROQ_API_KEY         = ${GROQ_API_KEY:+[SET]}"
  echo "  NVIDIA_API_KEY       = ${NVIDIA_API_KEY:+[SET]}"
  echo "  GEMINI_API_KEY       = ${GEMINI_API_KEY:+[SET]}"
  echo "  OPENROUTER_API_KEY   = ${OPENROUTER_API_KEY:+[SET]}"
  echo "  DEEPSEEK_API_KEY     = ${DEEPSEEK_API_KEY:+[SET]}"
  echo "  OPENAI_API_KEY       = ${OPENAI_API_KEY:+[SET]}"
  echo "  GROK_API_KEY         = ${GROK_API_KEY:+[SET]}"
  echo ""
  echo "  ── Market Data ───────────────────────────────────"
  echo "  COINGECKO_API_KEY    = ${COINGECKO_API_KEY:+[SET]}"
  echo "  ALPACA_API_KEY       = ${ALPACA_API_KEY:+[SET]}"
  echo "  ALPACA_SECRET_KEY    = ${ALPACA_SECRET_KEY:+[SET]}"
  echo ""
  echo "  ── Email / SMS ───────────────────────────────────"
  echo "  SMTP_HOST            = ${SMTP_HOST:-smtp.gmail.com (default)}"
  echo "  SMTP_PORT            = ${SMTP_PORT:-587 (default)}"
  echo "  SMTP_USER            = ${SMTP_USER:+[SET]}"
  echo "  SMTP_PASSWORD        = ${SMTP_PASSWORD:+[SET]}"
  echo "  RESEND_API_KEY       = ${RESEND_API_KEY:+[SET]}"
  echo "  RESEND_FROM_EMAIL    = ${RESEND_FROM_EMAIL:-onboarding@resend.dev (default)}"
  echo "  TWILIO_ACCOUNT_SID   = ${TWILIO_ACCOUNT_SID:+[SET]}"
  echo "  TWILIO_AUTH_TOKEN    = ${TWILIO_AUTH_TOKEN:+[SET]}"
  echo "  TWILIO_WHATSAPP_NUMBER = ${TWILIO_WHATSAPP_NUMBER:+[SET]}"
  echo ""
  echo "  ── Notifications ─────────────────────────────────"
  echo "  TELEGRAM_BOT_TOKEN   = ${TELEGRAM_BOT_TOKEN:+[SET]}"
  echo "  WEBHOOK_URL          = ${WEBHOOK_URL:+[SET]}"
  echo "  TELEGRAM_WEBHOOK_SECRET = ${TELEGRAM_WEBHOOK_SECRET:+[SET]}"
  echo "══════════════════════════════════════════════════════"
  exit 0
fi

# ── 5. --check mode ──────────────────────────────────────────
if [[ "$1" == "--check" ]]; then
  echo "══════════════════════════════════════════"
  echo "  FinAi — Required Keys Check"
  echo "══════════════════════════════════════════"
  _MISSING=0
  _REQUIRED=(
    DATABASE_URL
    JWT_SECRET_KEY
    TELEGRAM_BOT_TOKEN
  )
  _RECOMMENDED=(
    GITHUB_API_KEY
    GROQ_API_KEY
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_WHATSAPP_NUMBER
    SMTP_USER
    SMTP_PASSWORD
    RESEND_API_KEY
  )
  echo "  Required:"
  for _K in "${_REQUIRED[@]}"; do
    if [[ -z "${!_K}" ]]; then
      echo "    ✗ $_K  ← MISSING"
      _MISSING=$((_MISSING + 1))
    else
      echo "    ✓ $_K"
    fi
  done
  echo "  Recommended:"
  for _K in "${_RECOMMENDED[@]}"; do
    if [[ -z "${!_K}" ]]; then
      echo "    ⚠ $_K  ← not set"
    else
      echo "    ✓ $_K"
    fi
  done
  echo "══════════════════════════════════════════"
  if [[ $_MISSING -gt 0 ]]; then
    echo "  ⚠  $_MISSING required key(s) missing. Add them in Replit Secrets."
    exit 1
  else
    echo "  ✅ All required keys are set."
    exit 0
  fi
fi

echo "✅ FinAi env loaded. Run 'bash load_env.sh --show' to inspect."
