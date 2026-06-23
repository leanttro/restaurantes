"""Pydantic schemas for Restaurant endpoints."""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class RestaurantCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    whatsapp_number: Optional[str] = None
    cover_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    max_party_size: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evolution_instance_id: Optional[str] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    whatsapp_number: Optional[str] = None
    cover_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    max_party_size: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evolution_instance_id: Optional[str] = None
    is_active: Optional[bool] = None


class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    cuisine_type: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    city: Optional[str]
    whatsapp_number: Optional[str]
    cover_image_url: Optional[str]
    logo_url: Optional[str]
    max_party_size: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    evolution_instance_id: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AvailableHourCreate(BaseModel):
    day_of_week: int   # 0=Segunda … 6=Domingo
    start_time: str    # "HH:MM"
    end_time: str      # "HH:MM"
    interval_minutes: int = 30
    max_capacity: int
    is_active: bool = True


class AvailableHourResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    day_of_week: int
    start_time: str
    end_time: str
    interval_minutes: int
    max_capacity: int
    is_active: bool

    model_config = {"from_attributes": True}


class PromotionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    valid_from: datetime
    valid_until: datetime
    conditions: Optional[dict] = {}
    is_active: bool = True


class PromotionResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    title: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    valid_from: datetime
    valid_until: datetime
    conditions: dict
    is_active: bool

    model_config = {"from_attributes": True}


class ChatbotSettingUpdate(BaseModel):
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    greeting_message: Optional[str] = None
    is_active: Optional[bool] = None


class ChatbotSettingResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    temperature: float
    system_prompt: str
    greeting_message: str
    is_active: bool

    model_config = {"from_attributes": True}


class WhatsappTemplateUpdate(BaseModel):
    message_body: Optional[str] = None
    is_active: Optional[bool] = None


class WhatsappTemplateResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    template_type: str
    message_body: str
    is_active: bool

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    date: str
    total_reservations: int
    confirmed: int
    pending: int
    cancelled: int
    total_guests: int
    occupancy_rate: float


class AnalyticsResponse(BaseModel):
    total_reservations: int
    confirmed_reservations: int
    cancellation_rate: float
    avg_party_size: float
    top_days: list[dict]
    top_times: list[dict]
