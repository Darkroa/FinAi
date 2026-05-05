# FinAi — AI-Powered Financial Intelligence Platform

## Project Overview

FinAi is a full-stack AI-powered financial trading platform built with FastAPI (backend) and React + Vite (frontend). It provides real-time market intelligence, automated trading bots, a full wallet system, KYC/profile management, exchange connections, and a comprehensive admin panel.

## Architecture

```
├── frontend/                # React + Vite + Tailwind CSS frontend (port 5000)
│   ├── src/
│   │   ├── components/      # FloatingAI.tsx (AI signals + chat popup)
│   │   ├── layouts/         # DashboardLayout (sidebar, topbar, live ticker, notification bell)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MarketsPage.tsx
│   │   │   ├── TradePage.tsx
│   │   │   ├── WalletPage.tsx            # Deposit/Withdraw/P2P/VPS/Asset
│   │   │   ├── TransactionHistoryPage.tsx
│   │   │   ├── BotsPage.tsx
│   │   │   ├── ProfilePage.tsx           # 3 tabs: Personal / FinAPI (API keys, exchange logos, webhooks) / Security
│   │   │   ├── SettingsPage.tsx          # Remaining user settings
│   │   │   ├── SupportPage.tsx           # Ticket system + live chat
│   │   │   └── AdminPage.tsx             # Full admin panel (7 tabs)
│   │   ├── store/           # Zustand auth store (authStore.ts) — full User type
│   │   ├── hooks/           # useLivePrices.ts (CoinGecko live BTC/ETH)
│   │   ├── lib/             # api.ts (all API calls), utils.ts
│   │   └── App.tsx          # React Router with all routes
│   ├── vite.config.ts
│   └── package.json
├── src/
│   ├── api/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── routes.py        # All REST endpoints (auth, wallet, KYC, admin, support)
│   │   └── middleware.py
│   ├── analysis/
│   ├── auth/                # JWT auth (auth.py, dependencies.py)
│   ├── celery_app/          # Celery tasks (eager mode when no Redis)
│   ├── database/
│   │   ├── models.py        # User, APIKey, Transaction, WalletConfig, SupportTicket, SupportMessage, etc.
│   │   └── session.py       # SQLAlchemy session + get_db
│   ├── ingestion/
│   ├── notifications/
│   ├── rag/
│   ├── trading/
│   └── users/               # CRUD, API key management, bot manager
└── start.sh                 # Entry: FastAPI (8000) + Vite (5000)
```

## Tech Stack

- **Backend**: FastAPI + Uvicorn (port 8000)
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 (port 5000)
- **State**: Zustand (auth store, persisted to localStorage as `finai-auth`)
- **Routing**: React Router v7
- **Charts**: Recharts
- **QR Codes**: react-qr-code (wallet deposit addresses)
- **HTTP Client**: Axios (proxied to FastAPI via Vite proxy `/api → localhost:8000`)
- **Database**: PostgreSQL (Replit managed, via DATABASE_URL)
- **Task Queue**: Celery (eager mode — no Redis required)
- **AI**: Grok (primary) + OpenAI (fallback)
- **Vector DB**: ChromaDB (RAG)
- **Notifications**: Telegram, WhatsApp, Slack, Email

## Default Credentials

- **Admin**: `admin@finai.com` / `Admin@FinAi2024!`
- All new users start with $0.00 USDT balance, Tier 0

## Supported Exchanges (for bot trading)

Binance, Bybit, KuCoin, OKX, Kraken, Coinbase — connect via Settings page with API key + secret (+ passphrase for OKX/KuCoin)

## Account Tier System

| Tier | Label       | Requirements           | Limits                          |
|------|-------------|------------------------|---------------------------------|
| 0    | Unverified  | Default                | No withdrawals, no API keys     |
| 1    | Tier 1      | KYC approved by admin  | $500/day withdraw, 1 API key    |
| 2    | Tier 2      | Admin sets             | $5,000/day withdraw, 5 API keys |
| 3    | Tier 3      | Admin sets             | Unlimited, priority support     |

## Database Models

- **User** — email, hashed_password, first/middle/last name, username, phone, dob, sex, address, country, profile_photo, is_mail_verified, email_verify_code, account_tier, kyc_status, balance_usdt, exchange_connections (JSON), profile_locked, transfer_pin (bcrypt), pending_deletion
- **APIKey** — user_id, key_name, api_key, purpose, expires_at
- **Transaction** — unified table: deposit/withdrawal/p2p_send/p2p_receive/trade/vps/asset
- **WalletConfig** — key/value store for deposit addresses and bank details (admin-managed)
- **SupportTicket** + **SupportMessage** — ticket system with admin reply
- **Notification** — broadcast to all users or specific user
- **Event**, **TrendAnalysis**, **TradeLog** — market intelligence

## UI Design System

All pages use a consistent mobile-first design with:
- **LandingPage**: Full navbar + hero with grid bg + glow blobs, stats bar, features grid (3-col), live market snapshot, pricing cards, CTA, footer
- **DashboardPage**: Balance hero card with gradient, 4 quick-stat cards (2-col mobile / 4-col desktop), portfolio chart + live BTC/ETH price widget, Bot status + AI Events + Open Positions row
- **MarketsPage**: Toggle between table/grid views; mobile shows card list (no scroll overflow); filter by crypto/stocks/all
- **TradePage**: Pair selector dropdown, 24h stats bar, chart with TF buttons, order form with % quick-fill, order book with depth bars, open orders tab
- **WalletPage**: Balance hero card with deposit/withdraw quick buttons, 5-tab grid (Deposit/Withdraw/P2P/VPS/Asset), mobile-friendly tab labels (icon + text stacked)
- **TransactionHistoryPage**: 3 summary stat cards, mobile = card list view, desktop = table view; filter bar with search + type chips
- **BotsPage**: Bot control card + 4 P&L stat cards + AI training banner + trade log table
- **ProfilePage**: 3-tab (Personal/FinAPI/Security) with Tier banner — unchanged from previous rewrite
- **SettingsPage**: Simplified to Notifications toggles + App Preferences + Language/Region + Security redirect note (exchange/API moved to Profile)
- **SupportPage**: 3-col grid (1/3 ticket list + 2/3 chat panel) — unchanged

## Key API Endpoints

### Auth
- `POST /api/auth/login` — returns JWT access_token
- `POST /api/auth/signup`
- `GET /api/users/me` — full user profile

### Profile/KYC
- `POST /api/users/update-profile` — update name, phone, dob, etc.
- `POST /api/users/upload-photo` — multipart photo upload
- `POST /api/users/send-verify-email` — sends code (returns dev_code in response)
- `POST /api/users/verify-email` — confirm code
- `POST /api/users/submit-kyc` — submit for admin review
- `POST /api/users/exchange-connect` — add exchange API keys
- `DELETE /api/users/exchange-disconnect/{exchange}`

### Wallet
- `GET /api/wallet/config` — deposit addresses + bank details (public)
- `POST /api/wallet/deposit` — submit deposit request (pending admin approval)
- `POST /api/wallet/withdraw` — submit withdrawal (deducts balance immediately)
- `POST /api/wallet/p2p` — instant transfer to another user by email
- `GET /api/wallet/transactions` — user's transaction history

### Admin (requires admin JWT)
- `GET /api/admin/users`
- `POST /api/admin/update-user` — edit balance, tier, KYC status, ban/unban
- `GET /api/admin/transactions` + approve/reject
- `GET/POST /api/admin/wallet-config` — manage deposit addresses
- `GET /api/admin/api-key-users`
- `GET/POST /api/admin/support-tickets` + reply + status update
- `GET /api/admin/health` — live health check (DB, Celery, CoinGecko, Binance)
- `POST /api/admin/notifications` — push to all users or specific user

### Support
- `POST /api/support/tickets` — create ticket with first message
- `GET /api/support/tickets` — list user's tickets
- `GET /api/support/tickets/{id}` — messages
- `POST /api/support/tickets/{id}/reply`

### API Keys
- `POST /api/api-keys` — requires is_mail_verified=True AND account_tier >= 1
- `GET /api/api-keys`
- `DELETE /api/api-keys/{id}`

## Color Palette (Binance-style dark theme)

- Background: `#0b0e11`
- Surface: `#161a1e`
- Card: `#1e2329`
- Border: `#2b3139`
- Yellow/Gold: `#f0b90b`
- Green: `#0ecb81`
- Red: `#f6465d`
- Text: `#eaecef`
- Muted: `#848e9c`

## Auth Flow

1. POST `/api/auth/login` → receives `access_token`
2. GET `/api/users/me` → full user object cached in Zustand
3. All subsequent calls: `Authorization: Bearer <token>` via Axios interceptor
4. 401 responses auto-logout (except `/public/` endpoints which use API key Bearer auth)

## Floating AI Button

Fixed bottom-right button (yellow, ⚡ icon) opens a panel with:
- **AI Signals tab**: Live signals for BTC, ETH, NVDA, SPY with confidence bars
- **Chat tab**: AI assistant for market analysis questions
