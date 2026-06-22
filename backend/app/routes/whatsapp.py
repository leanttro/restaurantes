"""WhatsApp webhook route — receives Evolution API callbacks."""
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.models.restaurant import Restaurant
from app.services.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WhatsApp"])


@router.post("/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive incoming WhatsApp messages from Evolution API.

    Evolution API sends a POST with JSON payload whenever a message arrives
    on any connected instance. We extract the sender phone, find the restaurant
    by evolution_instance_id, and route to the chatbot service.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.debug(f"WhatsApp webhook payload: {payload}")

    # Evolution API payload structure
    instance_id = payload.get("instance") or payload.get("instanceName")
    data = payload.get("data", {})

    # Guard: only process text messages
    message_type = data.get("messageType") or data.get("type")
    if message_type not in ("conversation", "extendedTextMessage", "text"):
        return {"status": "ignored", "reason": "non-text message type"}

    # Extract sender phone
    key = data.get("key", {})
    sender_phone: str | None = key.get("remoteJid", "").replace("@s.whatsapp.net", "").replace("@c.us", "")
    if not sender_phone:
        return {"status": "ignored", "reason": "no sender phone"}

    # Extract message text
    message = (
        data.get("message", {}).get("conversation")
        or data.get("message", {}).get("extendedTextMessage", {}).get("text")
        or ""
    ).strip()

    if not message:
        return {"status": "ignored", "reason": "empty message"}

    # Resolve restaurant by evolution instance ID
    restaurant = db.query(Restaurant).filter(
        Restaurant.evolution_instance_id == instance_id,
        Restaurant.is_active == True,
    ).first()

    if not restaurant:
        logger.warning(f"No restaurant found for Evolution instance: {instance_id}")
        return {"status": "ignored", "reason": "unknown instance"}

    # Route to chatbot
    svc = ChatbotService(db)
    result = await svc.process_message(
        restaurant_id=restaurant.id,
        client_phone=sender_phone,
        user_message=message,
    )

    # Send reply back via WhatsApp
    from app.services.whatsapp_service import send_whatsapp_message
    await send_whatsapp_message(sender_phone, result["reply"], instance_id)

    logger.info(f"Webhook processed: instance={instance_id} from={sender_phone}")
    return {"status": "ok", "conversation_id": result["conversation_id"]}
