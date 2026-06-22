"""Groq AI chatbot service with automatic model fallback."""
import logging
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
            # Try to link a known client
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
        """Build the system prompt, substituting restaurant name."""
        if setting and setting.system_prompt:
            return setting.system_prompt.replace("{restaurant_name}", restaurant.name)
        return (
            f"Você é um assistente virtual de reservas do restaurante {restaurant.name}. "
            "Ajude os clientes a fazer reservas, verificar horários e promoções. "
            "Responda sempre em português, de forma cordial e objetiva."
        )

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

    async def process_message(self, restaurant_id, client_phone: str, user_message: str) -> dict:
        """
        Process an incoming chat message and return the AI reply.

        Returns a dict with 'reply' and 'conversation_id'.
        """
        restaurant = self.db.query(Restaurant).filter(
            Restaurant.id == restaurant_id, Restaurant.is_active == True
        ).first()
        if not restaurant:
            return {"reply": "Restaurante não encontrado.", "conversation_id": None}

        setting = self.db.query(ChatbotSetting).filter(
            ChatbotSetting.restaurant_id == restaurant_id,
            ChatbotSetting.is_active == True,
        ).first()

        conv = self._get_or_create_conversation(restaurant_id, client_phone)
        conv.add_message("user", user_message)

        # Build Groq message list
        system_prompt = self._build_system_prompt(restaurant, setting)
        temperature = setting.temperature if setting else settings.GROQ_DEFAULT_TEMPERATURE

        history = conv.last_n_messages(10)  # last 10 messages for context
        groq_messages = [{"role": "system", "content": system_prompt}]
        groq_messages += [{"role": m["role"], "content": m["content"]} for m in history]

        try:
            reply = self._call_groq(groq_messages, temperature)
        except RuntimeError as exc:
            logger.error(f"Chatbot error: {exc}")
            reply = "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes."

        conv.add_message("assistant", reply)
        self.db.commit()
        self.db.refresh(conv)

        return {"reply": reply, "conversation_id": str(conv.id)}
