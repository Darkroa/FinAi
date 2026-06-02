from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger
from src.notifications.notifier import Notifier

notifier = Notifier()
scheduler = BackgroundScheduler(timezone="UTC")


def send_daily_portfolio_summary():
    try:
        from src.trading.trade_bot import bot_manager
        statuses = list(bot_manager.get_all_status().values())
        if not statuses:
            notifier._send_all("📊 Daily Summary: No active bots running.", "Daily Portfolio Summary")
            return
        notifier.send_daily_summary(statuses)
        logger.success("📧 Daily portfolio summary sent via all channels")
    except Exception as e:
        logger.error(f"Daily summary failed: {e}")


def check_stop_loss_take_profit():
    """Auto-execute Stop Loss and Take Profit on open manual BUY positions."""
    try:
        from src.database.session import SessionLocal
        from src.database.models import TradeLog, User
        from src.trading.trade_bot import _fetch_live_price

        with SessionLocal() as db:
            open_buys = (
                db.query(TradeLog)
                .filter(
                    TradeLog.action == "BUY",
                    TradeLog.pnl == None,
                    TradeLog.paper == False,
                )
                .all()
            )
            if not open_buys:
                return

            triggered = 0
            for trade in open_buys:
                # Only process trades that have SL or TP set
                if trade.stop_loss is None and trade.take_profit is None:
                    continue
                try:
                    current_price = _fetch_live_price(trade.ticker)
                except Exception:
                    continue

                reason = None
                if trade.stop_loss and current_price <= trade.stop_loss:
                    reason = f"Stop Loss triggered @ ${current_price:.4f} (SL: ${trade.stop_loss:.4f})"
                elif trade.take_profit and current_price >= trade.take_profit:
                    reason = f"Take Profit triggered @ ${current_price:.4f} (TP: ${trade.take_profit:.4f})"

                if reason:
                    pnl = (current_price - (trade.price or 0)) * (trade.qty or 0)
                    proceeds = (trade.qty or 0) * current_price

                    # Credit proceeds to user wallet
                    user = db.query(User).filter(User.id == trade.user_id).first()
                    if user:
                        user.balance_usdt = round((user.balance_usdt or 0) + proceeds, 8)

                    # Mark BUY with P&L
                    trade.pnl = round(pnl, 8)

                    # Log SELL side
                    sell_log = TradeLog(
                        user_id=trade.user_id,
                        ticker=trade.ticker,
                        action="SELL",
                        price=current_price,
                        qty=trade.qty,
                        pnl=round(pnl, 8),
                        reason=reason,
                        paper=False,
                        exchange=trade.exchange or "internal",
                    )
                    db.add(sell_log)
                    triggered += 1
                    logger.info(f"⚡ Auto-closed trade #{trade.id}: {reason} | P&L: ${pnl:.2f}")

                    # Send push notification to user via Telegram/WhatsApp
                    if user:
                        prefs = dict(user.notification_preferences or {})
                        msg = (
                            f"⚡ FinAi Auto-Close Alert\n"
                            f"Ticker: {trade.ticker}\n"
                            f"{reason}\n"
                            f"P&L: {'+'if pnl>=0 else ''}${pnl:.2f}\n"
                            f"Proceeds: ${proceeds:.2f} USDT credited"
                        )
                        # Telegram notification
                        tg_token = prefs.get("telegram_bot_token")
                        tg_chat_id = prefs.get("telegram_chat_id")
                        if tg_token and tg_chat_id:
                            try:
                                import httpx as _hx
                                import threading
                                def _send_tg(tok, cid, text):
                                    try:
                                        import requests as _r
                                        _r.post(f"https://api.telegram.org/bot{tok}/sendMessage",
                                                json={"chat_id": cid, "text": text}, timeout=5)
                                    except Exception:
                                        pass
                                threading.Thread(target=_send_tg, args=(tg_token, tg_chat_id, msg), daemon=True).start()
                            except Exception:
                                pass
                        # WhatsApp notification
                        wa_verified = prefs.get("whatsapp_verified")
                        wa_phone = prefs.get("whatsapp_number")
                        if wa_verified and wa_phone:
                            try:
                                import os, threading
                                def _send_wa(phone, text):
                                    try:
                                        from twilio.rest import Client as _TC
                                        tc = _TC(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
                                        tc.messages.create(
                                            from_=f"whatsapp:{os.getenv('TWILIO_WHATSAPP_NUMBER','+14155238886')}",
                                            body=text,
                                            to=f"whatsapp:{phone}"
                                        )
                                    except Exception:
                                        pass
                                threading.Thread(target=_send_wa, args=(wa_phone, msg), daemon=True).start()
                            except Exception:
                                pass

            if triggered > 0:
                db.commit()
                logger.success(f"✅ SL/TP check: {triggered} position(s) auto-closed")

    except Exception as e:
        logger.error(f"SL/TP check failed: {e}")


def check_price_alerts_job():
    """Periodic price alert check — notifies users via Telegram/WhatsApp when targets hit."""
    try:
        from src.database.session import SessionLocal
        from src.database.models import PriceAlert, User
        import requests as _req

        with SessionLocal() as db:
            active = db.query(PriceAlert).filter(PriceAlert.is_active == True).all()
            if not active:
                return

            # Fetch current prices from Binance.US
            prices: dict = {}
            try:
                r = _req.get(
                    "https://api.binance.us/api/v3/ticker/price",
                    timeout=5
                )
                if r.status_code == 200:
                    raw = r.json()
                    for item in raw:
                        sym = item.get("symbol", "")
                        price = float(item.get("price", 0))
                        # Map BTCUSDT -> BTC/USDT
                        if sym.endswith("USDT"):
                            key = sym[:-4] + "/USDT"
                            prices[key] = price
            except Exception:
                pass

            from datetime import datetime
            triggered_count = 0
            for alert in active:
                current = prices.get(alert.symbol, 0)
                if current == 0:
                    continue
                fired = (
                    (alert.direction == "above" and current >= alert.target_price) or
                    (alert.direction == "below" and current <= alert.target_price)
                )
                if not fired:
                    continue

                alert.is_active = False
                alert.triggered_at = datetime.utcnow()
                triggered_count += 1
                user = db.query(User).filter(User.id == alert.user_id).first()
                if not user:
                    continue

                msg = (
                    f"🔔 FinAi Price Alert Triggered!\n"
                    f"{alert.symbol} hit ${alert.target_price:,.2f} ({alert.direction})\n"
                    f"Current Price: ${current:,.4f}"
                )
                prefs = dict(user.notification_preferences or {})

                # Telegram
                if alert.notify_telegram:
                    tg_token = prefs.get("telegram_bot_token")
                    tg_chat_id = prefs.get("telegram_chat_id")
                    if tg_token and tg_chat_id:
                        try:
                            import threading
                            def _send_tg(tok, cid, text):
                                try:
                                    import requests as _r2
                                    _r2.post(f"https://api.telegram.org/bot{tok}/sendMessage",
                                             json={"chat_id": cid, "text": text}, timeout=5)
                                except Exception:
                                    pass
                            threading.Thread(target=_send_tg, args=(tg_token, tg_chat_id, msg), daemon=True).start()
                        except Exception:
                            pass

                # WhatsApp
                if alert.notify_whatsapp:
                    wa_verified = prefs.get("whatsapp_verified")
                    wa_phone = prefs.get("whatsapp_number")
                    if wa_verified and wa_phone:
                        try:
                            import os, threading
                            def _send_wa(phone, text):
                                try:
                                    from twilio.rest import Client as _TC
                                    tc = _TC(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
                                    tc.messages.create(
                                        from_=f"whatsapp:{os.getenv('TWILIO_WHATSAPP_NUMBER','+14155238886')}",
                                        body=text,
                                        to=f"whatsapp:{phone}"
                                    )
                                except Exception:
                                    pass
                            threading.Thread(target=_send_wa, args=(wa_phone, msg), daemon=True).start()
                        except Exception:
                            pass

            if triggered_count > 0:
                db.commit()
                logger.info(f"🔔 Price alerts: {triggered_count} triggered")

    except Exception as e:
        logger.error(f"Price alert check failed: {e}")


def auto_cancel_expired_deposits():
    """Cancel pending deposit requests that are older than 30 minutes."""
    try:
        from src.database.session import SessionLocal
        from src.database.models import Transaction
        from datetime import datetime, timedelta
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(minutes=30)
            expired = db.query(Transaction).filter(
                Transaction.tx_type == "deposit",
                Transaction.status == "pending",
                Transaction.created_at < cutoff,
            ).all()
            if expired:
                for tx in expired:
                    tx.status = "cancelled"
                db.commit()
                logger.info(f"⏱️ Auto-cancelled {len(expired)} expired deposit(s)")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Auto-cancel deposits failed: {e}")


scheduler.add_job(
    auto_cancel_expired_deposits,
    trigger=IntervalTrigger(minutes=2),
    id="deposit_expiry_checker",
    replace_existing=True,
)

scheduler.add_job(
    send_daily_portfolio_summary,
    trigger=CronTrigger(hour=20, minute=0),
    id="daily_portfolio_summary",
    replace_existing=True,
)

scheduler.add_job(
    check_stop_loss_take_profit,
    trigger=IntervalTrigger(seconds=30),
    id="sl_tp_checker",
    replace_existing=True,
)

scheduler.add_job(
    check_price_alerts_job,
    trigger=IntervalTrigger(minutes=1),
    id="price_alert_checker",
    replace_existing=True,
)

logger.info("⏰ Scheduler configured: Daily summary (20:00 UTC), SL/TP check (30s), Price alerts (60s), Deposit expiry (2m)")
