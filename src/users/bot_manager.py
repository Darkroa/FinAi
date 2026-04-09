from src.trading.trade_bot import TradingBotInstance
from loguru import logger
from typing import Dict

class UserBotManager:
    """Per-user isolated bot manager"""
    def __init__(self, user_id: int, user_email: str):
        self.user_id = user_id
        self.user_email = user_email
        self.bots: Dict[str, TradingBotInstance] = {}   # ticker -> bot

    def start_bot(self, ticker: str, paper: bool = True):
        if ticker in self.bots and self.bots[ticker].running:
            return f"Bot for {ticker} already running for this user"
        
        bot = TradingBotInstance(ticker, paper=paper)
        self.bots[ticker] = bot
        bot.start(ticker)
        logger.info(f"User {self.user_email} started bot on {ticker} (Paper: {paper})")
        return f"✅ Started bot on {ticker} for your account"

    def stop_bot(self, ticker: str = "ALL"):
        if ticker == "ALL":
            for t in list(self.bots.keys()):
                self.bots[t].stop()
            self.bots.clear()
            return "All your bots stopped"
        if ticker in self.bots:
            self.bots[ticker].stop()
            del self.bots[ticker]
            return f"Stopped bot on {ticker}"
        return "Bot not found for your account"

    def get_status(self):
        return {ticker: bot.get_status() for ticker, bot in self.bots.items()}

    def get_trades(self):
        all_trades = []
        for bot in self.bots.values():
            all_trades.extend(bot.trades)
        return sorted(all_trades, key=lambda x: x.get("time"), reverse=True)