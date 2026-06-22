"""Promotion model — time-bound discounts for restaurants."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.utils.db import Base
from app.utils.constants import DiscountType


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(
        Enum(DiscountType.PERCENTAGE, DiscountType.FIXED, name="discount_type_enum"),
        nullable=False,
    )
    discount_value = Column(Float, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    conditions = Column(JSONB, default=dict)  # e.g. {"min_party_size": 4, "days_of_week": [1,2,3]}
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="promotions")

    @property
    def is_currently_valid(self) -> bool:
        now = datetime.utcnow()
        return self.is_active and self.valid_from <= now <= self.valid_until

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "title": self.title,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "valid_from": self.valid_from.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "conditions": self.conditions or {},
            "is_active": self.is_active,
            "is_currently_valid": self.is_currently_valid,
        }

    def __repr__(self) -> str:
        return f"<Promotion {self.title}>"
