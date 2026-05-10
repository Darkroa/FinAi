import asyncio
import os
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from twilio.rest import Client
from loguru import logger
from src.trading.trade_bot import bot_manager
from src.notifications.notifier import Notifier

notifier = Notifier()

# ===================== TELEGRAM BOT =====================
async def telegram_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ticker = context.args[0].upper() if context.args else "SPX"
    result = bot_manager.start_bot(ticker, paper=True)
    await update.message.reply_text(f"✅ {result}")

async def telegram_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ticker = context.args[0].upper() if context.args else "ALL"
    if ticker == "ALL":
        for t in list(bot_manager.bots.keys()):
            bot_manager.stop_bot(t)
        await update.message.reply_text("⛔ All bots stopped")
    else:
        result = bot_manager.stop_bot(ticker)
        await update.message.reply_text(f"⛔ {result}")

async def telegram_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    statuses = bot_manager.get_all_status()
    if not statuses:
        await update.message.reply_text("ℹ️ No active bots")
        return
    msg = "📊 **Active Bots**\n\n"
    for t, s in statuses.items():
        msg += f"**{t}**: ${s['portfolio_value']:.2f} | DD: {s['current_drawdown_pct']}% | Pos: {s['position']}\n"
    await update.message.reply_text(msg, parse_mode="Markdown")

async def telegram_trades(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Get latest trades from first bot (expandable later)
    if not bot_manager.bots:
        await update.message.reply_text("No trades yet")
        return
    bot = list(bot_manager.bots.values())[0]
    if not bot.trades:
        await update.message.reply_text("No trades recorded")
        return
    msg = "📜 Last 5 Trades:\n\n"
    for trade in bot.trades[-5:]:
        msg += f"{trade['time'].strftime('%H:%M')} | {trade['action']} | ${trade.get('price',0):.2f} | P&L ${trade.get('pnl',0):.2f}\n"
    await update.message.reply_text(msg)

# ===================== WHATSAPP COMMAND HANDLER (via Twilio Webhook) =====================
def handle_whatsapp_command(body: str, from_number: str):
    """Called from FastAPI webhook"""
    command = body.strip().lower()
    reply = "❓ Unknown command. Use: /start AAPL, /stop SPX, /status, /trades"

    if command.startswith("/start"):
        ticker = command.split()[-1].upper() if len(command.split()) > 1 else "SPX"
        reply = bot_manager.start_bot(ticker, paper=True)
    elif command.startswith("/stop"):
        ticker = command.split()[-1].upper() if len(command.split()) > 1 else "ALL"
        if ticker == "ALL":
            for t in list(bot_manager.bots.keys()):
                bot_manager.stop_bot(t)
            reply = "All bots stopped"
        else:
            reply = bot_manager.stop_bot(ticker)
    elif command in ["/status", "/portfolio"]:
        statuses = bot_manager.get_all_status()
        reply = "📊 Portfolio:\n" + "\n".join([f"{t}: ${s['portfolio_value']:.2f}" for t,s in statuses.items()]) or "No bots running"
    elif command == "/trades":
        # Simplified - returns text
        reply = "Last trades sent via notification channels"

    # Send reply back via WhatsApp
    if notifier.twilio_client:
        notifier.twilio_client.messages.create(
            from_=notifier.whatsapp_from,
            body=reply,
            to=from_number
        )
    return reply

# ===================== TELEGRAM SETUP =====================
def start_telegram_bot():
    app = Application.builder().token(os.getenv("TELEGRAM_BOT_TOKEN")).build()
    app.add_handler(CommandHandler("start", telegram_start))
    app.add_handler(CommandHandler("stop", telegram_stop))
    app.add_handler(CommandHandler("status", telegram_status))
    app.add_handler(CommandHandler("trades", telegram_trades))
    
    logger.success("🤖 Telegram Command Bot started")
    app.run_polling()