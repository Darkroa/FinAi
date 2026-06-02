import asyncio
import os
from loguru import logger

try:
    from telegram import Update
    from telegram.ext import Application, CommandHandler, ContextTypes
    _HAS_TELEGRAM = True
except ImportError:
    _HAS_TELEGRAM = False

from src.trading.trade_bot import bot_manager
from src.notifications.notifier import Notifier

notifier = Notifier()

HELP_TEXT = """
🤖 *FinAi Bot Commands*

1️⃣ /ping — Check if bot is online
2️⃣ /start <TICKER> — Start a paper bot (e.g. /start BTC-USD)
3️⃣ /stop <TICKER|ALL> — Stop a bot or all bots
4️⃣ /status — Show all active bots & portfolio
5️⃣ /trades — Show last 5 trades
6️⃣ /portfolio — Full portfolio snapshot
7️⃣ /price <TICKER> — Get current price
8️⃣ /pnl — Show today's realized P&L
9️⃣ /bots — List all running bots
🔟 /help — Show this help message
1️⃣1️⃣ /ask <question> — Ask FinAi anything (e.g. /ask What is my balance?)
""".strip()

# ===================== TELEGRAM COMMANDS =====================

async def cmd_ping(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("✅ FinAi bot is online and running!")

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ticker = context.args[0].upper() if context.args else "BTC-USD"
    result = bot_manager.start_bot(ticker, paper=True)
    await update.message.reply_text(f"✅ {result}")

async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ticker = context.args[0].upper() if context.args else "ALL"
    if ticker == "ALL":
        for t in list(bot_manager.bots.keys()):
            bot_manager.stop_bot(t)
        await update.message.reply_text("⛔ All bots stopped")
    else:
        result = bot_manager.stop_bot(ticker)
        await update.message.reply_text(f"⛔ {result}")

async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    statuses = bot_manager.get_all_status()
    if not statuses:
        await update.message.reply_text("ℹ️ No active bots running")
        return
    msg = "📊 *Active Bots*\n\n"
    for t, s in statuses.items():
        mode = "🟢 LIVE" if s.get("mode") == "LIVE" else "📄 PAPER"
        msg += f"*{t}* {mode}\nPortfolio: ${s['portfolio_value']:.2f} | DD: {s['current_drawdown_pct']}% | Pos: {s['position']:.6f}\n\n"
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_trades(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not bot_manager.bots:
        await update.message.reply_text("ℹ️ No trades yet — no active bots")
        return
    bot = list(bot_manager.bots.values())[0]
    if not bot.trades:
        await update.message.reply_text("ℹ️ No trades recorded yet")
        return
    msg = "📜 *Last 5 Trades:*\n\n"
    for trade in bot.trades[-5:]:
        pnl = trade.get("pnl")
        pnl_str = f"P&L ${pnl:.2f}" if pnl is not None else "Open"
        msg += f"`{trade['time'].strftime('%H:%M')}` | {trade['action']} | ${trade.get('price', 0):.2f} | {pnl_str}\n"
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_portfolio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    statuses = bot_manager.get_all_status()
    if not statuses:
        await update.message.reply_text("ℹ️ No active bots — portfolio is empty")
        return
    total_val = sum(s["portfolio_value"] for s in statuses.values())
    total_pnl = sum(s["realized_pnl"] for s in statuses.values())
    msg = f"💼 *Portfolio Snapshot*\n\nTotal Value: ${total_val:.2f}\nTotal Realized P&L: ${total_pnl:.2f}\n\n"
    for ticker, s in statuses.items():
        msg += f"• *{ticker}*: ${s['portfolio_value']:.2f} | {s['win_rate']}% win rate\n"
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /price BTC-USD")
        return
    ticker = context.args[0].upper()
    try:
        from src.trading.trade_bot import _fetch_live_price
        price = _fetch_live_price(ticker)
        await update.message.reply_text(f"💰 *{ticker}*: ${price:,.4f}", parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Could not fetch price for {ticker}: {e}")

async def cmd_pnl(update: Update, context: ContextTypes.DEFAULT_TYPE):
    statuses = bot_manager.get_all_status()
    if not statuses:
        await update.message.reply_text("ℹ️ No active bots")
        return
    total_realized = sum(s["realized_pnl"] for s in statuses.values())
    total_unrealized = sum(s["unrealized_pnl"] for s in statuses.values())
    emoji = "📈" if total_realized >= 0 else "📉"
    msg = (
        f"{emoji} *P&L Summary*\n\n"
        f"Realized: ${total_realized:+.2f}\n"
        f"Unrealized: ${total_unrealized:+.2f}\n"
        f"Total: ${(total_realized + total_unrealized):+.2f}"
    )
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_bots(update: Update, context: ContextTypes.DEFAULT_TYPE):
    statuses = bot_manager.get_all_status()
    if not statuses:
        await update.message.reply_text("ℹ️ No bots running")
        return
    msg = f"🤖 *Running Bots* ({len(statuses)} total)\n\n"
    for i, (ticker, s) in enumerate(statuses.items(), 1):
        status_dot = "🟢" if s["running"] else "🔴"
        msg += f"{i}. {status_dot} *{ticker}* — {s['strategy'].upper()} | {s.get('mode', 'PAPER')}\n"
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")

async def cmd_ask(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Ask the FinAi AI assistant a question — uses local intelligence with full user context."""
    if not context.args:
        await update.message.reply_text(
            "💬 Usage: /ask <your question>\n\nExamples:\n"
            "• /ask What is my portfolio worth?\n"
            "• /ask Should I buy BTC now?\n"
            "• /ask How are my bots performing?"
        )
        return
    question = " ".join(context.args)
    # Resolve user email from Telegram chat ID stored in notification_preferences
    user_email = None
    try:
        chat_id = str(update.effective_chat.id)
        from src.database.session import SessionLocal
        from src.database.models import User
        db = SessionLocal()
        try:
            users = db.query(User).all()
            for u in users:
                prefs = dict(u.notification_preferences or {})
                if str(prefs.get("telegram_chat_id", "")) == chat_id:
                    user_email = u.email
                    break
        finally:
            db.close()
    except Exception:
        pass
    try:
        from src.conversation.agent import chat_with_agent
        reply = chat_with_agent(question, user_email=user_email)
    except Exception:
        from src.utils.local_llm import local_chat
        reply = local_chat(question, user_email)
    await update.message.reply_text(reply, parse_mode="Markdown")


# ===================== WHATSAPP COMMAND HANDLER (via Twilio Webhook) =====================
WHATSAPP_HELP = """
🤖 FinAi Bot Commands:
1 /ping — Check bot status
2 /start BTC-USD — Start paper bot
3 /stop ALL — Stop all bots
4 /status — Active bots
5 /trades — Last 5 trades
6 /portfolio — Full snapshot
7 /price BTC-USD — Live price
8 /pnl — P&L summary
9 /bots — List running bots
10 /help — Show commands
11 /ask <question> — Ask FinAi anything
   e.g. /ask What is my balance?
""".strip()

def handle_whatsapp_command(body: str, from_number: str) -> str:
    """Called from FastAPI webhook endpoint for Twilio WhatsApp messages."""
    parts = body.strip().split()
    command = parts[0].lower() if parts else ""
    arg = parts[1].upper() if len(parts) > 1 else ""

    reply = "❓ Unknown command. Send /help for all commands."

    if command in ["/ping", "1"]:
        reply = "✅ FinAi bot is online and running!"

    elif command in ["/start", "2"]:
        ticker = arg or "BTC-USD"
        reply = f"✅ {bot_manager.start_bot(ticker, paper=True)}"

    elif command in ["/stop", "3"]:
        ticker = arg or "ALL"
        if ticker == "ALL":
            for t in list(bot_manager.bots.keys()):
                bot_manager.stop_bot(t)
            reply = "⛔ All bots stopped"
        else:
            reply = f"⛔ {bot_manager.stop_bot(ticker)}"

    elif command in ["/status", "4"]:
        statuses = bot_manager.get_all_status()
        if not statuses:
            reply = "ℹ️ No active bots"
        else:
            lines = [f"{t}: ${s['portfolio_value']:.2f} | DD:{s['current_drawdown_pct']}%" for t, s in statuses.items()]
            reply = "📊 Active Bots:\n" + "\n".join(lines)

    elif command in ["/trades", "5"]:
        if not bot_manager.bots:
            reply = "ℹ️ No trades yet"
        else:
            bot = list(bot_manager.bots.values())[0]
            if not bot.trades:
                reply = "ℹ️ No trades recorded"
            else:
                lines = []
                for trade in bot.trades[-5:]:
                    pnl = trade.get("pnl")
                    pnl_str = f"P&L ${pnl:.2f}" if pnl is not None else "Open"
                    lines.append(f"{trade['time'].strftime('%H:%M')} {trade['action']} ${trade.get('price',0):.2f} {pnl_str}")
                reply = "📜 Last 5 Trades:\n" + "\n".join(lines)

    elif command in ["/portfolio", "6"]:
        statuses = bot_manager.get_all_status()
        if not statuses:
            reply = "ℹ️ Portfolio empty — no active bots"
        else:
            total = sum(s["portfolio_value"] for s in statuses.values())
            reply = f"💼 Total: ${total:.2f}\n" + "\n".join([f"• {t}: ${s['portfolio_value']:.2f}" for t, s in statuses.items()])

    elif command in ["/price", "7"]:
        ticker = arg or "BTC-USD"
        try:
            from src.trading.trade_bot import _fetch_live_price
            price = _fetch_live_price(ticker)
            reply = f"💰 {ticker}: ${price:,.4f}"
        except Exception as e:
            reply = f"❌ Could not fetch {ticker}: {e}"

    elif command in ["/pnl", "8"]:
        statuses = bot_manager.get_all_status()
        if not statuses:
            reply = "ℹ️ No active bots"
        else:
            realized = sum(s["realized_pnl"] for s in statuses.values())
            unrealized = sum(s["unrealized_pnl"] for s in statuses.values())
            reply = f"📈 Realized: ${realized:+.2f}\nUnrealized: ${unrealized:+.2f}\nTotal: ${(realized+unrealized):+.2f}"

    elif command in ["/bots", "9"]:
        statuses = bot_manager.get_all_status()
        if not statuses:
            reply = "ℹ️ No bots running"
        else:
            lines = [f"{i}. {'🟢' if s['running'] else '🔴'} {t} [{s.get('mode','PAPER')}]"
                     for i, (t, s) in enumerate(statuses.items(), 1)]
            reply = f"🤖 Running Bots ({len(statuses)}):\n" + "\n".join(lines)

    elif command in ["/help", "10", "help"]:
        reply = WHATSAPP_HELP

    elif command in ["/ask", "11"]:
        question = " ".join(parts[1:]) if len(parts) > 1 else ""
        if not question:
            reply = "Usage: /ask <your question>\nExample: /ask What is my portfolio worth?"
        else:
            # Resolve user from WhatsApp number
            user_email = None
            try:
                from src.database.session import SessionLocal
                from src.database.models import User as _User
                _db = SessionLocal()
                try:
                    _users = _db.query(_User).all()
                    for _u in _users:
                        _prefs = dict(_u.notification_preferences or {})
                        if _prefs.get("whatsapp_number") == from_number.replace("whatsapp:", ""):
                            user_email = _u.email
                            break
                finally:
                    _db.close()
            except Exception:
                pass
            try:
                from src.conversation.agent import chat_with_agent
                reply = chat_with_agent(question, user_email=user_email)
            except Exception:
                from src.utils.local_llm import local_chat
                reply = local_chat(question, user_email)

    # Send reply back via WhatsApp
    if notifier.twilio_client and from_number:
        try:
            notifier.twilio_client.messages.create(
                from_=notifier.whatsapp_from,
                body=reply,
                to=from_number
            )
        except Exception as e:
            logger.error(f"WhatsApp reply failed: {e}")

    return reply


# ===================== TELEGRAM BOT SETUP =====================
def start_telegram_bot():
    if not _HAS_TELEGRAM:
        logger.warning("python-telegram-bot not installed — Telegram bot skipped")
        return

    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.info("TELEGRAM_BOT_TOKEN not set — Telegram polling bot skipped")
        return

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("ping",      cmd_ping))
    app.add_handler(CommandHandler("start",     cmd_start))
    app.add_handler(CommandHandler("stop",      cmd_stop))
    app.add_handler(CommandHandler("status",    cmd_status))
    app.add_handler(CommandHandler("trades",    cmd_trades))
    app.add_handler(CommandHandler("portfolio", cmd_portfolio))
    app.add_handler(CommandHandler("price",     cmd_price))
    app.add_handler(CommandHandler("pnl",       cmd_pnl))
    app.add_handler(CommandHandler("bots",      cmd_bots))
    app.add_handler(CommandHandler("help",      cmd_help))
    app.add_handler(CommandHandler("ask",       cmd_ask))

    logger.success("🤖 Telegram Command Bot started (11 commands)")
    app.run_polling()
