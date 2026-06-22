"""Pydantic schemas for Chatbot and WhatsApp webhook endpoints."""
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class ChatMessage(BaseModel):
    restaurant_id: UUID
    client_phone: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str


class WhatsAppWebhookPayload(BaseModel):
    """Evolution API webhook payload (simplified)."""
    instance: Optional[str] = None
    data: Optional[dict] = None

    model_config = {"extra": "allow"}
