"""
FinEventAI Trading Bot
----------------------
Monitors the events table for high-impact financial news and automatically
executes trades based on event sentiment and configurable settings.

Self-contained: generates its own AI-driven market events every 5 minutes
using live prices so it works without the external Celery ingestion pipeline.
"""

import json
import re
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from src.database.models import Event, TradeLog, User
from src.database.session import SessionLocal
from src.trading.trade_bot import _fetch_live_price


# Human-readable display name for AI prompts (BTC-USD → BTC/USD)
def _display(ticker: str) -> str:
    return ticker.replace("-", "/")


class FinEventBot:
    """Runs in background, polls events table, trades on high-impact events."""

    POLL_SECONDS     = 30   # how often to check the events table for new trades
    GENERATE_SECONDS = 300  # generate new AI events every 5 minutes

    def __init__(
        self,
        user_id: int,
        user_email: str,
        min_impact_score: int = 7,
        tickers: List[str] = None,
        capital_per_trade: float = 500.0,
        max_trades_per_day: int = 10,
        paper: bool = True,
        sentiment_filter: str = "both",  # "bullish" | "bearish" | "both"
    ):
        self.user_id            = user_id
        self.user_email         = user_email
        self.min_impact_score   = min_impact_score
        self.tickers            = [t.upper() for t in (tickers or ["BTC-USD", "ETH-USD"])]
        self.capital_per_trade  = capital_per_trade
        self.max_trades_per_day = max_trades_per_day
        self.paper              = paper
        self.sentiment_filter   = sentiment_filter.lower()

        self.running         = False
        self._thread         = None
        self._gen_thread     = None
        self._trades_today   = 0
        self._last_day       = datetime.utcnow().date()
        self._processed_ids  = set()
        self.trades: List[dict] = []
        self.total_pnl       = 0.0
        self.started_at      = None
        self.events_generated = 0
        # key: ticker → {side: "long"|"short", entry_price, qty, margin, opened_at}
        self.open_positions: Dict[str, dict] = {}

    # ── Control ──────────────────────────────────────────────────────────────

    def start(self) -> str:
        if self.running:
            return "FinEventAI bot is already running."
        self.running    = True
        self.started_at = datetime.utcnow()

        # Trade-execution loop
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

        # Event-generation loop (runs immediately, then every 5 min)
        self._gen_thread = threading.Thread(target=self._generate_events_loop, daemon=True)
        self._gen_thread.start()

        mode = "PAPER" if self.paper else "LIVE"
        logger.success(
            f"🧠 FinEventAI [{mode}] started for {self.user_email} "
            f"| min_impact={self.min_impact_score} | tickers={self.tickers}"
        )
        return (
            f"FinEventAI bot started ({mode}) | "
            f"Min impact: {self.min_impact_score}/10 | "
            f"Tickers: {', '.join(self.tickers)} | "
            f"Capital/trade: ${self.capital_per_trade:,.2f} | "
            f"Generating AI events every 5 min"
        )

    def stop(self) -> str:
        self.running = False
        for t in (self._thread, self._gen_thread):
            if t and t.is_alive():
                t.join(timeout=5)
        logger.info(f"🛑 FinEventAI bot stopped for {self.user_email}")
        return "FinEventAI bot stopped."

    # ── Main trade-execution loop ─────────────────────────────────────────────

    def _loop(self):
        while self.running:
            try:
                self._poll_and_trade()
            except Exception as e:
                logger.error(f"FinEventAI loop error: {e}")
            time.sleep(self.POLL_SECONDS)

    def _poll_and_trade(self):
        now = datetime.utcnow()

        # Reset daily trade counter
        if now.date() != self._last_day:
            self._trades_today = 0
            self._last_day     = now.date()

        if self._trades_today >= self.max_trades_per_day:
            return

        with SessionLocal() as db:
            # Only process events created after bot started (prevents re-firing on restart)
            startup_cutoff = self.started_at or now
            cutoff = max(now - timedelta(hours=1), startup_cutoff)
            events = (
                db.query(Event)
                .filter(
                    Event.impact_score >= self.min_impact_score,
                    Event.created_at >= cutoff,
                )
                .order_by(Event.created_at.desc())
                .limit(20)
                .all()
            )

            for ev in events:
                if ev.id in self._processed_ids:
                    continue
                if self._trades_today >= self.max_trades_per_day:
                    break

                action = self._event_to_action(ev)
                if action is None:
                    self._processed_ids.add(ev.id)
                    continue

                affected      = [t.upper() for t in (ev.tickers_affected or [])]
                # Only trade tickers that match the event — never fall back to an unrelated ticker
                trade_tickers = [t for t in self.tickers if t in affected]
                if not trade_tickers:
                    self._processed_ids.add(ev.id)
                    continue

                for ticker in trade_tickers[:2]:
                    if self._trades_today >= self.max_trades_per_day:
                        break
                    self._execute_event_trade(db, ticker, action, ev)
                    self._trades_today += 1

                self._processed_ids.add(ev.id)
                if len(self._processed_ids) > 5000:
                    self._processed_ids = set(list(self._processed_ids)[-2000:])

    def _event_to_action(self, event) -> Optional[str]:
        """Map event sentiment → BUY / SELL / None."""
        sent = (event.sentiment or "").lower()
        if self.sentiment_filter == "bullish" and sent not in ("positive", "bullish"):
            return None
        if self.sentiment_filter == "bearish" and sent not in ("negative", "bearish"):
            return None
        if sent in ("positive", "bullish"):
            return "BUY"
        if sent in ("negative", "bearish"):
            return "SELL"
        return None

    # ── Event generation loop ─────────────────────────────────────────────────

    def _generate_events_loop(self):
        """Generate AI-driven market events immediately, then every 5 minutes."""
        # Immediate first run
        try:
            self._generate_live_events()
        except Exception as e:
            logger.error(f"FinEventAI initial event generation error: {e}")

        while self.running:
            time.sleep(self.GENERATE_SECONDS)
            if not self.running:
                break
            try:
                self._generate_live_events()
            except Exception as e:
                logger.error(f"FinEventAI event generation error: {e}")

    def _generate_live_events(self):
        """Fetch live prices for each ticker and ask AI to generate a market event."""
        logger.info(f"🧠 FinEventAI generating market events for {self.tickers}")
        for ticker in self.tickers[:3]:
            if not self.running:
                break
            try:
                price = _fetch_live_price(ticker)
                if price <= 0:
                    logger.warning(f"FinEventAI: no live price for {ticker}, skipping event gen")
                    continue
                event_data = self._ai_generate_event(ticker, price)
                if event_data:
                    self._save_generated_event(event_data, ticker)
                    self.events_generated += 1
            except Exception as e:
                logger.warning(f"FinEventAI event gen failed ({ticker}): {e}")

    def _ai_generate_event(self, ticker: str, price: float) -> Optional[dict]:
        """Ask the cloud AI to produce a structured market event for this ticker."""
        display = _display(ticker)

        prompt = (
            f"You are a financial market analyst. Generate one realistic market event for {display} "
            f"currently trading at ${price:,.4f}.\n\n"
            f"Reply with ONLY a valid JSON object — no explanation, no markdown fences — exactly:\n"
            f'{{\n'
            f'  "event_type": "one of: earnings|fed_decision|macro_data|technical_breakout|sector_news|geopolitical|institutional_flow",\n'
            f'  "title": "concise event headline under 80 chars",\n'
            f'  "description": "1-2 sentences describing the event and market impact",\n'
            f'  "sentiment": "positive or negative",\n'
            f'  "impact_score": <integer between 7 and 9>,\n'
            f'  "risk_level": "medium or high",\n'
            f'  "short_term_impact": "expected price reaction in next 1-4 hours",\n'
            f'  "tickers_affected": ["{ticker}"]\n'
            f'}}\n\n'
            f'Make the event realistic for current market conditions. Alternate between bullish and bearish events.'
        )

        try:
            from src.conversation.agent import chat_with_agent
            from src.utils.market_data import build_market_context

            pair_key = display + ("/USD" if "/" not in display else "")
            ctx = build_market_context(pair_key, price=price)
            reply = chat_with_agent(prompt, market_context=ctx)

            # Extract JSON from the reply (handle markdown fences or leading text)
            json_match = re.search(r'\{[\s\S]*?\}', reply)
            if not json_match:
                logger.warning(f"FinEventAI: no JSON in AI reply for {ticker}: {reply[:120]}")
                return None

            data = json.loads(json_match.group())

            # Validate required fields
            if not data.get("sentiment") or not data.get("title"):
                return None

            # Normalise sentiment
            sent = data["sentiment"].lower()
            if sent in ("positive", "bullish"):
                data["sentiment"] = "positive"
            elif sent in ("negative", "bearish"):
                data["sentiment"] = "negative"
            else:
                data["sentiment"] = "neutral"

            # Clamp impact_score to int 7-10
            data["impact_score"] = max(7, min(10, int(data.get("impact_score", 8))))

            # Ensure tickers_affected uses our ticker format (BTC-USD, not BTC/USD)
            raw_tickers = data.get("tickers_affected", [ticker])
            data["tickers_affected"] = [
                t.upper().replace("/", "-") for t in raw_tickers
            ]
            if ticker not in data["tickers_affected"]:
                data["tickers_affected"].insert(0, ticker)

            logger.info(
                f"🧠 FinEventAI AI event: [{data['sentiment'].upper()}] {data['title'][:60]} "
                f"| impact={data['impact_score']} | tickers={data['tickers_affected']}"
            )
            return data

        except json.JSONDecodeError as e:
            logger.warning(f"FinEventAI: JSON parse failed for {ticker}: {e}")
        except Exception as e:
            logger.warning(f"FinEventAI: AI call failed for {ticker}: {e}")
        return None

    def _save_generated_event(self, data: dict, ticker: str):
        """Save an AI-generated event to the Event table."""
        with SessionLocal() as db:
            ev = Event(
                event_type        = str(data.get("event_type", "market_signal"))[:100],
                title             = str(data.get("title", f"{ticker} market signal"))[:500],
                description       = str(data.get("description", ""))[:2000],
                tickers_affected  = data.get("tickers_affected", [ticker]),
                impact_score      = int(data.get("impact_score", 8)),
                sentiment         = str(data.get("sentiment", "neutral"))[:50],
                confidence        = 0.80,
                short_term_impact = str(data.get("short_term_impact", ""))[:500],
                risk_level        = str(data.get("risk_level", "medium"))[:50],
                published_date    = datetime.utcnow(),
            )
            db.add(ev)
            db.commit()
            db.refresh(ev)
            logger.info(
                f"💾 FinEventAI event saved: id={ev.id} | "
                f"{ev.sentiment.upper()} | score={ev.impact_score} | {ev.title[:50]}"
            )

    # ── Balance helpers ───────────────────────────────────────────────────────

    def _update_user_balance(self, delta: float):
        """Deduct (negative delta) or credit (positive delta) the user's platform balance."""
        if not self.user_id:
            return
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.id == self.user_id).first()
                if user:
                    user.balance_usdt = max(0.0, (user.balance_usdt or 0.0) + delta)
                    db.commit()
                    logger.debug(
                        f"FinEventAI balance update: delta={delta:+.4f} → "
                        f"new balance=${user.balance_usdt:,.4f}"
                    )
        except Exception as e:
            logger.error(f"FinEventAI balance update failed: {e}")

    # ── Trade execution ───────────────────────────────────────────────────────

    def _execute_event_trade(self, db: Session, ticker: str, action: str, event):
        """Log a trade driven by a financial event."""
        try:
            price = _fetch_live_price(ticker)
            qty   = round(self.capital_per_trade / price, 8) if price > 0 else 0.0

            reason = (
                f"FinEventAI | {event.event_type} | {event.title[:60]} | "
                f"Impact {event.impact_score}/10 | {event.sentiment}"
            )

            # ── Track open position (supports both long and short) ───────
            pnl_value = None
            existing  = self.open_positions.get(ticker)

            if action == "BUY":
                if existing and existing.get("side") == "short":
                    # Close existing short on bullish event
                    pnl_value = round((existing["entry_price"] - price) * existing["qty"], 4)
                    self.total_pnl = round(self.total_pnl + pnl_value, 4)
                    margin = existing.get("margin", self.capital_per_trade)
                    if not self.paper:
                        self._update_user_balance(max(0.0, margin + pnl_value))
                    self.open_positions.pop(ticker)
                elif not existing:
                    # Open new long position
                    self.open_positions[ticker] = {
                        "side":        "long",
                        "entry_price": price,
                        "qty":         qty,
                        "margin":      self.capital_per_trade,
                        "opened_at":   datetime.utcnow().isoformat(),
                    }
                    if not self.paper:
                        self._update_user_balance(-self.capital_per_trade)
            elif action == "SELL":
                if existing and existing.get("side") == "long":
                    # Close existing long on bearish event
                    pnl_value = round((price - existing["entry_price"]) * existing["qty"], 4)
                    self.total_pnl = round(self.total_pnl + pnl_value, 4)
                    margin = existing.get("margin", self.capital_per_trade)
                    if not self.paper:
                        self._update_user_balance(max(0.0, margin + pnl_value))
                    self.open_positions.pop(ticker)
                elif not existing:
                    # Open new short position
                    self.open_positions[ticker] = {
                        "side":        "short",
                        "entry_price": price,
                        "qty":         qty,
                        "margin":      self.capital_per_trade,
                        "opened_at":   datetime.utcnow().isoformat(),
                    }
                    if not self.paper:
                        self._update_user_balance(-self.capital_per_trade)

            log = TradeLog(
                user_id      = self.user_id,
                ticker       = ticker,
                action       = action,
                price        = price,
                qty          = qty,
                pnl          = pnl_value,
                reason       = reason,
                paper        = self.paper,
                exchange     = "EventBot",
            )
            log.is_event_bot = True  # excluded from manual open positions list
            db.add(log)
            db.commit()
            db.refresh(log)

            trade_rec = {
                "id":     log.id,
                "ticker": ticker,
                "action": action,
                "price":  price,
                "qty":    qty,
                "reason": reason,
                "time":   datetime.utcnow(),
                "paper":  self.paper,
                "pnl":    pnl_value,
            }
            self.trades.append(trade_rec)
            if len(self.trades) > 200:
                self.trades = self.trades[-200:]

            logger.success(
                f"⚡ FinEventAI {'PAPER' if self.paper else 'LIVE'} {action} "
                f"{ticker} @ ${price:,.4f} × {qty:.6f} | {event.title[:40]}"
            )

            self._notify_trade(ticker, action, price, qty, reason)

        except Exception as e:
            logger.error(f"FinEventAI trade error ({ticker} {action}): {e}")

    def _notify_trade(self, ticker: str, action: str, price: float, qty: float, reason: str):
        import os, threading as _th
        from src.database.models import Notification
        tok   = os.getenv("TELEGRAM_BOT_TOKEN")
        emoji = "🟢" if action == "BUY" else "🔴"
        mode  = "PAPER" if self.paper else "LIVE"
        notif_title = f"{emoji} FinEventAI — {ticker} {action}"
        notif_msg   = (
            f"{mode} {action} {qty:.6f} {ticker} @ ${price:,.4f}\n"
            f"Reason: {reason[:120]}"
        )
        msg = (
            f"{emoji} FinEventAI {mode} {action}\n"
            f"Ticker: {ticker}\nPrice: ${price:,.4f} | Qty: {qty:.6f}\n"
            f"Reason: {reason[:120]}"
        )
        with SessionLocal() as db:
            user = db.query(User).filter(User.id == self.user_id).first()
            if not user:
                return
            prefs = dict(user.notification_preferences or {})
            cid   = user.telegram_chat_id or prefs.get("telegram_chat_id")
            db.add(Notification(
                title=notif_title,
                message=notif_msg,
                target_all=False,
                target_user_id=user.id,
                created_by=None,
                read_by_user_ids=[],
            ))
            db.commit()
        if tok and cid:
            def _send():
                try:
                    import requests as _r
                    _r.post(f"https://api.telegram.org/bot{tok}/sendMessage",
                            json={"chat_id": cid, "text": msg}, timeout=5)
                except Exception:
                    pass
            _th.Thread(target=_send, daemon=True).start()

    # ── Manual close ──────────────────────────────────────────────────────────

    def close_position(self, ticker: str) -> dict:
        """Manually close an open position for the given ticker."""
        ticker = ticker.upper()
        pos = self.open_positions.get(ticker)
        if not pos:
            return {"ok": False, "detail": f"No open position for {ticker}"}

        try:
            price = _fetch_live_price(ticker)
        except Exception:
            return {"ok": False, "detail": f"Could not fetch live price for {ticker}"}

        side   = pos.get("side", "long")
        qty    = pos.get("qty", 0)
        margin = pos.get("margin", self.capital_per_trade)
        if side == "long":
            pnl = round((price - pos["entry_price"]) * qty, 4)
        else:
            pnl = round((pos["entry_price"] - price) * qty, 4)
        self.total_pnl = round(self.total_pnl + pnl, 4)
        self.open_positions.pop(ticker)

        # Credit margin + PnL back to user balance (live only)
        if not self.paper:
            self._update_user_balance(max(0.0, margin + pnl))

        action_label = "SELL" if side == "long" else "BUY"
        with SessionLocal() as db:
            log = TradeLog(
                user_id  = self.user_id,
                ticker   = ticker,
                action   = action_label,
                price    = price,
                qty      = qty,
                pnl      = pnl,
                reason   = f"FinEventAI | Manual close {side.upper()} position",
                paper    = self.paper,
                exchange = "EventBot",
            )
            db.add(log)
            db.commit()

        self._notify(
            ticker   = ticker,
            action   = action_label,
            price    = price,
            qty      = qty,
            reason   = f"Manual close {side.upper()} position",
        )
        return {"ok": True, "ticker": ticker, "pnl": pnl, "price": price}

    # ── Status ────────────────────────────────────────────────────────────────

    def get_status(self) -> dict:
        # Enrich each open position with live price + unrealized PnL
        enriched: dict = {}
        for ticker, pos in self.open_positions.items():
            entry = pos.get("entry_price", 0)
            qty   = pos.get("qty", 0)
            side  = pos.get("side", "long")
            try:
                current = _fetch_live_price(ticker)
            except Exception:
                current = entry
            if side == "long":
                upnl = round((current - entry) * qty, 4)
            else:
                upnl = round((entry - current) * qty, 4)
            enriched[ticker] = {**pos, "current_price": current, "unrealized_pnl": upnl}

        return {
            "running":            self.running,
            "open_positions":     enriched,
            "paper":              self.paper,
            "min_impact_score":   self.min_impact_score,
            "tickers":            self.tickers,
            "capital_per_trade":  self.capital_per_trade,
            "max_trades_per_day": self.max_trades_per_day,
            "trades_today":       self._trades_today,
            "total_trades":       len(self.trades),
            "total_pnl":          self.total_pnl,
            "sentiment_filter":   self.sentiment_filter,
            "started_at":         self.started_at.isoformat() if self.started_at else None,
            "events_generated":   self.events_generated,
            "recent_trades": [
                {
                    "ticker": t["ticker"],
                    "action": t["action"],
                    "price":  t["price"],
                    "qty":    t["qty"],
                    "reason": t["reason"],
                    "time":   t["time"].strftime("%H:%M:%S") if isinstance(t["time"], datetime) else str(t["time"]),
                    "paper":  t["paper"],
                }
                for t in self.trades[-20:]
            ],
        }


# ── Global singleton manager (per (user_id, bot_name)) ────────────────────────

class FinEventBotManager:
    _instance = None
    _lock      = threading.Lock()

    def __init__(self):
        self._bots: Dict[tuple, FinEventBot] = {}

    @classmethod
    def instance(cls) -> "FinEventBotManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _key(self, user_id: int, bot_name: str) -> tuple:
        return (user_id, bot_name.strip().lower())

    def start(self, user_id: int, user_email: str, bot_name: str = "default", **kwargs) -> str:
        k = self._key(user_id, bot_name)
        if k in self._bots and self._bots[k].running:
            return f"FinEventAI bot '{bot_name}' is already running."
        bot = FinEventBot(user_id=user_id, user_email=user_email, **kwargs)
        self._bots[k] = bot
        return bot.start()

    def stop(self, user_id: int, bot_name: str = "default") -> str:
        k   = self._key(user_id, bot_name)
        bot = self._bots.get(k)
        if bot:
            msg = bot.stop()
            del self._bots[k]
            return msg
        return f"No FinEventAI bot '{bot_name}' running for this user."

    def stop_all(self, user_id: int) -> int:
        stopped      = 0
        keys_to_del  = [k for k in self._bots if k[0] == user_id]
        for k in keys_to_del:
            self._bots[k].stop()
            del self._bots[k]
            stopped += 1
        return stopped

    def get_status(self, user_id: int, bot_name: str = "default") -> dict:
        k   = self._key(user_id, bot_name)
        bot = self._bots.get(k)
        if bot:
            return {**bot.get_status(), "bot_name": bot_name}
        return {
            "running": False, "bot_name": bot_name, "paper": True,
            "min_impact_score": 7, "tickers": ["BTC-USD", "ETH-USD"],
            "capital_per_trade": 500.0, "max_trades_per_day": 10,
            "trades_today": 0, "total_trades": 0, "total_pnl": 0.0,
            "sentiment_filter": "both", "started_at": None,
            "events_generated": 0, "recent_trades": [],
        }

    def list_user_bots(self, user_id: int) -> list:
        return [
            {**bot.get_status(), "bot_name": bot_name}
            for (uid, bot_name), bot in self._bots.items()
            if uid == user_id
        ]
