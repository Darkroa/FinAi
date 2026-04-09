from src.trading.trade_bot import TradingBotInstance
from loguru import logger
from typing import Dict, List


class UserBotManager:
    """Manages trading bots per user (isolated per user)"""

    def __init__(self, user_id: int, user_email: str):
        self.user_id = user_id
        self.user_email = user_email
        self.bots: Dict[str, TradingBotInstance] = {}   # ticker -> bot instance

    def start_bot(self, ticker: str, paper: bool = True) -> str:
        if ticker in self.bots and self.bots[ticker].running:
            return f"Bot for {ticker} is already running."

        bot = TradingBotInstance(ticker=ticker, paper=paper, user_id=self.user_id)
        self.bots[ticker] = bot
        bot.start()

        logger.info(f"User {self.user_email} started {'paper' if paper else 'LIVE'} bot on {ticker}")
        return f"✅ Bot started successfully on {ticker} (Paper Trading: {paper})"

    def stop_bot(self, ticker: str = "ALL") -> str:
        if ticker == "ALL":
            for t, bot in list(self.bots.items()):
                bot.stop()
            self.bots.clear()
            return "All bots stopped successfully."

        if ticker in self.bots:
            self.bots[ticker].stop()
            del self.bots[ticker]
            return f"Bot on {ticker} stopped."

        return f"No active bot found for ticker {ticker}."

    def get_status(self) -> dict:
        return {
            ticker: bot.get_status() 
            for ticker, bot in self.bots.items()
        }

    def get_trades(self, limit: int = 50) -> List[dict]:
        all_trades = []
        for bot in self.bots.values():
            all_trades.extend(bot.trades)
        # Sort by time (newest first)
        return sorted(all_trades, key=lambda x: x.get("time", ""), reverse=True)[:limit]