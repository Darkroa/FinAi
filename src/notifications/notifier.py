import os
from datetime import datetime
from twilio.rest import Client
from telegram import Bot
from slack_sdk import WebClient
import smtplib
from email.mime.text import MIMEText
from loguru import logger

class Notifier:
    def __init__(self):
        # Twilio for WhatsApp
        self.twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN")) if os.getenv("TWILIO_ACCOUNT_SID") else None
        self.whatsapp_from = f"whatsapp:{os.getenv('TWILIO_WHATSAPP_NUMBER')}"  # e.g. +14155238886
        self.whatsapp_to = os.getenv("WHATSAPP_TO_NUMBER")  # your number with country code

        # Telegram
        self.telegram_bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN")) if os.getenv("TELEGRAM_BOT_TOKEN") else None
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")

        # Slack
        self.slack_client = WebClient(token=os.getenv("SLACK_BOT_TOKEN")) if os.getenv("SLACK_BOT_TOKEN") else None
        self.slack_channel = os.getenv("SLACK_CHANNEL", "#trading-alerts")

        # Email
        self.email_sender = os.getenv("EMAIL_SENDER")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        self.email_to = os.getenv("EMAIL_TO")

    def send_trade_alert(self, trade: dict):
        message = f"""
🚨 FinEventAI Trade Alert @ {trade['time'].strftime('%Y-%m-%d %H:%M')}
Action: {trade['action']} {trade.get('qty', '')} {trade.get('ticker', 'UNKNOWN')}
Price: ${trade['price']:.2f}
P&L: ${trade.get('pnl', 0):.2f}
Reason: {trade.get('reason', 'Signal')}
Portfolio: ${trade.get('portfolio_value', 0):.2f}
        """.strip()

        self._send_all(message, f"Trade: {trade['action']} {trade.get('ticker')}")

    def send_event_alert(self, event):
        message = f"""
📰 New Financial Event Detected
Type: {event.event_type}
Title: {event.title}
Impact: {event.impact_score}/10 | Sentiment: {event.sentiment}
Short-term: {event.short_term_impact}
        """.strip()
        self._send_all(message, "New Event Detected")

    def send_forecast_alert(self, analysis):
        message = f"""
📈 Trendline Forecast
Ticker: {analysis.ticker}
State: {analysis.trend_state}
Current: ${analysis.current_price:.2f} → Predicted: ${analysis.predicted_price:.2f}
Confidence: {analysis.confidence:.0%}
{analysis.prediction_text}
        """.strip()
        self._send_all(message, f"Forecast: {analysis.ticker} {analysis.trend_state}")

    def _send_all(self, message: str, subject: str = "FinEventAI Alert"):
        # WhatsApp
        if self.twilio_client and self.whatsapp_to:
            try:
                self.twilio_client.messages.create(
                    from_=self.whatsapp_from,
                    body=message,
                    to=f"whatsapp:{self.whatsapp_to}"
                )
            except Exception as e:
                logger.error(f"WhatsApp failed: {e}")

        # Telegram
        if self.telegram_bot and self.telegram_chat_id:
            try:
                self.telegram_bot.send_message(chat_id=self.telegram_chat_id, text=message)
            except Exception as e:
                logger.error(f"Telegram failed: {e}")

        # Slack
        if self.slack_client:
            try:
                self.slack_client.chat_postMessage(channel=self.slack_channel, text=message)
            except Exception as e:
                logger.error(f"Slack failed: {e}")

        # Email
        if self.email_sender and self.email_to:
            try:
                msg = MIMEText(message)
                msg['Subject'] = subject
                msg['From'] = self.email_sender
                msg['To'] = self.email_to
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                    server.login(self.email_sender, self.email_password)
                    server.send_message(msg)
            except Exception as e:
                logger.error(f"Email failed: {e}")
    
    def send_daily_summary(self, bot_status_list: list):
        if not bot_status_list:
            return
        summary = "📊 FinEventAI Daily Portfolio Summary\n\n"
        for status in bot_status_list:
            summary += f"{status['ticker']}: ${status['portfolio_value']:.2f} | DD: {status['current_drawdown_pct']}% | Pos: {status['position']}\n"
        
        summary += f"\nGenerated at: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        self._send_all(summary, "Daily Portfolio Summary")