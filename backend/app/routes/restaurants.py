"""Restaurant-admin routes: dashboard, hours, promotions, chatbot, templates."""
import logging
from uuid import UUID
from datetime import date, time as dtime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.utils.security import get_current_user, require_role
from app.utils.constants import UserRole, ReservationStatus
from app.models.restaurant import Restaurant
from app.models.available_hour import AvailableHour
from app.models.promotion import Promotion
from app.models.chatbot_setting import ChatbotSetting
from app.models.whatsapp_template import WhatsappTemplate, DEFAULT_TEMPLATES
from app.schemas.restaurant import (
    AvailableHourCreate, AvailableHourResponse,
    PromotionCreate, PromotionResponse,
    ChatbotSettingUpdate, ChatbotSettingResponse,
    WhatsappTemplateUpdate, WhatsappTemplateResponse,
)
from app.services.reservation_service import ReservationService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Restaurant"])


def _check_restaurant_access(restaurant_id: UUID, current_user) -> Restaurant:
    """Ensure the current user owns / manages the restaurant, or is super_admin."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return  # super_admin can access any
    if current_user.role == UserRole.RESTAURANT_ADMIN and str(current_user.restaurant_id) == str(restaurant_id):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this restaurant")


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/dashboard")
def dashboard(
    restaurant_id: UUID,
    target_date: date = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    svc = ReservationService(db)
    return svc.get_dashboard(restaurant_id, target_date or date.today())


# ──────────────────────────────────────────────
# Available Hours
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/hours", response_model=list[dict])
def list_hours(
    restaurant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    hours = db.query(AvailableHour).filter(AvailableHour.restaurant_id == restaurant_id).all()
    return [h.to_dict() for h in hours]


@router.post("/{restaurant_id}/hours", status_code=status.HTTP_201_CREATED)
def create_hour(
    restaurant_id: UUID,
    data: AvailableHourCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)

    start = dtime(*map(int, data.start_time.split(":")))
    end = dtime(*map(int, data.end_time.split(":")))

    hour = AvailableHour(
        restaurant_id=restaurant_id,
        day_of_week=data.day_of_week,
        start_time=start,
        end_time=end,
        interval_minutes=data.interval_minutes,
        max_capacity=data.max_capacity,
        is_active=data.is_active,
    )
    db.add(hour)
    db.commit()
    db.refresh(hour)
    return hour.to_dict()


@router.delete("/{restaurant_id}/hours/{hour_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hour(
    restaurant_id: UUID,
    hour_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    hour = db.query(AvailableHour).filter(
        AvailableHour.id == hour_id, AvailableHour.restaurant_id == restaurant_id
    ).first()
    if not hour:
        raise HTTPException(status_code=404, detail="Hour not found")
    db.delete(hour)
    db.commit()


# ──────────────────────────────────────────────
# Promotions
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/promotions", response_model=list[dict])
def list_promotions(
    restaurant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    promos = db.query(Promotion).filter(Promotion.restaurant_id == restaurant_id).all()
    return [p.to_dict() for p in promos]


@router.post("/{restaurant_id}/promotions", status_code=status.HTTP_201_CREATED)
def create_promotion(
    restaurant_id: UUID,
    data: PromotionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    promo = Promotion(**data.model_dump(), restaurant_id=restaurant_id)
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo.to_dict()


# ──────────────────────────────────────────────
# Reservations
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/reservations")
def list_reservations(
    restaurant_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    date_filter: Optional[date] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    svc = ReservationService(db)
    result = svc.list_for_restaurant(restaurant_id, page, size, date_filter, status_filter)
    result["items"] = [r.to_dict() for r in result["items"]]
    return result


@router.put("/{restaurant_id}/reservations/{reservation_id}/status")
def update_reservation_status(
    restaurant_id: UUID,
    reservation_id: UUID,
    new_status: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    svc = ReservationService(db)
    r = svc.update_status(reservation_id, new_status, restaurant_id)
    return r.to_dict()


# ──────────────────────────────────────────────
# Chatbot Settings
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/chatbot/settings")
def get_chatbot_settings(
    restaurant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    setting = db.query(ChatbotSetting).filter(ChatbotSetting.restaurant_id == restaurant_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Chatbot settings not found")
    return setting.to_dict()


@router.put("/{restaurant_id}/chatbot/settings")
def update_chatbot_settings(
    restaurant_id: UUID,
    data: ChatbotSettingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    setting = db.query(ChatbotSetting).filter(ChatbotSetting.restaurant_id == restaurant_id).first()
    if not setting:
        setting = ChatbotSetting(restaurant_id=restaurant_id)
        db.add(setting)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(setting, field, value)

    db.commit()
    db.refresh(setting)
    return setting.to_dict()


# ──────────────────────────────────────────────
# WhatsApp Templates
# ──────────────────────────────────────────────

@router.get("/{restaurant_id}/whatsapp/templates", response_model=list[dict])
def list_templates(
    restaurant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    templates = db.query(WhatsappTemplate).filter(
        WhatsappTemplate.restaurant_id == restaurant_id
    ).all()
    return [t.to_dict() for t in templates]


@router.put("/{restaurant_id}/whatsapp/templates/{template_id}")
def update_template(
    restaurant_id: UUID,
    template_id: UUID,
    data: WhatsappTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_restaurant_access(restaurant_id, current_user)
    tmpl = db.query(WhatsappTemplate).filter(
        WhatsappTemplate.id == template_id,
        WhatsappTemplate.restaurant_id == restaurant_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tmpl, field, value)

    db.commit()
    db.refresh(tmpl)
    return tmpl.to_dict()
