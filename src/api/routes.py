
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Query,
    Depends,
    HTTPException,
    Header,
    Request,
    status,
)
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional

from src.celery_app.tasks import ingest_and_detect_events
from src.rag.vector_store import FinancialRAG
from src.ingestion.news_fetcher import NewsFetcher
from src.analysis.trendline_analyzer import TrendlineAnalyzer
from src.notifications.command_bot import handle_whatsapp_command
from src.notifications.notifier import Notifier
from src.users.schemas import UserCreate, UserResponse
from src.auth.auth import create_access_token
from src.users.crud import create_user, get_user_by_email
from src.database.session import get_db   # Make sure this uses yield!
from src.users.api_keys import create_api_key, revoke_api_key, get_user_by_api_key
from src.users.bot_manager import get_user_bot_manager
from src.auth.dependencies import get_current_user, require_admin

import yfinance as yf
from loguru import logger

# ===================== Models (Pydantic) =====================
from pydantic import BaseModel, Field

class PaymentNotification(BaseModel):
    transaction_id: str

class ContactForm(BaseModel):
    subject: str
    message: str

class VerifyAccount(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    dob: Optional[str] = None  # ISO format
    address: Optional[str] = None

class ApproveTransaction(BaseModel):
    transaction_id: str
    tx_hash: Optional[str] = None

class RejectTransaction(BaseModel):
    transaction_id: str

class UpdateUser(BaseModel):
    email: str
    # add other updatable fields as needed

# ===================== Router Setup =====================
router = APIRouter()
notifier = Notifier()
rag = FinancialRAG()
limiter = Limiter(key_func=get_remote_address)  # from slowapi

# ===================== API Key Authentication Helper =====================
def authenticate_api_key(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
    required_scope: Optional[str] = None,
):
    """Reusable dependency for public API key auth"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Use Bearer <api_key>",
        )

    api_key = authorization.split(" ")[1]
    user = get_user_by_api_key(db, api_key)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")

    # Optional: Implement scope checking here
    # if required_scope and not check_scope(...):
    #     raise HTTPException(403, f"Missing scope: {required_scope}")

    return user


# ===================== Public Bot Routes (API Key Protected) =====================
@router.post("/public/bot/start")
async def public_start_bot(
    ticker: str = Query(..., description="Ticker symbol"),
    paper: bool = True,
    user=Depends(authenticate_api_key),
):
    manager = get_user_bot_manager(user.email, user.id)
    result = manager.start_bot(ticker, paper)
    return {"status": "success", "message": result, "bot_status": manager.get_status()}


@router.post("/public/bot/stop")
async def public_stop_bot(user=Depends(authenticate_api_key)):
    manager = get_user_bot_manager(user.email, user.id)
    result = manager.stop_bot()
    return {"status": "success", "message": result, "bot_status": manager.get_status()}


@router.get("/public/bot/status")
async def public_bot_status(user=Depends(authenticate_api_key)):
    manager = get_user_bot_manager(user.email, user.id)
    return manager.get_status()


@router.get("/public/bot/trades")
async def public_get_trades(limit: int = 20, user=Depends(authenticate_api_key)):
    manager = get_user_bot_manager(user.email, user.id)
    return {"trades": manager.get_trades(limit)}


# ===================== Auth Routes =====================
@router.post("/auth/signup", response_model=UserResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, user_data)


@router.post("/auth/login")
async def login(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user_data.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    # TODO: Implement proper password verification with bcrypt/passlib
    token = create_access_token({"sub": user_data.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/users/me")
async def get_me(current_user=Depends(get_current_user)):
    return current_user


# ===================== API Key Management =====================
@router.post("/api-keys")
async def create_new_api_key(
    key_name: str,
    expires_days: int = 365,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_key = create_api_key(db, user.id, key_name, expires_days)
    return {
        "message": "API Key created successfully",
        "key_name": key_name,
        "api_key": new_key.api_key,
        "warning": "Save this key now — it will not be shown again.",
    }


@router.get("/api-keys")
async def list_api_keys(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    keys = db.query(APIKey).filter(APIKey.user_id == user.id).all()
    return [
        {
            "key_name": k.key_name,
            "created_at": k.created_at,
            "expires_at": k.expires_at,
            "is_active": k.is_active,
        }
        for k in keys
    ]


@router.delete("/api-keys/{api_key}")
async def revoke_key(
    api_key: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if revoke_api_key(db, api_key, user.id if user else None):
        return {"message": "API key revoked successfully"}
    raise HTTPException(status_code=404, detail="API key not found")


# ===================== Admin Routes =====================
@router.get("/admin/users", dependencies=[Depends(require_admin)])
@limiter.limit("30/minute")
async def admin_get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": getattr(u, "full_name", None),
            "is_active": u.is_active,
            "is_banned": getattr(u, "is_banned", False),
            "is_mail_verified": getattr(u, "is_mail_verified", False),
        }
        for u in users
    ]


@router.post("/admin/update-user", dependencies=[Depends(require_admin)])
@limiter.limit("20/minute")
async def admin_update_user(data: UpdateUser, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        if key != "email" and hasattr(user, key):
            setattr(user, key, value)

    db.commit()
    logger.info(f"Admin updated user {data.email}")
    return {"status": "updated"}


@router.post("/admin/delete-user", dependencies=[Depends(require_admin)])
@limiter.limit("10/minute")
async def admin_delete_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    logger.warning(f"Admin DELETED user {email}")
    return {"status": "deleted"}


# Transaction routes (Admin)
@router.get("/admin/transactions", dependencies=[Depends(require_admin)])
async def get_all_transactions(db: Session = Depends(get_db)):
    transactions = db.query(UserMoney).order_by(UserMoney.created_at.desc()).all()
    # ... (same formatting as before)
    return [...]  # keep your existing list comprehension


@router.post("/admin/approve-transaction", dependencies=[Depends(require_admin)])
async def approve_transaction(
    data: ApproveTransaction, db: Session = Depends(get_db)
):
    # ... (updated version from previous response, using Pydantic model)
    pass  # replace with your logic


@router.post("/admin/reject-transaction", dependencies=[Depends(require_admin)])
async def reject_transaction(
    data: RejectTransaction, db: Session = Depends(get_db)
):
    # similar update
    pass


# ===================== User Features =====================
@router.post("/notify-payment")
async def notify_payment(
    data: PaymentNotification,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ... your existing logic
    pass


@router.post("/contact")
async def submit_contact(
    form: ContactForm,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # create Complaint model instance
    pass


@router.post("/verify-account")
async def verify_account(
    data: VerifyAccount,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # update user fields
    pass


# ===================== Ingestion, RAG, Analysis =====================
@router.post("/ingest")
async def trigger_ingestion(background_tasks: BackgroundTasks):
    task = ingest_and_detect_events.delay()
    return {"status": "triggered", "task_id": task.id}


@router.get("/analyze-trendline")
async def analyze_trendline(
    ticker: str = Query(...),
    period: str = Query("60d"),
):
    try:
        df = yf.download(ticker, period=period, interval="1h", progress=False)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data returned")
        analyzer = TrendlineAnalyzer(length=14, mult=1.0, calc_method="Atr")
        result = analyzer.analyze(df, ticker=ticker.upper())
        return result
    except Exception as e:
        logger.error(f"Trendline analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================== Webhooks =====================
@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    form_data = await request.form()
    body = form_data.get("Body", "")
    from_number = form_data.get("From", "")

    if body.startswith("/"):
        reply = handle_whatsapp_command(body, from_number)
        return {"status": "processed", "reply": reply}
    return {"status": "ignored"}


@router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.get("/events")
async def get_recent_events(limit: int = 20, db: Session = Depends(get_db)):
    from src.database.models import Event
    events = (
        db.query(Event)
        .order_by(Event.created_at.desc())
        .limit(limit)
        .all()
    )
    return {"events": [e.to_dict() for e in events]}  # better if you add .to_dict() method on model

# ===================== Celery Monitoring & Background Tasks =====================

@router.post("/ingest")
async def trigger_ingestion(background_tasks: BackgroundTasks):
    """Trigger heavy ingestion + event detection via Celery (recommended for long tasks)"""
    task = ingest_and_detect_events.delay()
    return {
        "status": "triggered",
        "task_id": task.id,
        "message": "Ingestion task queued. Use /celery/task/{task_id} to check status.",
        "monitor_url": f"/celery/task/{task.id}"
    }


@router.get("/celery/task/{task_id}")
async def get_celery_task_status(task_id: str):
    """Get status and result of any Celery task"""
    task_result = AsyncResult(task_id, app=celery_app)

    response = {
        "task_id": task_id,
        "status": task_result.status,          # PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
        "successful": task_result.successful(),
        "failed": task_result.failed(),
    }

    if task_result.ready():
        try:
            response["result"] = task_result.get() if task_result.successful() else str(task_result.result)
        except Exception as e:
            response["result"] = f"Error retrieving result: {str(e)}"
        response["date_done"] = task_result.date_done.isoformat() if task_result.date_done else None

    return response


@router.get("/celery/tasks/recent")
async def get_recent_celery_tasks(limit: int = 20):
    """Simple list of recent tasks (requires Celery events enabled or custom tracking)"""
    # Basic version using inspect (works if events are enabled)
    try:
        i = celery_app.control.inspect()
        active = i.active() or {}
        reserved = i.reserved() or {}
        scheduled = i.scheduled() or {}

        return {
            "active_tasks": active,
            "reserved_tasks": reserved,
            "scheduled_tasks": scheduled,
            "note": "For full history, use Flower dashboard or implement custom task tracking in Redis/DB"
        }
    except Exception as e:
        logger.warning(f"Celery inspect failed: {e}")
        return {"error": "Could not fetch task info. Make sure Celery workers are running and events are enabled."}


@router.get("/celery/workers")
async def get_celery_workers():
    """Check status of connected Celery workers"""
    try:
        i = celery_app.control.inspect()
        stats = i.stats() or {}
        ping = i.ping() or {}

        return {
            "workers": list(stats.keys()),
            "stats": stats,
            "ping": ping,
            "active_workers": len(stats)
        }
    except Exception as e:
        return {"error": f"Could not inspect workers: {str(e)}", "hint": "Ensure workers are running with 'celery -A src.celery_app worker -l info'"}


@router.post("/celery/revoke/{task_id}")
async def revoke_celery_task(task_id: str, terminate: bool = False):
    """Revoke (cancel) a running or queued Celery task"""
    try:
        celery_app.control.revoke(task_id, terminate=terminate, signal="SIGKILL" if terminate else None)
        return {"status": "revoked", "task_id": task_id, "terminated": terminate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to revoke task: {str(e)}")


# Optional: Simple BackgroundTasks example (for quick/light tasks)
@router.post("/background/example")
async def example_background_task(background_tasks: BackgroundTasks):
    """Demonstration of FastAPI's built-in BackgroundTasks (lighter than Celery)"""
    def send_notification():
        logger.info("Sending background notification...")
        # notifier.send_email(...) or any quick task
        pass

    background_tasks.add_task(send_notification)
    return {"status": "background task added", "message": "This runs after response is sent"}