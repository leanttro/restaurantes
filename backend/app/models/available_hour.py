"""AvailableHour model — defines when a restaurant accepts reservations."""
import uuid
from sqlalchemy import Column, String, Integer, Time, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base


class AvailableHour(Base):
    __tablename__ = "available_hours"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    interval_minutes = Column(Integer, default=30, nullable=False)
    max_capacity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="available_hours")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "interval_minutes": self.interval_minutes,
            "max_capacity": self.max_capacity,
            "is_active": self.is_active,
        }

    def __repr__(self) -> str:
        return f"<AvailableHour day={self.day_of_week} {self.start_time}-{self.end_time}>"
