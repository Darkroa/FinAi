import os
import asyncio
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from prometheus_fastapi_instrumentator import Instrumentator
from loguru import logger

from src.api.routes import router
from src.api.middleware import APIRateLimitMiddleware
from src.database.models import Base
from src.database.session import engine

app = FastAPI(
    title="FinAi API",
    version="1.0.0",
    description="AI-Powered Financial News Ingestion & Automated Trading Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ===================== Middleware =====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(APIRateLimitMiddleware)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Include API routes
app.include_router(router, prefix="/api")

# ===================== Static Frontend Serving =====================
FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "metrics", "assets/")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404)
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
else:
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to FinAi - AI Powered Trading Platform",
            "version": "1.0.0",
            "status": "healthy",
            "docs": "/docs",
            "metrics": "/metrics",
            "api_prefix": "/api"
        }


# ===================== Startup & Shutdown Events =====================
@app.on_event("startup")
async def startup_event():
    # DB schema
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import text as _text
    try:
        with engine.connect() as _conn:
            for stmt in [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS transfer_pin VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT FALSE",
                "ALTER TABLE trade_logs ADD COLUMN IF NOT EXISTS stop_loss FLOAT",
                "ALTER TABLE trade_logs ADD COLUMN IF NOT EXISTS take_profit FLOAT",
                "ALTER TABLE trade_logs ADD COLUMN IF NOT EXISTS leverage FLOAT DEFAULT 1.0",
                "ALTER TABLE trade_logs ADD COLUMN IF NOT EXISTS lot_size FLOAT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(50) DEFAULT 'free'",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20)",
            ]:
                _conn.execute(_text(stmt))
            _conn.commit()

            import secrets as _sec, string as _str
            _alphabet = _str.ascii_uppercase + _str.digits
            _rows = _conn.execute(_text("SELECT id FROM users WHERE referral_code IS NULL")).fetchall()
            for _row in _rows:
                while True:
                    _code = ''.join(_sec.choice(_alphabet) for _ in range(8))
                    _exists = _conn.execute(_text(f"SELECT 1 FROM users WHERE referral_code = '{_code}'")).fetchone()
                    if not _exists:
                        break
                _conn.execute(_text(f"UPDATE users SET referral_code = '{_code}' WHERE id = {_row[0]}"))
            _conn.commit()
    except Exception:
        pass

    # Seed admin
    try:
        from src.database.session import SessionLocal as _SL
        from src.users.crud import get_user_by_email as _gube, create_user as _cu
        from src.users.schemas import UserCreate as _UC
        _ADMIN_EMAIL = "AdminfinAi@gmail.com"
        _ADMIN_PASS  = "FineAdminpass1"
        with _SL() as _db:
            _existing = _gube(_db, _ADMIN_EMAIL)
            if not _existing:
                _admin = _cu(_db, _UC(email=_ADMIN_EMAIL, password=_ADMIN_PASS))
                _admin.is_admin        = True
                _admin.is_mail_verified = True
                _admin.account_tier    = 3
                _db.commit()
                logger.success(f"✅ Admin seeded: {_ADMIN_EMAIL}")
            else:
                if not _existing.is_admin:
                    _existing.is_admin        = True
                    _existing.is_mail_verified = True
                    _existing.account_tier    = 3
                    _db.commit()
                logger.info(f"ℹ️  Admin already exists: {_ADMIN_EMAIL}")
    except Exception as _seed_err:
        logger.warning(f"Admin seed skipped: {_seed_err}")

    # Scheduler + Telegram webhook run in background so startup finishes fast
    asyncio.create_task(_deferred_init())
    logger.success("🚀 FinAi API started — background init in progress")


async def _deferred_init():
    """Start scheduler and register Telegram webhook after server is ready."""
    try:
        from src.notifications.scheduler import scheduler
        scheduler.start()
        logger.success("⏰ Scheduler started")
    except Exception as _sch_err:
        logger.warning(f"Scheduler start skipped: {_sch_err}")

    try:
        import httpx as _hx
        _bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        _wh_secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
        _domain = (
            os.getenv("REPLIT_DEV_DOMAIN")
            or os.getenv("REPLIT_DOMAINS", "").split(",")[0].strip()
        )
        if _bot_token and _domain:
            _wh_url = f"https://{_domain}/api/telegram/webhook"
            payload = {"url": _wh_url}
            if _wh_secret:
                payload["secret_token"] = _wh_secret
            async with _hx.AsyncClient(timeout=10) as _c:
                _r = await _c.post(
                    f"https://api.telegram.org/bot{_bot_token}/setWebhook",
                    json=payload,
                )
                _data = _r.json()
                if _data.get("ok"):
                    logger.success(f"✅ Telegram webhook registered: {_wh_url}")
                else:
                    logger.warning(f"⚠️  Telegram webhook registration failed: {_data}")
        else:
            if not _bot_token:
                logger.info("ℹ️  TELEGRAM_BOT_TOKEN not set — webhook skipped")
    except Exception as _tg_err:
        logger.warning(f"Telegram webhook init skipped: {_tg_err}")


@app.on_event("shutdown")
async def shutdown_event():
    try:
        from src.notifications.scheduler import scheduler
        scheduler.shutdown()
        logger.info("🛑 Scheduler shut down gracefully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
