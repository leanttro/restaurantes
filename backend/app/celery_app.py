"""
Celery application and tasks for background jobs.

Run worker:
    celery -A app.celery_app worker --loglevel=info --beat
"""
import logging
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab
from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "reserva",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    beat_schedule={
        # Scan scheduled_jobs table every 5 minutes and dispatch due jobs
        "check-pending-jobs": {
            "task": "app.jobs.reminders.dispatch_due_jobs",
            "schedule": crontab(minute="*/5"),
        },
    },
)

# Auto-discover tasks in the jobs package
celery_app.autodiscover_tasks(["app.jobs"])



