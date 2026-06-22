"""Reservation model with status lifecycle management."""
import uuid
from datetime import datetime, date, time
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Date, Time, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base
from app.utils.constants import ReservationStatus


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)

    # Guest info (for unauthenticated bookings)
    guest_name = Column(String(255), nullable=True)
    guest_phone = Column(String(20), nullable=True)
    guest_email = Column(String(255), nullable=True)

    # Booking details
    reservation_date = Column(Date, nullable=False, index=True)
    reservation_time = Column(Time, nullable=False)
    party_size = Column(Integer, nullable=False)
    occasion = Column(String(100), nullable=True)
    special_requests = Column(Text, nullable=True)

    # Lifecycle
    status = Column(
        Enum(*ReservationStatus.ALL, name="reservation_status_enum"),
        nullable=False,
        default=ReservationStatus.PENDING,
        index=True,
    )
    reminder_sent = Column(Boolean, default=False, nullable=False)
    confirmation_token = Column(String(64), nullable=True, unique=True)  # For email/WhatsApp confirm link

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="reservations")
    client = relationship("Client", back_populates="reservations")
    conversations = relationship("ChatConversation", back_populates="reservation")
    scheduled_jobs = relationship("ScheduledJob", back_populates="reservation", cascade="all, delete-orphan")

    @property
    def display_name(self) -> str:
        """Return guest name from client or guest fields."""
        if self.client and self.client.name:
            return self.client.name
        return self.guest_name or "Guest"

    @property
    def contact_phone(self) -> str | None:
        if self.client:
            return self.client.phone
        return self.guest_phone

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "client_id": str(self.client_id) if self.client_id else None,
            "guest_name": self.guest_name,
            "guest_phone": self.guest_phone,
            "guest_email": self.guest_email,
            "reservation_date": self.reservation_date.isoformat(),
            "reservation_time": self.reservation_time.strftime("%H:%M"),
            "party_size": self.party_size,
            "occasion": self.occasion,
            "special_requests": self.special_requests,
            "status": self.status,
            "reminder_sent": self.reminder_sent,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Reservation {self.id} {self.reservation_date} {self.status}>"
