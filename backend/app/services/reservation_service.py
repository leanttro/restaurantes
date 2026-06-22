"""Reservation business logic: availability checks, creation, status management."""
import logging
import secrets
from datetime import datetime, date, time, timedelta
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.reservation import Reservation
from app.models.available_hour import AvailableHour
from app.models.restaurant import Restaurant
from app.models.client import Client
from app.models.promotion import Promotion
from app.models.scheduled_job import ScheduledJob
from app.schemas.reservation import ReservationCreate, AvailabilityCheck
from app.utils.constants import ReservationStatus, JobType, JobStatus

logger = logging.getLogger(__name__)


def _parse_time(t_str: str) -> time:
    """Parse 'HH:MM' string into a time object."""
    h, m = t_str.split(":")
    return time(int(h), int(m))


class ReservationService:
    def __init__(self, db: Session):
        self.db = db

    def _get_restaurant_or_404(self, restaurant_id) -> Restaurant:
        r = self.db.query(Restaurant).filter(
            Restaurant.id == restaurant_id, Restaurant.is_active == True
        ).first()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
        return r

    def _schedule_jobs(self, reservation: Reservation) -> None:
        """
        Insert ScheduledJob rows for a freshly confirmed reservation:
          - reminder_24h  → 24 hours before
          - reminder_1h   → 1 hour before
          - post_visit_feedback → 2 hours after
        Jobs are picked up by the Celery beat task `dispatch_due_jobs`.
        """
        res_dt = datetime.combine(reservation.reservation_date, reservation.reservation_time)

        jobs = [
            (JobType.REMINDER_24H, res_dt - timedelta(hours=24)),
            (JobType.REMINDER_1H,  res_dt - timedelta(hours=1)),
            (JobType.POST_VISIT_FEEDBACK, res_dt + timedelta(hours=2)),
        ]

        for job_type, scheduled_for in jobs:
            # Don't schedule jobs in the past (e.g. reservation created < 24h before)
            if scheduled_for <= datetime.utcnow():
                logger.debug(f"Skipping {job_type} for reservation {reservation.id} — time already passed")
                continue

            # Avoid duplicates if called more than once
            existing = self.db.query(ScheduledJob).filter(
                ScheduledJob.reservation_id == reservation.id,
                ScheduledJob.job_type == job_type,
                ScheduledJob.status == JobStatus.PENDING,
            ).first()
            if existing:
                continue

            job = ScheduledJob(
                reservation_id=reservation.id,
                job_type=job_type,
                scheduled_for=scheduled_for,
                status=JobStatus.PENDING,
            )
            self.db.add(job)

        self.db.commit()
        logger.info(f"Scheduled jobs created for reservation {reservation.id}")

    def check_availability(self, data: AvailabilityCheck) -> dict:
        """Return available time slots and active promotions for a given date."""
        self._get_restaurant_or_404(data.restaurant_id)

        day_of_week = data.date.weekday()  # 0=Monday
        hours = self.db.query(AvailableHour).filter(
            AvailableHour.restaurant_id == data.restaurant_id,
            AvailableHour.day_of_week == day_of_week,
            AvailableHour.is_active == True,
        ).all()

        if not hours:
            return {"date": data.date.isoformat(), "available_slots": [], "active_promotions": []}

        # Build all possible slots
        slots: list[dict] = []
        for hour_config in hours:
            current = datetime.combine(data.date, hour_config.start_time)
            end = datetime.combine(data.date, hour_config.end_time)
            interval = timedelta(minutes=hour_config.interval_minutes)

            while current < end:
                slot_time = current.time()
                # Count confirmed reservations at this slot
                booked = self.db.query(func.sum(Reservation.party_size)).filter(
                    Reservation.restaurant_id == data.restaurant_id,
                    Reservation.reservation_date == data.date,
                    Reservation.reservation_time == slot_time,
                    Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.PENDING]),
                ).scalar() or 0

                available = hour_config.max_capacity - booked
                slots.append({
                    "time": slot_time.strftime("%H:%M"),
                    "available_capacity": max(0, available),
                    "is_available": available >= data.party_size,
                })
                current += interval

        # Active promotions
        now = datetime.utcnow()
        promotions = self.db.query(Promotion).filter(
            Promotion.restaurant_id == data.restaurant_id,
            Promotion.is_active == True,
            Promotion.valid_from <= now,
            Promotion.valid_until >= now,
        ).all()

        return {
            "date": data.date.isoformat(),
            "available_slots": slots,
            "active_promotions": [p.to_dict() for p in promotions],
        }

    def create(self, data: ReservationCreate, current_user=None) -> Reservation:
        """Create a reservation, resolving or creating a Client record."""
        self._get_restaurant_or_404(data.restaurant_id)

        # Resolve guest phone
        phone = data.guest_phone
        if current_user and current_user.phone:
            phone = current_user.phone

        # Find or create client
        client: Optional[Client] = None
        if phone:
            client = self.db.query(Client).filter(
                Client.phone == phone,
                Client.restaurant_id == data.restaurant_id,
            ).first()
            if not client:
                client = Client(
                    phone=phone,
                    name=data.guest_name or (current_user.full_name if current_user else None),
                    email=data.guest_email or (current_user.email if current_user else None),
                    restaurant_id=data.restaurant_id,
                )
                self.db.add(client)
                self.db.flush()

        reservation = Reservation(
            restaurant_id=data.restaurant_id,
            client_id=client.id if client else None,
            guest_name=data.guest_name,
            guest_phone=data.guest_phone,
            guest_email=str(data.guest_email) if data.guest_email else None,
            reservation_date=data.reservation_date,
            reservation_time=_parse_time(data.reservation_time),
            party_size=data.party_size,
            occasion=data.occasion,
            special_requests=data.special_requests,
            status=ReservationStatus.PENDING,
            confirmation_token=secrets.token_urlsafe(32),
        )
        self.db.add(reservation)

        if client:
            client.total_reservations = (client.total_reservations or 0) + 1

        self.db.commit()
        self.db.refresh(reservation)
        logger.info(f"Reservation created: {reservation.id}")
        return reservation

    def update_status(self, reservation_id, new_status: str, restaurant_id=None) -> Reservation:
        """Update reservation status with validation. Schedules jobs on confirmation."""
        query = self.db.query(Reservation).filter(Reservation.id == reservation_id)
        if restaurant_id:
            query = query.filter(Reservation.restaurant_id == restaurant_id)

        reservation = query.first()
        if not reservation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

        if new_status not in ReservationStatus.ALL:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {new_status}")

        previous_status = reservation.status
        reservation.status = new_status
        self.db.commit()
        self.db.refresh(reservation)
        logger.info(f"Reservation {reservation_id} status → {new_status}")

        # Schedule reminder/feedback jobs when a reservation is confirmed
        if new_status == ReservationStatus.CONFIRMED and previous_status != ReservationStatus.CONFIRMED:
            self._schedule_jobs(reservation)

        return reservation

    def get_by_id(self, reservation_id) -> Reservation:
        r = self.db.query(Reservation).filter(Reservation.id == reservation_id).first()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
        return r

    def list_for_restaurant(self, restaurant_id, page: int = 1, size: int = 20,
                             date_filter: Optional[date] = None,
                             status_filter: Optional[str] = None) -> dict:
        """Paginated reservation list for a restaurant."""
        query = self.db.query(Reservation).filter(Reservation.restaurant_id == restaurant_id)

        if date_filter:
            query = query.filter(Reservation.reservation_date == date_filter)
        if status_filter:
            query = query.filter(Reservation.status == status_filter)

        total = query.count()
        items = query.order_by(Reservation.reservation_date, Reservation.reservation_time)\
                     .offset((page - 1) * size).limit(size).all()

        return {"items": items, "total": total, "page": page, "size": size}

    def get_dashboard(self, restaurant_id, target_date: date) -> dict:
        """Today's summary for restaurant dashboard."""
        reservations = self.db.query(Reservation).filter(
            Reservation.restaurant_id == restaurant_id,
            Reservation.reservation_date == target_date,
        ).all()

        confirmed = [r for r in reservations if r.status == ReservationStatus.CONFIRMED]
        pending = [r for r in reservations if r.status == ReservationStatus.PENDING]
        cancelled = [r for r in reservations if r.status == ReservationStatus.CANCELLED]
        total_guests = sum(r.party_size for r in confirmed)

        return {
            "date": target_date.isoformat(),
            "total_reservations": len(reservations),
            "confirmed": len(confirmed),
            "pending": len(pending),
            "cancelled": len(cancelled),
            "total_guests": total_guests,
            "occupancy_rate": round(len(confirmed) / max(len(reservations), 1) * 100, 1),
        }
