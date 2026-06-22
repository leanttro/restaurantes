"""Pydantic schemas for Reservation endpoints."""
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr


class AvailabilityCheck(BaseModel):
    restaurant_id: UUID
    date: date
    time: str        # "HH:MM"
    party_size: int


class AvailableSlot(BaseModel):
    time: str
    available_capacity: int
    is_available: bool


class AvailabilityResponse(BaseModel):
    date: str
    available_slots: list[AvailableSlot]
    active_promotions: list[dict]


class ReservationCreate(BaseModel):
    restaurant_id: UUID
    reservation_date: date
    reservation_time: str   # "HH:MM"
    party_size: int
    occasion: Optional[str] = None
    special_requests: Optional[str] = None

    # Guest info (required if not authenticated)
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_email: Optional[EmailStr] = None


class ReservationResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    client_id: Optional[UUID]
    guest_name: Optional[str]
    guest_phone: Optional[str]
    guest_email: Optional[str]
    reservation_date: date
    reservation_time: str
    party_size: int
    occasion: Optional[str]
    special_requests: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservationStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


class ReservationListResponse(BaseModel):
    items: list[ReservationResponse]
    total: int
    page: int
    size: int
