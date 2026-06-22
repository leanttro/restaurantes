"""ReservationAnalytics model — daily aggregated stats per restaurant."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, Date, DateTime, Integer, Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base


class ReservationAnalytics(Base):
    __tablename__ = "reservation_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)

    total_reservations = Column(Integer, default=0, nullable=False)
    total_guests = Column(Integer, default=0, nullable=False)
    average_party_size = Column(Float, default=0.0, nullable=False)
    no_shows = Column(Integer, default=0, nullable=False)
    cancellations = Column(Integer, default=0, nullable=False)
    occupancy_rate = Column(Float, default=0.0, nullable=False)  # 0.0 – 1.0

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("restaurant_id", "date", name="uq_analytics_restaurant_date"),
    )

    # Relationships
    restaurant = relationship("Restaurant", back_populates="analytics")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "date": self.date.isoformat(),
            "total_reservations": self.total_reservations,
            "total_guests": self.total_guests,
            "average_party_size": self.average_party_size,
            "no_shows": self.no_shows,
            "cancellations": self.cancellations,
            "occupancy_rate": self.occupancy_rate,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<ReservationAnalytics {self.restaurant_id} {self.date}>"
