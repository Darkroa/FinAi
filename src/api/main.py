from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from loguru import logger

from src.api.routes import router
from src.api.middleware import APIRateLimitMiddleware
from src.notifications.scheduler import scheduler
from src.database.models import Base
from src.database.session import engine

app = FastAPI(title="FinForgeAI API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting + Usage Logging Middleware
app.add_middleware(APIRateLimitMiddleware)

# Prometheus monitoring
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Include all routes
app.include_router(router, prefix="/api")

# Create tables on startup (development)
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    scheduler.start()
    logger.success("🚀 FinForgeAI API started with rate limiting and API key support")

@app.get("/")
async def root():
    return {
        "message": "FinForgeAI API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)