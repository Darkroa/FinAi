from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import time
from src.database.session import SessionLocal
from src.database.models import APIKey, APIUsageLog
from loguru import logger

# In-memory rate limit store (per API key)
rate_limit_store = defaultdict(list)  # api_key -> list of timestamps

class APIRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for auth and docs
        if request.url.path.startswith(("/auth", "/docs", "/redoc", "/openapi")):
            return await call_next(request)

        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return await call_next(request)

        api_key = authorization.split(" ")[1]
        
        # Rate limiting: 10 requests per minute
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        
        # Clean old timestamps
        rate_limit_store[api_key] = [ts for ts in rate_limit_store[api_key] if ts > minute_ago]
        
        if len(rate_limit_store[api_key]) >= 10:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 10 requests per minute.")

        # Record this request
        rate_limit_store[api_key].append(now)

        # Log usage to database (async-friendly)
        start_time = time.time()
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000

        try:
            db = SessionLocal()
            # Find API key record
            key_record = db.query(APIKey).filter(APIKey.api_key == api_key).first()
            if key_record:
                log = APIUsageLog(
                    api_key_id=key_record.id,
                    user_id=key_record.user_id,
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=duration
                )
                db.add(log)
                db.commit()
        except Exception as e:
            logger.error(f"Failed to log API usage: {e}")
        finally:
            db.close()

        return response