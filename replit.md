# FinAi — AI-Powered Financial Intelligence Platform

## Project Overview

FinAi is a full-stack AI-powered financial trading platform built with FastAPI (backend) and React + Vite (frontend). It ingests real-time financial news, performs Grok-powered sentiment analysis, detects market events, and executes automated trading strategies.

## Architecture

```
├── frontend/                # React + Vite + Tailwind CSS frontend (port 5000)
│   ├── src/
│   │   ├── layouts/         # DashboardLayout (sidebar, topbar, ticker)
│   │   ├── pages/           # LoginPage, DashboardPage, MarketsPage, TradePage, WalletPage, SettingsPage, AdminPage
│   │   ├── store/           # Zustand auth store (authStore.ts)
│   │   ├── lib/             # api.ts (axios client), utils.ts
│   │   └── App.tsx          # React Router setup with private routes
│   ├── vite.config.ts       # Vite config — port 5000, proxy /api → localhost:8000
│   └── package.json
├── src/
│   ├── api/             # FastAPI backend (main.py, routes.py, middleware.py)
│   ├── analysis/        # AI analysis modules (sentiment, forecaster, trendline, impact)
│   ├── auth/            # JWT authentication (auth.py, dependencies.py)
│   ├── celery_app/      # Celery task queue (__init__.py auto-detects Redis, tasks.py)
│   ├── conversation/    # Conversational AI agent
│   ├── database/        # SQLAlchemy models and session (PostgreSQL)
│   ├── event/           # Market event detection
│   ├── frontend/        # Legacy Streamlit pages (kept for reference)
│   ├── ingestion/       # News scrapers (RSS, NewsAPI, AlphaVantage)
│   ├── notifications/   # Multi-channel alerts (Telegram, WhatsApp, Slack, Email)
│   ├── rag/             # Retrieval-Augmented Generation (ChromaDB)
│   ├── trading/         # Trading bots and Alpaca/Binance broker integrations
│   └── users/           # User CRUD, API key management, bot manager
├── admin/               # Legacy Streamlit admin dashboard (kept for reference)
├── migrations/          # Alembic database migrations
└── start.sh             # Entry point: starts FastAPI (port 8000) + React frontend (port 5000)
```

## Tech Stack

- **Backend**: FastAPI + Uvicorn (port 8000)
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui radix primitives (port 5000)
- **State**: Zustand (auth store, persisted to localStorage)
- **Routing**: React Router v7
- **Charts**: Recharts
- **HTTP Client**: Axios (proxied to FastAPI via Vite proxy)
- **Database**: PostgreSQL (Replit managed, via DATABASE_URL)
- **Task Queue**: Celery — auto-detects Redis; falls back to synchronous eager mode when Redis is unavailable
- **AI**: Grok (primary via langchain-groq) + OpenAI (fallback/embeddings)
- **Vector DB**: ChromaDB (RAG)
- **Trading**: Alpaca (paper + live), Binance via python-binance
- **Notifications**: Telegram, Twilio WhatsApp, Slack, Email

## Running the App

The main workflow runs `start.sh`:

```bash
# Kills existing processes on ports 8000 and 5000
# Starts FastAPI backend on port 8000 (background)
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
# Starts React (Vite) frontend on port 5000 (foreground)
cd frontend && npm run dev
```

## Environment Variables (Secrets)

| Key | Required | Description |
|-----|----------|-------------|
| `GROK_API_KEY` | Yes | Groq API key for Grok LLM (console.groq.com) |
| `OPENAI_API_KEY` | Recommended | OpenAI fallback + embeddings (platform.openai.com) |
| `JWT_SECRET_KEY` | Yes | Secret for signing JWT tokens (any long random string) |
| `DATABASE_URL` | Auto | Set automatically by Replit PostgreSQL |
| `NEWSAPI_KEY` | Optional | NewsAPI.org for live financial news |
| `ALPHA_VANTAGE_KEY` | Optional | AlphaVantage market data |
| `ALPACA_API_KEY` | Optional | Alpaca trading (paper/live) |
| `ALPACA_SECRET_KEY` | Optional | Alpaca trading secret |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram trade alerts |
| `TELEGRAM_CHAT_ID` | Optional | Telegram target chat |
| `TWILIO_ACCOUNT_SID` | Optional | WhatsApp alerts via Twilio |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth |

## Default Credentials

- **Admin**: `admin@finai.io` / `admin123!`
- **Demo user**: `tomiwakhalifa@gmail.com` (no password hash set — login bypasses password check currently)

## Key Design Decisions

### Redis-Free Celery Mode
`src/celery_app/__init__.py` probes Redis at startup. If Redis is not available (as on Replit free tier), Celery automatically runs in `task_always_eager=True` mode — tasks execute synchronously inline without needing a broker.

### API Proxy
Vite's dev server proxies all `/api/*` requests to FastAPI on port 8000. No CORS issues, no hardcoded URLs.

### Auth Flow
1. React `LoginPage` POSTs to `/api/auth/login` → receives `access_token`
2. Immediately GETs `/api/users/me` with the new token → receives full user object
3. Stores both token + user in Zustand (persisted to localStorage as `finai-auth`)
4. All subsequent API calls use the Bearer token via Axios interceptor

### Color Palette (Binance-style)
- Background: `#0b0e11`
- Surface: `#161a1e`
- Card: `#1e2329`
- Border: `#2b3139`
- Yellow/Gold: `#f0b90b`
- Green: `#0ecb81`
- Red: `#f6465d`
- Text: `#eaecef`
- Muted: `#848e9c`

### Pages
- `/login` — Auth page (Sign In / Sign Up tabs, Google/Apple social buttons)
- `/dashboard` — Portfolio overview, performance chart, open positions, AI events feed
- `/markets` — Market table with sparklines (BTC, ETH, stocks)
- `/trade` — Price chart + order form + order book (BTC/USDT)
- `/wallet` — Asset balances, deposit address, withdrawal form, transaction history
- `/settings` — Profile, security, notifications, API keys
- `/admin` — Admin-only: users table + transaction approve/reject panel
