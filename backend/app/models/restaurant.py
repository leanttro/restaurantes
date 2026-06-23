"""Restaurant model — the core multi-tenant entity."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    network_group_id = Column(UUID(as_uuid=True), nullable=True)

    # Novos campos de perfil público
    cuisine_type = Column(String(100), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    max_party_size = Column(Integer, nullable=True)

    # Contact
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    whatsapp_number = Column(String(20), nullable=True)

    # Location
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # WhatsApp integration
    evolution_instance_id = Column(String(255), nullable=True)

    # Banners clicáveis
    banner1_image_url = Column(String(500), nullable=True)
    banner1_link_url = Column(String(500), nullable=True)
    banner2_image_url = Column(String(500), nullable=True)
    banner2_link_url = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    admins = relationship("User", back_populates="restaurant", foreign_keys="User.restaurant_id")
    available_hours = relationship("AvailableHour", back_populates="restaurant", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="restaurant")
    clients = relationship("Client", back_populates="restaurant")
    promotions = relationship("Promotion", back_populates="restaurant", cascade="all, delete-orphan")
    chatbot_setting = relationship("ChatbotSetting", back_populates="restaurant", uselist=False)
    whatsapp_templates = relationship("WhatsappTemplate", back_populates="restaurant", cascade="all, delete-orphan")
    images = relationship("RestaurantImage", back_populates="restaurant", cascade="all, delete-orphan")
    analytics = relationship("ReservationAnalytics", back_populates="restaurant", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "cuisine_type": self.cuisine_type,
            "cover_image_url": self.cover_image_url,
            "logo_url": self.logo_url,
            "max_party_size": self.max_party_size,
            "phone": self.phone,
            "email": self.email,
            "whatsapp_number": self.whatsapp_number,
            "address": self.address,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "evolution_instance_id": self.evolution_instance_id,
            "banner1_image_url": self.banner1_image_url,
            "banner1_link_url": self.banner1_link_url,
            "banner2_image_url": self.banner2_image_url,
            "banner2_link_url": self.banner2_link_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Restaurant {self.name} ({self.slug})>"
