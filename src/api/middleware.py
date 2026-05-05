from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import time
from loguru import logger

from src.database.session import SessionLocal
from src.database.models import APIKey


# In-memory rate limit store: api_key -> list of timestamps
rate_limit_store = defaultdict(list)

def _is_jwt(token: str) -> bool:
    """JWTs have 3 base64 segments separated by dots and start with eyJ."""
    parts = token.split(".")
    return len(parts) == 3 and token.startswith("eyJ")


class APIRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for public/auth/docs/admin routes
        if request.url.path.startswith((
            "/api/auth/",
            "/api/admin/",
            "/api/users/",
            "/api/wallet/",
            "/api/support/",
            "/api/bots/",
            "/api/events",
            "/api/notifications",
            "/api/docs",
            "/api/redoc",
            "/api/openapi",
            "/metrics",
            "/health"
        )):
            return await call_next(request)

        # Extract Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return await call_next(request)

        token = authorization.split(" ")[1].strip()

        # Only rate-limit FinAi public API keys, NOT JWT session tokens
        if _is_jwt(token):
            return await call_next(request)

        # Rate limiting: 60 requests per minute per public API key
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)

        rate_limit_store[token] = [
            ts for ts in rate_limit_store[token] if ts > minute_ago
        ]

        if len(rate_limit_store[token]) >= 60:
            logger.warning(f"Rate limit exceeded for API key: {token[:8]}...")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 60 requests per minute per API key."
            )

        rate_limit_store[token].append(now)

        start_time = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        # Update last_used_at for public API keys
        try:
            db = SessionLocal()
            key_record = db.query(APIKey).filter(APIKey.api_key == token).first()
            if key_record:
                key_record.last_used_at = datetime.utcnow()
                db.commit()
        except Exception as e:
            logger.error(f"Failed to update API key last_used: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass

        return response
