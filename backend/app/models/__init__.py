"""Import all models so Alembic autogenerate can discover them."""
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.restaurant_image import RestaurantImage
from app.models.client import Client
from app.models.reservation import Reservation
from app.models.available_hour import AvailableHour
from app.models.promotion import Promotion
from app.models.chatbot_setting import ChatbotSetting
from app.models.whatsapp_template import WhatsappTemplate
from app.models.chat_conversation import ChatConversation
from app.models.scheduled_job import ScheduledJob
from app.models.reservation_analytics import ReservationAnalytics

__all__ = [
    "User",
    "Restaurant",
    "RestaurantImage",
    "Client",
    "Reservation",
    "AvailableHour",
    "Promotion",
    "ChatbotSetting",
    "WhatsappTemplate",
    "ChatConversation",
    "ScheduledJob",
    "ReservationAnalytics",
]
