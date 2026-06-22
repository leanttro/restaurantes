"""WhatsApp message template model with placeholder support."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base
from app.utils.constants import TemplateType


DEFAULT_TEMPLATES = {
    TemplateType.CONFIRMATION: (
        "Olá {client_name}! 🎉 Sua reserva no {restaurant_name} foi *confirmada*.\n\n"
        "📅 Data: {date}\n⏰ Hora: {time}\n👥 Pessoas: {party_size}\n\n"
        "Até logo!"
    ),
    TemplateType.REMINDER: (
        "Olá {client_name}! ⏰ Lembrete: sua reserva no {restaurant_name} é *hoje às {time}*.\n\n"
        "📅 {date} | 👥 {party_size} pessoas\n\nAté logo!"
    ),
    TemplateType.CANCELLATION: (
        "Olá {client_name}. Sua reserva no {restaurant_name} para {date} às {time} foi *cancelada*.\n\n"
        "Se desejar reagendar, é só nos chamar aqui. 🙏"
    ),
}


class WhatsappTemplate(Base):
    __tablename__ = "whatsapp_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    template_type = Column(
        Enum(TemplateType.CONFIRMATION, TemplateType.REMINDER, TemplateType.CANCELLATION,
             name="template_type_enum"),
        nullable=False,
    )
    message_body = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="whatsapp_templates")

    def render(self, **kwargs) -> str:
        """Replace placeholders in message_body with provided kwargs."""
        return self.message_body.format(**kwargs)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "template_type": self.template_type,
            "message_body": self.message_body,
            "is_active": self.is_active,
        }

    def __repr__(self) -> str:
        return f"<WhatsappTemplate {self.template_type}>"
