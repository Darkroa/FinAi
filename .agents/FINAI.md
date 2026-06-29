# FinAi — AI-Powered Financial Intelligence Platform

## Project Overview

FinAi is a full-stack AI-powered financial trading platform built with FastAPI (backend) and React + Vite (frontend). It provides real-time market intelligence, automated trading bots (FinBot + FinEventAI), a full wallet system, KYC/profile management, exchange connections, subscription tiers, and a comprehensive admin panel.

---

## CSS / Styling Notes

- **Tailwind v4 + CSS Layer**: `index.css` puts the `box-sizing` reset inside `@layer base` so Tailwind utility classes (`mx-auto`, `px-*`, `gap-*`, etc.) in `@layer utilities` always take precedence. Never write bare CSS resets outside a layer — they would silently override all Tailwind spacing/margin/padding utilities.
- **DashboardLayout**: `<main>` wraps `<Outlet />` in `max-w-5xl mx-auto w-full px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6` — all app pages are automatically constrained and centered. Individual pages do NOT need their own outer centering wrappers (`ProfilePage` keeps `max-w-2xl` for its narrower form layout).
- **Page h1 headings**: All app pages use `text-xl font-bold text-[#eaecef]` as the standard page title style.
- **Design system**: Binance-style dark theme — backgrounds `#0b0e11` / `#161a1e` / `#1e2329`, borders `#2b3139`, gold `#f0b90b`, green `#0ecb81`, red `#f6465d`, text `#eaecef`, muted `#848e9c`.

---

## Architecture

```
├── frontend/                        # React + Vite + Tailwind CSS (port 5000)
│   ├── src/
│   │   ├── components/              # AI signals + chat panel (FloatingAIButton)
│   │   ├── layouts/                 # DashboardLayout (sidebar, topbar, live ticker, notification bell)
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Public marketing page
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx    # Balance hero, 4 stats, portfolio chart, AI Events
│   │   │   ├── MarketsPage.tsx      # Table/grid toggle, filter by type
│   │   │   ├── TradePage.tsx        # Pair selector, chart, order form, order book, open positions
│   │   │   ├── WalletPage.tsx       # Deposit/Withdraw/P2P/VPS/Asset (5 tabs)
│   │   │   ├── TransactionHistoryPage.tsx
│   │   │   ├── BotsPage.tsx         # FinBot + FinEventAI bots, portfolio summary, trade log
│   │   │   ├── ProfilePage.tsx      # 3 tabs: Personal / FinAPI (keys, exchange logos) / Security
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── SupportPage.tsx      # Ticket system + live chat
│   │   │   ├── AdminPage.tsx        # Full admin panel (7 tabs)
│   │   │   ├── AdminFullDashboard.tsx
│   │   │   ├── PricingPage.tsx      # Subscription plan cards
│   │   │   ├── OpenPositionsPage.tsx
│   │   │   ├── NewsPage.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── ChatFinPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── StorePage.tsx
│   │   │   └── FinApiPage.tsx
│   │   ├── store/                   # Zustand auth store (authStore.ts) — full User type, persisted as `finai-auth`
│   │   ├── hooks/                   # useLivePrices.ts (CoinGecko live BTC/ETH)
│   │   ├── lib/                     # api.ts (all Axios API calls), utils.ts
│   │   └── App.tsx                  # React Router v7 with all routes
│   ├── vite.config.ts               # Proxy: /api → localhost:8000
│   └── package.json
├── src/
│   ├── api/
│   │   ├── main.py                  # FastAPI app entry, startup/shutdown hooks, scheduler
│   │   ├── routes.py                # All REST endpoints (~7000 lines)
│   │   └── middleware.py
│   ├── auth/                        # JWT auth (auth.py, dependencies.py)
│   ├── celery_app/                  # Celery tasks (eager mode — no Redis required)
│   ├── database/
│   │   ├── models.py                # All ORM models
│   │   └── session.py               # SQLAlchemy session + get_db + DB URL resolution
│   ├── notifications/               # scheduler.py (SL/TP checks, daily summary, price alerts)
│   ├── trading/
│   │   ├── trade_bot.py             # FinBot — TradingBotInstance + UserBotManager
│   │   ├── fin_event_bot.py         # FinEventAI — event-driven bot + FinEventBotManager
│   │   └── backtester.py
│   └── users/                       # CRUD, API key management
└── start.sh                         # Entry: FastAPI (8000) + Vite (5000)
```

---

## Tech Stack

- **Backend**: FastAPI + Uvicorn (port 8000)
- **Frontend**: React 19 + Vite + Tailwind CSS v4 (port 5000)
- **State**: Zustand (auth store, persisted to localStorage as `finai-auth`)
- **Routing**: React Router v7
- **Charts**: Recharts
- **QR Codes**: react-qr-code (wallet deposit addresses)
- **HTTP Client**: Axios (proxied `/api → localhost:8000`)
- **Database**: PostgreSQL via `DATABASE_URL` (Supabase-managed)
- **Task Queue**: Celery (eager mode — no Redis required)
- **AI Providers**: GitHub Models, OpenAI, Groq, Grok, DeepSeek, Google Studio
- **AI Router**: `src/utils/keymodel.py` — single source for all 8 AI providers; `llm.py` is a shim; all modules must import from `keymodel`
- **Vector DB**: ChromaDB (RAG)
- **Notifications**: Telegram, WhatsApp, Slack, Email

---

## Default Credentials

- **Admin**: `admin@finai.com` / `Admin@FinAi2024!`
- **Seeded Admin**: `AdminfinAi@gmail.com` / `FineAdminpass1` (Tier 3, auto-seeded on startup)
- All new users start with $0.00 USDT balance, Tier 0

---

## Account Tier System

| Tier | Label       | Notes                                             |
|------|-------------|---------------------------------------------------|
| 0    | Unverified  | Default; no withdrawals, no API keys              |
| 1    | Tier 1      | KYC approved by admin; $500/day withdraw, 1 key   |
| 2    | Tier 2      | Admin sets; $5,000/day withdraw                   |
| 3    | Tier 3 / Subscriber | Full access; FinEventAI bots unlocked    |

---

## BotsPage Architecture

### FinBot (`trade_bot.py` → `TradingBotInstance` / `UserBotManager`)

- Strategies: `live`, `finlux`, `sma` (default)
- Key parameters sent from frontend: `ticker`, `initial_capital`, `risk_per_trade_pct`, `max_drawdown_pct`, `strategy`, `take_profit_pct`, `stop_loss_pct`, `direction`, `bot_name`, `leverage`, `sl_usdt`, `lot_size`, `num_trades`, `execution_cooldown`
- **num_trades behavior**: `0` = unlimited; when limit reached, bot does NOT stop — it blocks new opens but stays running to manage open position and for manual stop. Same as FinEvent behavior.
- **execution_cooldown**: Seconds to wait between trade closes and next re-entry. Applied in all strategies. Default 40s.
- **opened_trades**: Counts how many positions have been opened (incremented in `_open_position`).
- **last_close_time**: Set in `_close_position`; used with `execution_cooldown` to gate re-entry.
- **trade_limit_reached**: Exposed in `get_status`; True when `completed_trades >= num_trades > 0`.
- **Price chart**: Built from `price_history[-120:]` + `price_timestamps`; entry/exit markers from `trades[-30:]`.
- Trade log split: FinBot trades filtered by excluding `'fineventai'` in `reason` field; FinEvent trades shown in separate card.

### FinEventAI (`fin_event_bot.py` → `FinEventBot` / `FinEventBotManager`)

- Event-driven: generates AI market events every 5 min, trades on high-impact news.
- Key parameters: `tickers` (multi-select), `leverage`, `take_profit_pct`, `stop_loss_pct`, `num_trades`, `capital_per_trade`, `min_impact_score`, `max_trades_per_day`
- **opened_trades**: Increments on each new position open; gated against `num_trades`.
- **trade_limit_reached**: When `opened_trades >= num_trades > 0`; bot stays running, just blocks new opens.
- **TP/SL monitor**: `_check_tp_sl()` runs every poll cycle and auto-closes positions that hit their thresholds.
- **Price chart per open position**: `_price_history` dict keyed by ticker; populated in `_loop` every 30s; exposed as `price_chart` + `entry_markers` + `exit_markers` inside each open position in `get_status`.

### UI Layout (BotsPage.tsx ~1844 lines)

- **Header row**: Stop All | FinEvent toggle | Add FinBot | Refresh
- **Portfolio summary card**: 4 boxes (Portfolio Value, Win Rate, Unrealized P&L, Realized P&L) — shown above the active bots grid
- **FinBot config panel** (when open):
  - Row 1 (3-col): Lot Size | % Per Trade | Max Drawdown
  - Row 2 (3-col): Take Profit | Stop Loss | Exec Cooldown
  - Leverage buttons (full-width)
  - Number of Trades
  - Margin Calculator (second to last)
  - Config Summary + Launch button (last)
- **Active bot cards** (2-col grid on desktop): header with compact stats (TP/SL/Lev/NOE), price + signal row, live price chart, stats row, open position details, recent trades
- **FinEventAI section**: multi-select ticker grid, per-bot status row (tickers on separate line from status text), open positions with live price chart
- **STOP ALL**: visible when any FinBot OR any FinEvent bot is running
- **BotPriceChart component** (line ~110): renders `price_chart` with entry (green dots) and exit (red dots) markers using Recharts ComposedChart

### Key helper functions in BotsPage.tsx

- `fmtC(n)` — compact currency (K/M suffix)
- `fmt(n)` — full number with 2 decimals
- `EMPTY_PARAMS` — default form state for new bot config
- `TICKERS` — constant list of supported tickers

---

## Database Models (key)

- **User** — email, hashed_password, name fields, username, phone, dob, sex, address, country, profile_photo, is_mail_verified, account_tier, kyc_status, balance_usdt, exchange_connections (JSON), profile_locked, transfer_pin, pending_deletion
- **APIKey** — user_id, key_name, api_key, purpose, expires_at
- **Transaction** — unified: deposit/withdrawal/p2p_send/p2p_receive/trade/vps/asset
- **WalletConfig** — key/value store for deposit addresses + bank details (admin-managed)
- **SupportTicket** + **SupportMessage** — ticket system with admin reply
- **Notification** — broadcast to all or specific user
- **Event**, **TrendAnalysis**, **TradeLog** — market intelligence; `TradeLog` has `is_event_bot` BOOLEAN, `take_profit` FLOAT, `stop_loss` FLOAT columns added via startup migration in `main.py`
- **Position** — open positions with lot_size, entry_price, leverage, margin, etc.

---

## Key API Endpoints

### Auth
- `POST /api/auth/login` → JWT `access_token`
- `POST /api/auth/signup`
- `GET /api/users/me` — full user profile

### FinBot
- `POST /api/bots/start` — StartBot model: ticker, initial_capital, strategy, take_profit_pct, stop_loss_pct, leverage, lot_size, num_trades, execution_cooldown, direction, bot_name, max_drawdown_pct, risk_per_trade_pct, sl_usdt
- `POST /api/bots/stop?ticker=ALL` — stops all FinBots (and cascades to FinEvent)
- `GET /api/bots/status` — all bot statuses for current user
- `POST /api/bots/close-position` — manual position close

### FinEventAI
- `POST /api/fin-event/start` — start a FinEvent bot
- `POST /api/fin-event/stop` — stop by bot_name
- `GET /api/fin-event/status` — all FinEvent bots for current user

### Wallet
- `GET /api/wallet/config` — deposit addresses + bank details
- `POST /api/wallet/deposit` — submit deposit request (pending admin approval)
- `POST /api/wallet/withdraw` — submit withdrawal (deducts balance immediately)
- `POST /api/wallet/p2p` — instant transfer to another user by email
- `GET /api/wallet/transactions`

### Admin (requires admin JWT)
- `GET /api/admin/users` / `POST /api/admin/update-user`
- `GET /api/admin/transactions` + approve/reject
- `GET/POST /api/admin/wallet-config`
- `GET /api/admin/health`
- `POST /api/admin/notifications`

### Support
- `POST /api/support/tickets` — create ticket
- `GET /api/support/tickets` — list user tickets
- `POST /api/support/tickets/{id}/reply`

---

## Auth Flow

1. `POST /api/auth/login` → receives `access_token`
2. `GET /api/users/me` → full user object cached in Zustand
3. All calls: `Authorization: Bearer <token>` via Axios interceptor
4. 401 → auto-logout (except `/public/` endpoints using API key Bearer auth)

---

## Supported Exchanges (bot trading)

Binance, Bybit, KuCoin, OKX, Kraken, Coinbase — connect via Profile → FinAPI tab with API key + secret (+ passphrase for OKX/KuCoin)

---

## Floating AI Button

Fixed bottom-right button (gold ⚡ icon) opens a panel with:
- **AI Signals tab**: Live signals for BTC, ETH, NVDA, SPY with confidence bars
- **Chat tab**: AI assistant for market analysis questions
