"""ChatConversation model — stores WhatsApp/chatbot message history."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.utils.db import Base
from app.utils.constants import ConversationStatus


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id = Column(UUID(as_uuid=True), ForeignKey("reservations.id"), nullable=True)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    client_phone = Column(String(20), nullable=False, index=True)

    # JSONB array of {"role": "user"|"assistant", "content": "...", "timestamp": "..."}
    messages = Column(JSONB, default=list, nullable=False)

    status = Column(
        Enum(*[ConversationStatus.ACTIVE, ConversationStatus.COMPLETED], name="conversation_status_enum"),
        default=ConversationStatus.ACTIVE,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reservation = relationship("Reservation", back_populates="conversations")
    client = relationship("Client", back_populates="conversations")

    def add_message(self, role: str, content: str) -> None:
        """Append a message to the JSONB messages array."""
        if self.messages is None:
            self.messages = []
        self.messages = self.messages + [
            {"role": role, "content": content, "timestamp": datetime.utcnow().isoformat()}
        ]

    def last_n_messages(self, n: int = 5) -> list[dict]:
        """Return the last N messages for context injection."""
        return (self.messages or [])[-n:]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "reservation_id": str(self.reservation_id) if self.reservation_id else None,
            "restaurant_id": str(self.restaurant_id),
            "client_phone": self.client_phone,
            "messages": self.messages or [],
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<ChatConversation {self.client_phone} ({self.status})>"
