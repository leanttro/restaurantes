"""
Celery tasks for reservation reminders.

Job types:
  reminder_24h  — sent 24 hours before the reservation
  reminder_1h   — sent 1 hour before the reservation

Both tasks are scheduled automatically when a reservation is confirmed
(see reservation_service.py → _schedule_jobs).

The beat task `check-pending-jobs` runs every 5 minutes and dispatches
any ScheduledJob rows that are due and still pending.
"""
import logging
from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.utils.db import SessionLocal
from app.utils.constants import JobType, JobStatus, ReservationStatus

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Beat task: runs every 5 min, finds due jobs and executes them
# ──────────────────────────────────────────────────────────────

@celery_app.task(name="app.jobs.reminders.dispatch_due_jobs", bind=True, max_retries=3)
def dispatch_due_jobs(self):
    """
    Scan the scheduled_jobs table for pending jobs whose scheduled_for
    is in the past (or within the next 2 minutes) and execute them.
    """
    from app.models.scheduled_job import ScheduledJob

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due_jobs = (
            db.query(ScheduledJob)
            .filter(
                ScheduledJob.status == JobStatus.PENDING,
                ScheduledJob.scheduled_for <= now + timedelta(minutes=2),
            )
            .all()
        )

        if not due_jobs:
            logger.debug("No jobs due.")
            return {"dispatched": 0}

        dispatched = 0
        for job in due_jobs:
            try:
                if job.job_type == JobType.REMINDER_1H:
                    send_reminder_1h.delay(str(job.id))
                elif job.job_type == JobType.REMINDER_24H:
                    send_reminder_24h.delay(str(job.id))
                elif job.job_type == JobType.POST_VISIT_FEEDBACK:
                    send_post_visit_feedback.delay(str(job.id))
                dispatched += 1
            except Exception as exc:
                logger.error(f"Failed to dispatch job {job.id}: {exc}")

        logger.info(f"Dispatched {dispatched} jobs.")
        return {"dispatched": dispatched}

    except Exception as exc:
        logger.error(f"dispatch_due_jobs error: {exc}")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────
# Reminder helpers
# ──────────────────────────────────────────────────────────────

def _mark_job(db, job, success: bool, error: str | None = None):
    from app.models.scheduled_job import ScheduledJob
    job.status = JobStatus.EXECUTED if success else JobStatus.FAILED
    job.executed_at = datetime.utcnow()
    job.error_message = error
    db.commit()


def _get_job_and_reservation(db, job_id: str):
    """Return (ScheduledJob, Reservation) or (None, None) if not found/applicable."""
    from app.models.scheduled_job import ScheduledJob
    from app.models.reservation import Reservation

    job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
    if not job or job.status != JobStatus.PENDING:
        return None, None

    reservation = (
        db.query(Reservation)
        .filter(Reservation.id == job.reservation_id)
        .first()
    )
    if not reservation or reservation.status != ReservationStatus.CONFIRMED:
        _mark_job(db, job, success=False, error="Reservation not confirmed or missing")
        return None, None

    return job, reservation


# ──────────────────────────────────────────────────────────────
# Task: 1-hour reminder
# ──────────────────────────────────────────────────────────────

@celery_app.task(name="app.jobs.reminders.send_reminder_1h", bind=True, max_retries=3)
def send_reminder_1h(self, job_id: str):
    """Send a WhatsApp reminder 1 hour before the reservation."""
    import asyncio
    from app.services.whatsapp_service import WhatsAppService

    db = SessionLocal()
    try:
        job, reservation = _get_job_and_reservation(db, job_id)
        if not job:
            return

        wapp = WhatsAppService(db)
        ok = asyncio.run(wapp.send_reminder(reservation, hours_before=1))

        if ok:
            reservation.reminder_sent = True
            _mark_job(db, job, success=True)
            logger.info(f"1h reminder sent for reservation {reservation.id}")
        else:
            _mark_job(db, job, success=False, error="WhatsApp send returned False")

    except Exception as exc:
        logger.error(f"send_reminder_1h failed for job {job_id}: {exc}")
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────
# Task: 24-hour reminder
# ──────────────────────────────────────────────────────────────

@celery_app.task(name="app.jobs.reminders.send_reminder_24h", bind=True, max_retries=3)
def send_reminder_24h(self, job_id: str):
    """Send a WhatsApp reminder 24 hours before the reservation."""
    import asyncio
    from app.services.whatsapp_service import WhatsAppService

    db = SessionLocal()
    try:
        job, reservation = _get_job_and_reservation(db, job_id)
        if not job:
            return

        wapp = WhatsAppService(db)
        ok = asyncio.run(wapp.send_reminder(reservation, hours_before=24))

        if ok:
            _mark_job(db, job, success=True)
            logger.info(f"24h reminder sent for reservation {reservation.id}")
        else:
            _mark_job(db, job, success=False, error="WhatsApp send returned False")

    except Exception as exc:
        logger.error(f"send_reminder_24h failed for job {job_id}: {exc}")
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────
# Task: post-visit feedback
# ──────────────────────────────────────────────────────────────

@celery_app.task(name="app.jobs.reminders.send_post_visit_feedback", bind=True, max_retries=2)
def send_post_visit_feedback(self, job_id: str):
    """
    Send a WhatsApp message asking for feedback ~2 hours after the reservation.
    The reservation status should already be 'completed' by then.
    """
    import asyncio
    from app.services.whatsapp_service import WhatsAppService
    from app.models.scheduled_job import ScheduledJob

    db = SessionLocal()
    try:
        from app.models.scheduled_job import ScheduledJob
        from app.models.reservation import Reservation

        job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
        if not job or job.status != JobStatus.PENDING:
            return

        reservation = db.query(Reservation).filter(Reservation.id == job.reservation_id).first()
        if not reservation:
            _mark_job(db, job, success=False, error="Reservation not found")
            return

        wapp = WhatsAppService(db)
        ok = asyncio.run(wapp.send_feedback_request(reservation))

        _mark_job(db, job, success=ok, error=None if ok else "WhatsApp send returned False")
        if ok:
            logger.info(f"Feedback request sent for reservation {reservation.id}")

    except Exception as exc:
        logger.error(f"send_post_visit_feedback failed for job {job_id}: {exc}")
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
