"""Chatbot routes — public AI messaging endpoint."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.schemas.chatbot import ChatMessage, ChatResponse
from app.services.chatbot_service import ChatbotService
from app.models.chatbot_setting import ChatbotSetting, DEFAULT_SYSTEM_PROMPT, DEFAULT_GREETING

router = APIRouter(tags=["Chatbot"])


def _get_or_create_setting(restaurant_id: UUID, db: Session) -> ChatbotSetting:
    """Retorna o ChatbotSetting existente ou cria um padrão."""
    setting = db.query(ChatbotSetting).filter(
        ChatbotSetting.restaurant_id == restaurant_id
    ).first()

    if not setting:
        from app.models.restaurant import Restaurant
        r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Restaurante não encontrado")

        setting = ChatbotSetting(
            restaurant_id=restaurant_id,
            temperature=0.7,
            system_prompt=DEFAULT_SYSTEM_PROMPT.replace("{restaurant_name}", r.name),
            greeting_message=DEFAULT_GREETING.replace("{restaurant_name}", r.name),
            is_active=True,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return setting


@router.get("/{restaurant_id}/chatbot/settings")
def get_chatbot_settings(restaurant_id: UUID, db: Session = Depends(get_db)):
    setting = _get_or_create_setting(restaurant_id, db)
    return {
        **setting.to_dict(),
        "is_enabled": setting.is_active,  # alias que o frontend usa
    }


@router.post("/{restaurant_id}/chatbot/settings")
def update_chatbot_settings(
    restaurant_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
):
    setting = _get_or_create_setting(restaurant_id, db)

    if "temperature" in data:
        setting.temperature = float(data["temperature"])
    if "system_prompt" in data:
        setting.system_prompt = data["system_prompt"]
    if "greeting_message" in data:
        setting.greeting_message = data["greeting_message"]
    if "is_enabled" in data:
        setting.is_active = bool(data["is_enabled"])

    db.commit()
    db.refresh(setting)
    return {
        **setting.to_dict(),
        "is_enabled": setting.is_active,
    }


@router.post("/{restaurant_id}/chatbot/message", response_model=ChatResponse)
async def chat(
    restaurant_id: UUID,
    data: ChatMessage,
    db: Session = Depends(get_db),
):
    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=restaurant_id,
        client_phone=data.client_phone,
        user_message=data.message,
    )
    return ChatResponse(reply=result["reply"], conversation_id=result["conversation_id"])


@router.post("/{restaurant_id}/chatbot/test")
async def test_chatbot(
    restaurant_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
):
    """Testa o chatbot com uma mensagem avulsa, sem salvar conversa."""
    from app.models.restaurant import Restaurant
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    message = data.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=422, detail="message é obrigatório")

    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=restaurant_id,
        client_phone="test_dashboard",
        user_message=message,
    )
    return {"reply": result["reply"]}
