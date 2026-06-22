"""Chatbot routes — public AI messaging endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.schemas.chatbot import ChatMessage, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(tags=["Chatbot"])


@router.post("/message", response_model=ChatResponse)
async def chat(data: ChatMessage, db: Session = Depends(get_db)):
    """
    Process an incoming chatbot message and return an AI-generated reply.

    This endpoint is public — it's called by both the web widget and the
    WhatsApp webhook handler.
    """
    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=data.restaurant_id,
        client_phone=data.client_phone,
        user_message=data.message,
    )
    return ChatResponse(reply=result["reply"], conversation_id=result["conversation_id"])
