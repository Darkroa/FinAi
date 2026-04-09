import time
import threading
from datetime import datetime
from sqlalchemy.orm import Session
from loguru import logger

from src.database.models import TrendAnalysis, TradeLog
from src.database.session import SessionLocal

from src.notifications.notifier import Notifier

# Alpaca imports (using official alpaca-py)
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce

notifier = Notifier()
user_bot_managers: Dict[str, UserBotManager] = {}   # email -> UserBotManager


class TradingBot:
    def __init__(
        self,
        tickers: list[str],                    # Now accepts list of tickers
        initial_capital: float = 10000.0,
        max_drawdown_pct: float = 10.0,
        risk_per_trade_pct: float = 1.0,
        paper: bool = True,
    ):
        self.tickers = [t.upper() for t in tickers]
        self.paper = paper

        self.trading_client = TradingClient(
            api_key="YOUR_API_KEY",      # Replace with your actual keys or load from env
            secret_key="YOUR_SECRET_KEY",
            paper=paper
        )

        self.initial_capital = initial_capital
        self.capital = initial_capital          # Shared capital across all tickers
        self.positions: dict[str, float] = {t: 0.0 for t in self.tickers}   # ticker -> qty
        self.entry_prices: dict[str, float] = {t: 0.0 for t in self.tickers}
        self.trades = []                        # In-memory list

        # Risk settings (shared)
        self.max_drawdown_pct = max_drawdown_pct
        self.risk_per_trade_pct = risk_per_trade_pct
        self.peak_capital = initial_capital
        self.max_drawdown_reached = 0.0

        self.running = False
        self.thread = None
        self.latest_prices: dict[str, float] = {t: 100.0 for t in self.tickers}

    def start(self):
        if self.running:
            return f"Bot is already running for {self.tickers}"

        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

        mode = "LIVE" if not self.paper else "PAPER"
        logger.success(
            f"🚀 {mode} Multi-Ticker Bot STARTED → {', '.join(self.tickers)} | "
            f"Risk: {self.risk_per_trade_pct}% per trade | Max DD: {self.max_drawdown_pct}%"
        )
        return f"Bot started on {self.tickers} ({mode})"

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        logger.info(f"🛑 Multi-Ticker Bot STOPPED → {self.tickers}")
        return f"Bot stopped for {self.tickers}"

    def get_status(self):
        current_prices = self.latest_prices
        portfolio_value = self.capital
        unrealized_pnl = 0.0

        for t in self.tickers:
            pos = self.positions.get(t, 0.0)
            price = current_prices.get(t, 100.0)
            portfolio_value += pos * price
            unrealized_pnl += (price - self.entry_prices.get(t, 0.0)) * pos

        self.peak_capital = max(self.peak_capital, portfolio_value)
        current_dd = ((self.peak_capital - portfolio_value) / self.peak_capital * 100) if self.peak_capital > 0 else 0
        self.max_drawdown_reached = max(self.max_drawdown_reached, current_dd)

        return {
            "running": self.running,
            "tickers": self.tickers,
            "mode": "LIVE" if not self.paper else "PAPER",
            "balance": round(self.capital, 2),
            "portfolio_value": round(portfolio_value, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "current_drawdown_pct": round(current_dd, 2),
            "max_drawdown_pct": round(self.max_drawdown_reached, 2),
            "total_trades": len(self.trades),
            "win_rate": self._calculate_win_rate(),
            "positions": {t: round(self.positions.get(t, 0.0), 4) for t in self.tickers},
        }

    def _calculate_win_rate(self) -> float:
        if not self.trades:
            return 0.0
        wins = sum(1 for t in self.trades if t.get("pnl", 0) > 0)
        return round(wins / len(self.trades) * 100, 1)

    def _get_latest_trend(self, ticker: str):
        db = SessionLocal()
        try:
            return (
                db.query(TrendAnalysis)
                .filter(TrendAnalysis.ticker == ticker)
                .order_by(TrendAnalysis.timestamp.desc())
                .first()
            )
        finally:
            db.close()

    def _log_trade_to_db(self, trade: dict):
        """Persist trade to database"""
        db = SessionLocal()
        try:
            trade_log = TradeLog(
                ticker=trade["ticker"],
                action=trade["action"],
                price=trade["price"],
                qty=trade["qty"],
                pnl=trade.get("pnl"),
                reason=trade.get("reason"),
                paper=self.paper,
            )
            db.add(trade_log)
            db.commit()
            logger.debug(f"Trade logged to DB: {trade['action']} {trade['ticker']}")
        except Exception as e:
            logger.error(f"Failed to log trade to DB: {e}")
        finally:
            db.close()

    def _run_loop(self):
        while self.running:
            try:
                portfolio_value = self.capital
                for t in self.tickers:
                    portfolio_value += self.positions.get(t, 0.0) * self.latest_prices.get(t, 100.0)

                # Global drawdown protection
                if self.peak_capital > 0:
                    current_dd = (self.peak_capital - portfolio_value) / self.peak_capital * 100
                    self.peak_capital = max(self.peak_capital, portfolio_value)
                    self.max_drawdown_reached = max(self.max_drawdown_reached, current_dd)

                    if current_dd > self.max_drawdown_pct:
                        logger.warning(f"🛑 Max drawdown reached. Closing all positions.")
                        for t in self.tickers:
                            if self.positions.get(t, 0.0) > 0:
                                self._close_position(t, self.latest_prices.get(t, 100.0), "MAX_DRAWDOWN_STOP")
                        self.stop()
                        break

                # Check each ticker independently
                for ticker in self.tickers:
                    latest = self._get_latest_trend(ticker)
                    if not latest:
                        continue

                    price = latest.current_price
                    self.latest_prices[ticker] = price
                    state = latest.trend_state
                    conf = latest.confidence or 0.0
                    atr = latest.atr or 1.0

                    pos = self.positions.get(ticker, 0.0)
                    entry = self.entry_prices.get(ticker, 0.0)

                    # Position sizing (per ticker, based on current capital)
                    risk_amount = self.capital * (self.risk_per_trade_pct / 100)
                    stop_distance = atr * 2.0
                    position_size = risk_amount / stop_distance if stop_distance > 0 else 0

                    if state == "BULLISH" and pos <= 0 and conf > 0.65:
                        qty = min(position_size, (self.capital / price) * 0.98)
                        if qty > 0.0001:
                            self._open_position(ticker, qty, price, "BULLISH_SIGNAL")

                    elif state == "BEARISH" and pos > 0 and conf > 0.65:
                        self._close_position(ticker, price, "SIGNAL_SELL")

                    elif pos > 0 and price < entry * 0.95:
                        self._close_position(ticker, price, "HARD_STOP_LOSS")

            except Exception as e:
                logger.error(f"Error in multi-ticker loop: {e}")

            time.sleep(30)   # Polling interval for signals

    def _open_position(self, ticker: str, qty: float, price: float, reason: str):
        try:
            if not self.paper:
                order_data = MarketOrderRequest(
                    symbol=ticker,
                    qty=round(qty, 4),
                    side=OrderSide.BUY,
                    time_in_force=TimeInForce.DAY,
                )
                order = self.trading_client.submit_order(order_data)
                logger.info(f"LIVE BUY submitted → {ticker} | Order ID: {order.id}")

            # Update local state
            self.positions[ticker] = qty
            self.entry_prices[ticker] = price
            # Note: capital is reduced only on close for simplicity (or adjust proportionally)

            trade = {
                "time": datetime.now(),
                "ticker": ticker,
                "action": "BUY",
                "price": price,
                "qty": qty,
                "pnl": 0.0,
                "reason": reason,
            }
            self.trades.append(trade)
            self._log_trade_to_db(trade)

            logger.success(f"🟢 BUY {qty:.4f} {ticker} @ ${price:.2f} ({reason})")

        except Exception as e:
            logger.error(f"Failed to open {ticker}: {e}")

    def _close_position(self, ticker: str, price: float, reason: str):
        pos = self.positions.get(ticker, 0.0)
        if pos <= 0:
            return

        pnl = (price - self.entry_prices.get(ticker, 0.0)) * pos

        try:
            if not self.paper:
                order_data = MarketOrderRequest(
                    symbol=ticker,
                    qty=round(pos, 4),
                    side=OrderSide.SELL,
                    time_in_force=TimeInForce.DAY,
                )
                order = self.trading_client.submit_order(order_data)
                logger.info(f"LIVE SELL submitted → {ticker} | Order ID: {order.id}")

            self.capital += pos * price   # Return proceeds to capital

            trade = {
                "time": datetime.now(),
                "ticker": ticker,
                "action": "SELL",
                "price": price,
                "qty": pos,
                "pnl": pnl,
                "reason": reason,
            }
            self.trades.append(trade)
            self._log_trade_to_db(trade)

            logger.info(f"🔴 CLOSE {reason} | P&L: ${pnl:.2f} | {ticker}")

            self.positions[ticker] = 0.0
            self.entry_prices[ticker] = 0.0

        except Exception as e:
            logger.error(f"Failed to close {ticker}: {e}")


# ========================
# Bot Manager (unchanged usage pattern)
# ========================

class BotManager:
    def __init__(self):
        self.bots: dict[str, TradingBot] = {}   # key can be a comma-joined string or custom ID

    def start_bot(
        self,
        tickers: list[str],
        paper: bool = True,
        initial_capital: float = 10000.0,
    ):
        key = ",".join([t.upper() for t in tickers])
        if key in self.bots and self.bots[key].running:
            return f"Bot already running for {tickers}"

        bot = TradingBot(tickers=tickers, initial_capital=initial_capital, paper=paper)
        self.bots[key] = bot
        return bot.start()

    def stop_bot(self, tickers: list[str]):
        key = ",".join([t.upper() for t in tickers])
        if key in self.bots:
            return self.bots[key].stop()
        return "Bot not found"

    def get_all_status(self):
        return {key: bot.get_status() for key, bot in self.bots.items()}

def get_user_bot_manager(user_email: str, user_id: int) -> UserBotManager:
    if user_email not in user_bot_managers:
        user_bot_managers[user_email] = UserBotManager(user_id, user_email)
    return user_bot_managers[user_email]
    
    
# Global manager
bot_manager = BotManager()