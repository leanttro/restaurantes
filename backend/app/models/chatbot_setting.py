"""ChatbotSetting model — per-restaurant AI configuration."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base


DEFAULT_SYSTEM_PROMPT = (
    "Você é um assistente virtual de reservas do restaurante {restaurant_name}. "
    "Ajude os clientes a fazer reservas, tirar dúvidas sobre horários e promoções. "
    "Seja cordial, objetivo e sempre em português."
)

DEFAULT_GREETING = "Olá! Bem-vindo ao {restaurant_name}. Como posso ajudá-lo hoje?"


class ChatbotSetting(Base):
    __tablename__ = "chatbot_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, unique=True)
    temperature = Column(Float, default=0.7, nullable=False)
    system_prompt = Column(Text, default=DEFAULT_SYSTEM_PROMPT, nullable=False)
    greeting_message = Column(Text, default=DEFAULT_GREETING, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="chatbot_setting")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "temperature": self.temperature,
            "system_prompt": self.system_prompt,
            "greeting_message": self.greeting_message,
            "is_active": self.is_active,
        }

    def __repr__(self) -> str:
        return f"<ChatbotSetting restaurant={self.restaurant_id}>"
