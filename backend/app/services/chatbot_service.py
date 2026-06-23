"""Groq AI chatbot service with automatic model fallback."""
import json
import logging
import re
from typing import Optional
from sqlalchemy.orm import Session
from groq import Groq, APIError, APIConnectionError, RateLimitError

from app.config import settings
from app.models.chat_conversation import ChatConversation
from app.models.chatbot_setting import ChatbotSetting
from app.models.restaurant import Restaurant
from app.models.client import Client
from app.utils.constants import GROQ_FALLBACK_MODELS, ConversationStatus

logger = logging.getLogger(__name__)

groq_client = Groq(api_key=settings.GROQ_API_KEY)

RESERVATION_SYSTEM_SUFFIX = """

COLETA DE DADOS PARA RESERVA:
Quando o cliente quiser fazer uma reserva, você DEVE coletar obrigatoriamente:
1. Nome completo
2. Número de WhatsApp (com DDD)
3. Data da reserva (formato YYYY-MM-DD)
4. Horário (formato HH:MM)
5. Número de pessoas

Se algum dado ainda estiver faltando, pergunte de forma natural e amigável.

Quando TODOS os dados obrigatórios estiverem coletados, responda EXATAMENTE neste formato JSON
(nada antes, nada depois — só o JSON):

{"reply": "Sua mensagem amigável de confirmação aqui", "reservation_draft": {"guest_name": "Nome", "guest_phone": "11999999999", "reservation_date": "2024-06-25", "reservation_time": "19:00", "party_size": 4, "guest_email": null, "special_requests": null}, "is_ready_to_confirm": true}

Para telefone: remova todos os caracteres não numéricos, mantenha DDD + número (10 ou 11 dígitos).
Para data: converta para YYYY-MM-DD.
Para horário: converta para HH:MM (24h).

Enquanto ainda estiver coletando dados, responda normalmente em texto (sem JSON).
"""


class ChatbotService:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_conversation(self, restaurant_id, client_phone: str) -> ChatConversation:
        """Retrieve active conversation or start a new one."""
        conv = self.db.query(ChatConversation).filter(
            ChatConversation.restaurant_id == restaurant_id,
            ChatConversation.client_phone == client_phone,
            ChatConversation.status == ConversationStatus.ACTIVE,
        ).order_by(ChatConversation.created_at.desc()).first()

        if not conv:
            client = self.db.query(Client).filter(
                Client.phone == client_phone,
                Client.restaurant_id == restaurant_id,
            ).first()

            conv = ChatConversation(
                restaurant_id=restaurant_id,
                client_id=client.id if client else None,
                client_phone=client_phone,
                messages=[],
                status=ConversationStatus.ACTIVE,
            )
            self.db.add(conv)
            self.db.flush()

        return conv

    def _build_system_prompt(self, restaurant: Restaurant, setting: Optional[ChatbotSetting]) -> str:
        """Build the system prompt with reservation data collection instructions."""
        if setting and setting.system_prompt:
            base = setting.system_prompt.replace("{restaurant_name}", restaurant.name)
        else:
            base = (
                f"Você é um assistente virtual de reservas do restaurante {restaurant.name}. "
                "Ajude os clientes a fazer reservas, verificar horários e promoções. "
                "Responda sempre em português, de forma cordial e objetiva."
            )
        return base + RESERVATION_SYSTEM_SUFFIX

    def _call_groq(self, messages: list[dict], temperature: float) -> str:
        """Attempt Groq completion with automatic fallback across models."""
        last_error: Optional[Exception] = None

        for model in GROQ_FALLBACK_MODELS:
            try:
                response = groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=settings.GROQ_MAX_TOKENS,
                    temperature=temperature,
                )
                return response.choices[0].message.content
            except RateLimitError:
                logger.warning(f"Rate limit on {model}, trying next model")
                last_error = RateLimitError
                continue
            except (APIError, APIConnectionError) as exc:
                logger.error(f"Groq error on {model}: {exc}")
                last_error = exc
                continue

        raise RuntimeError(f"All Groq models failed. Last error: {last_error}")

    def _parse_groq_response(self, raw: str) -> dict:
        """
        Try to extract JSON from the AI reply.
        Returns dict with keys: reply, reservation_draft, is_ready_to_confirm
        """
        # Try to find JSON block in the response
        json_match = re.search(r'\{.*"is_ready_to_confirm".*?\}', raw, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return {
                    "reply": parsed.get("reply", raw),
                    "reservation_draft": parsed.get("reservation_draft"),
                    "is_ready_to_confirm": bool(parsed.get("is_ready_to_confirm", False)),
                }
            except json.JSONDecodeError:
                pass

        # No JSON found — plain text response, still collecting data
        return {
            "reply": raw,
            "reservation_draft": None,
            "is_ready_to_confirm": False,
        }

    async def process_message(self, restaurant_id, client_phone: str, user_message: str) -> dict:
        """
        Process an incoming chat message and return the AI reply.
        Returns dict with: reply, conversation_id, reservation_draft, is_ready_to_confirm
        """
        restaurant = self.db.query(Restaurant).filter(
            Restaurant.id == restaurant_id, Restaurant.is_active == True
        ).first()
        if not restaurant:
            return {
                "reply": "Restaurante não encontrado.",
                "conversation_id": None,
                "reservation_draft": None,
                "is_ready_to_confirm": False,
            }

        setting = self.db.query(ChatbotSetting).filter(
            ChatbotSetting.restaurant_id == restaurant_id,
            ChatbotSetting.is_active == True,
        ).first()

        conv = self._get_or_create_conversation(restaurant_id, client_phone)
        conv.add_message("user", user_message)

        system_prompt = self._build_system_prompt(restaurant, setting)
        temperature = setting.temperature if setting else settings.GROQ_DEFAULT_TEMPERATURE

        history = conv.last_n_messages(10)
        groq_messages = [{"role": "system", "content": system_prompt}]
        groq_messages += [{"role": m["role"], "content": m["content"]} for m in history]

        try:
            raw_reply = self._call_groq(groq_messages, temperature)
        except RuntimeError as exc:
            logger.error(f"Chatbot error: {exc}")
            raw_reply = "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes."

        parsed = self._parse_groq_response(raw_reply)

        conv.add_message("assistant", parsed["reply"])
        self.db.commit()
        self.db.refresh(conv)

        return {
            "reply": parsed["reply"],
            "conversation_id": str(conv.id),
            "reservation_draft": parsed["reservation_draft"],
            "is_ready_to_confirm": parsed["is_ready_to_confirm"],
        }
