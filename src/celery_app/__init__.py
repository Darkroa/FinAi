from celery import Celery
from celery.signals import task_prerun, task_postrun
from loguru import logger
import os

# Environment-aware broker/backend
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
RESULT_BACKEND = os.getenv("REDIS_RESULT_BACKEND", "redis://redis:6379/1")

celery_app = Celery(
    "finforge",
    broker=REDIS_URL,
    backend=RESULT_BACKEND,
    include=["src.celery_app.tasks"],   # Auto-import tasks
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Important for monitoring & reliability
    task_track_started=True,
    task_send_sent_event=True,
    worker_send_task_events=True,
    result_extended=True,                    # Store more task metadata
    task_time_limit=300,                     # 5 minutes max per task
    task_soft_time_limit=240,
    
    # Beat schedule
    beat_schedule={
        "ingest-and-detect-every-15-min": {
            "task": "src.celery_app.tasks.ingest_and_detect_events",
            "schedule": 15 * 60,   # every 15 minutes
        },
    },
)

# Optional: Log task start/finish
@task_prerun.connect
def task_started(sender=None, task_id=None, task=None, **kwargs):
    logger.info(f"🚀 Celery Task Started → {task.name} [ID: {task_id}]")


@task_postrun.connect
def task_finished(sender=None, task_id=None, task=None, state=None, retval=None, **kwargs):
    logger.info(f"✅ Celery Task Finished → {task.name} [ID: {task_id}] → Status: {state}")