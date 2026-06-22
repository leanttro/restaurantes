"""Client model — CRM data per restaurant tenant."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.utils.db import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)

    # CRM fields
    is_vip = Column(Boolean, default=False, nullable=False)
    total_reservations = Column(Integer, default=0, nullable=False)
    preferred_table = Column(String(50), nullable=True)
    dietary_restrictions = Column(JSONB, default=list)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="clients")
    reservations = relationship("Reservation", back_populates="client")
    conversations = relationship("ChatConversation", back_populates="client")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "phone": self.phone,
            "name": self.name,
            "email": self.email,
            "restaurant_id": str(self.restaurant_id),
            "is_vip": self.is_vip,
            "total_reservations": self.total_reservations,
            "preferred_table": self.preferred_table,
            "dietary_restrictions": self.dietary_restrictions or [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Client {self.phone} ({self.name})>"
