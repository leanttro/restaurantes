"""WhatsApp webhook route — receives Evolution API callbacks."""
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.models.restaurant import Restaurant
from app.services.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WhatsApp"])


@router.get("/{restaurant_id}/whatsapp/status")
def get_whatsapp_status(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Get WhatsApp connection status for a restaurant."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    return {
        "restaurant_id": str(r.id),
        "connected": bool(r.evolution_instance_id),
        "instance_id": r.evolution_instance_id or None,
        "phone": r.phone or None,
        "status": "active" if r.is_active else "inactive",
    }


@router.get("/{restaurant_id}/whatsapp/templates")
def get_whatsapp_templates(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Get WhatsApp message templates for a restaurant."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    templates = [
        {
            "id": "reservation_confirmation",
            "name": "Confirmação de Reserva",
            "content": "Olá {{customer_name}}, sua reserva foi confirmada para {{date}} às {{time}}.",
        },
        {
            "id": "reservation_reminder",
            "name": "Lembrete de Reserva",
            "content": "Oi {{customer_name}}, lembrete: você tem uma reserva hoje às {{time}}. Até logo!",
        },
        {
            "id": "reservation_cancelled",
            "name": "Cancelamento de Reserva",
            "content": "Sua reserva foi cancelada. Se tiver dúvidas, entre em contato conosco.",
        },
    ]

    return {"restaurant_id": str(r.id), "templates": templates}


@router.post("/{restaurant_id}/whatsapp/templates")
def create_whatsapp_template(
    restaurant_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
):
    """Create a new WhatsApp message template."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    template = {
        "id": data.get("id", "template_new"),
        "name": data.get("name", "Novo Template"),
        "content": data.get("content", ""),
    }
    return {"status": "created", "template": template}


@router.post("/{restaurant_id}/whatsapp/connect")
def connect_whatsapp(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Connect WhatsApp to a restaurant."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    return {
        "status": "connected",
        "restaurant_id": str(r.id),
        "instance_id": r.evolution_instance_id,
    }


# CORRIGIDO: webhook em rota separada, fora do prefixo /restaurants
@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Recebe mensagens do WhatsApp via Evolution API.
    ATENÇÃO: este endpoint deve ser registrado em /api (não em /api/restaurants).
    No main.py: app.include_router(whatsapp_router, prefix="/api")
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.debug(f"WhatsApp webhook payload: {payload}")

    instance_id = payload.get("instance") or payload.get("instanceName")
    data = payload.get("data", {})

    message_type = data.get("messageType") or data.get("type")
    if message_type not in ("conversation", "extendedTextMessage", "text"):
        return {"status": "ignored", "reason": "non-text message type"}

    key = data.get("key", {})
    sender_phone: str | None = (
        key.get("remoteJid", "")
        .replace("@s.whatsapp.net", "")
        .replace("@c.us", "")
    )
    if not sender_phone:
        return {"status": "ignored", "reason": "no sender phone"}

    message = (
        data.get("message", {}).get("conversation")
        or data.get("message", {}).get("extendedTextMessage", {}).get("text")
        or ""
    ).strip()

    if not message:
        return {"status": "ignored", "reason": "empty message"}

    restaurant = db.query(Restaurant).filter(
        Restaurant.evolution_instance_id == instance_id,
        Restaurant.is_active == True,
    ).first()

    if not restaurant:
        logger.warning(f"No restaurant found for Evolution instance: {instance_id}")
        return {"status": "ignored", "reason": "unknown instance"}

    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=restaurant.id,
        client_phone=sender_phone,
        user_message=message,
    )

    from app.services.whatsapp_service import send_whatsapp_message
    await send_whatsapp_message(sender_phone, result["reply"], instance_id)

    logger.info(f"Webhook processed: instance={instance_id} from={sender_phone}")
    return {"status": "ok", "conversation_id": result["conversation_id"]}
