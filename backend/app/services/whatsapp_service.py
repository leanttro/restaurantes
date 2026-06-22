"""Evolution API (WhatsApp) integration service."""
import logging
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models.whatsapp_template import WhatsappTemplate, DEFAULT_TEMPLATES
from app.models.restaurant import Restaurant
from app.utils.constants import TemplateType

logger = logging.getLogger(__name__)

EVOLUTION_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {settings.EVOLUTION_API_TOKEN}",
}


async def send_whatsapp_message(phone: str, text: str, instance_id: str) -> bool:
    """
    Send a WhatsApp text message via Evolution API.

    Args:
        phone: Recipient phone (E.164 without +, e.g. "5511999999999")
        text: Message body
        instance_id: Evolution API instance identifier for this restaurant

    Returns:
        True on success, False on failure.
    """
    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{instance_id}"
    payload = {"number": phone, "text": text}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=EVOLUTION_HEADERS)
            response.raise_for_status()
            logger.info(f"WhatsApp sent to {phone} via instance {instance_id}")
            return True
    except httpx.HTTPStatusError as exc:
        logger.error(f"Evolution API HTTP error {exc.response.status_code}: {exc.response.text}")
    except httpx.RequestError as exc:
        logger.error(f"Evolution API connection error: {exc}")
    return False


class WhatsAppService:
    def __init__(self, db: Session):
        self.db = db

    def _get_template(self, restaurant_id, template_type: str) -> str:
        """Fetch custom template or fall back to default."""
        tmpl = self.db.query(WhatsappTemplate).filter(
            WhatsappTemplate.restaurant_id == restaurant_id,
            WhatsappTemplate.template_type == template_type,
            WhatsappTemplate.is_active == True,
        ).first()

        if tmpl:
            return tmpl.message_body
        return DEFAULT_TEMPLATES.get(template_type, "")

    async def send_confirmation(self, reservation) -> bool:
        """Send booking confirmation WhatsApp message."""
        restaurant: Restaurant = reservation.restaurant
        if not restaurant or not restaurant.evolution_instance_id:
            logger.warning(f"No WhatsApp instance for restaurant {reservation.restaurant_id}")
            return False

        phone = reservation.contact_phone
        if not phone:
            return False

        template = self._get_template(reservation.restaurant_id, TemplateType.CONFIRMATION)
        message = template.format(
            client_name=reservation.display_name,
            restaurant_name=restaurant.name,
            date=reservation.reservation_date.strftime("%d/%m/%Y"),
            time=reservation.reservation_time.strftime("%H:%M"),
            party_size=reservation.party_size,
        )
        return await send_whatsapp_message(phone, message, restaurant.evolution_instance_id)

    async def send_reminder(self, reservation, hours_before: int = 1) -> bool:
        """
        Send a reminder WhatsApp message before the reservation.

        Args:
            reservation: Reservation instance.
            hours_before: How many hours before the reservation (1 or 24).
                          Used to personalise the message text.
        """
        restaurant: Restaurant = reservation.restaurant
        if not restaurant or not restaurant.evolution_instance_id:
            return False

        phone = reservation.contact_phone
        if not phone:
            return False

        template = self._get_template(reservation.restaurant_id, TemplateType.REMINDER)
        time_label = "1 hora" if hours_before == 1 else f"{hours_before} horas"
        message = template.format(
            client_name=reservation.display_name,
            restaurant_name=restaurant.name,
            date=reservation.reservation_date.strftime("%d/%m/%Y"),
            time=reservation.reservation_time.strftime("%H:%M"),
            party_size=reservation.party_size,
            hours_before=time_label,
        )
        sent = await send_whatsapp_message(phone, message, restaurant.evolution_instance_id)
        if sent and hours_before == 1:
            # Only mark reminder_sent on the 1h reminder (the closest one)
            reservation.reminder_sent = True
            self.db.commit()
        return sent

    async def send_cancellation(self, reservation) -> bool:
        """Send cancellation notification WhatsApp message."""
        restaurant: Restaurant = reservation.restaurant
        if not restaurant or not restaurant.evolution_instance_id:
            return False

        phone = reservation.contact_phone
        if not phone:
            return False

        template = self._get_template(reservation.restaurant_id, TemplateType.CANCELLATION)
        message = template.format(
            client_name=reservation.display_name,
            restaurant_name=restaurant.name,
            date=reservation.reservation_date.strftime("%d/%m/%Y"),
            time=reservation.reservation_time.strftime("%H:%M"),
            party_size=reservation.party_size,
        )
        return await send_whatsapp_message(phone, message, restaurant.evolution_instance_id)

    async def send_feedback_request(self, reservation) -> bool:
        """
        Send a post-visit feedback request via WhatsApp (~2h after reservation).
        Uses the FEEDBACK template if configured, otherwise a built-in default.
        """
        restaurant: Restaurant = reservation.restaurant
        if not restaurant or not restaurant.evolution_instance_id:
            return False

        phone = reservation.contact_phone
        if not phone:
            return False

        # Try a custom FEEDBACK template; fall back to a sensible default
        template = self._get_template(reservation.restaurant_id, TemplateType.FEEDBACK)
        if not template:
            template = (
                "Olá, {client_name}! 😊 Esperamos que tenha curtido sua visita ao {restaurant_name} "
                "em {date}. Sua opinião é muito importante para nós — como foi a experiência?"
            )

        message = template.format(
            client_name=reservation.display_name,
            restaurant_name=restaurant.name,
            date=reservation.reservation_date.strftime("%d/%m/%Y"),
            time=reservation.reservation_time.strftime("%H:%M"),
            party_size=reservation.party_size,
        )
        return await send_whatsapp_message(phone, message, restaurant.evolution_instance_id)
