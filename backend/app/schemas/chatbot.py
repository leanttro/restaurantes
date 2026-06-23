"""Pydantic schemas for Chatbot and WhatsApp webhook endpoints."""
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class ChatMessage(BaseModel):
    restaurant_id: Optional[UUID] = None  # pode vir na URL ou no body
    client_phone: str
    message: str


class ReservationDraft(BaseModel):
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_email: Optional[str] = None
    reservation_date: Optional[str] = None   # YYYY-MM-DD
    reservation_time: Optional[str] = None   # HH:MM
    party_size: Optional[int] = None
    special_requests: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str
    reservation_draft: Optional[ReservationDraft] = None
    is_ready_to_confirm: bool = False


class WhatsAppWebhookPayload(BaseModel):
    """Evolution API webhook payload (simplified)."""
    instance: Optional[str] = None
    data: Optional[dict] = None

    model_config = {"extra": "allow"}
