"""Chatbot routes — public AI messaging endpoint."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.schemas.chatbot import ChatMessage, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(tags=["Chatbot"])


@router.get("/chatbot/settings")
def get_chatbot_settings(
    restaurant_id: UUID,
    db: Session = Depends(get_db),
):
    """Get chatbot settings — montado em /api/restaurants/{restaurant_id}"""
    from app.models.restaurant import Restaurant

    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    return {
        "restaurant_id": str(r.id),
        "enabled": True,
        "name": f"Assistente {r.name}",
        "greeting": f"Olá! Bem-vindo ao {r.name}. Como posso ajudar?",
        "theme": "light",
    }


@router.post("/chatbot/settings")
def update_chatbot_settings(
    restaurant_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
):
    from app.models.restaurant import Restaurant

    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    return {
        "restaurant_id": str(r.id),
        "enabled": data.get("enabled", True),
        "name": data.get("name", f"Assistente {r.name}"),
        "greeting": data.get("greeting", f"Olá! Bem-vindo ao {r.name}. Como posso ajudar?"),
        "theme": data.get("theme", "light"),
    }


@router.post("/chatbot/message", response_model=ChatResponse)
async def chat(data: ChatMessage, db: Session = Depends(get_db)):
    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=data.restaurant_id,
        client_phone=data.client_phone,
        user_message=data.message,
    )
    return ChatResponse(reply=result["reply"], conversation_id=result["conversation_id"])
