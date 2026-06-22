"""Super-admin routes: manage all restaurants and view analytics."""
import logging
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.utils.security import require_role
from app.utils.constants import UserRole, ReservationStatus, DEFAULT_PAGE_SIZE
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.reservation import Reservation
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.utils.security import hash_password

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Admin"], dependencies=[Depends(require_role(UserRole.SUPER_ADMIN))])


class StatusUpdate(BaseModel):
    status: str


@router.get("/restaurants", response_model=dict)
def list_restaurants(
    page: int = Query(1, ge=1),
    size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all restaurants with pagination and optional name search."""
    query = db.query(Restaurant)
    if search:
        query = query.filter(Restaurant.name.ilike(f"%{search}%"))

    total = query.count()
    items = query.order_by(Restaurant.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "items": [r.to_dict() for r in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/restaurants", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    data: RestaurantCreate,
    owner_email: str = Query(..., description="Email of the restaurant owner"),
    db: Session = Depends(get_db),
):
    """Create a new restaurant and assign an owner."""
    if db.query(Restaurant).filter(Restaurant.slug == data.slug).first():
        raise HTTPException(status_code=409, detail="Slug already in use")

    owner = db.query(User).filter(User.email == owner_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner user not found")

    restaurant = Restaurant(**data.model_dump(), owner_id=owner.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    logger.info(f"Restaurant created: {restaurant.name}")
    return restaurant.to_dict()


@router.get("/restaurants/{restaurant_id}", response_model=dict)
def get_restaurant(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Get a single restaurant by ID."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r.to_dict()


@router.put("/restaurants/{restaurant_id}", response_model=dict)
def update_restaurant(restaurant_id: UUID, data: RestaurantUpdate, db: Session = Depends(get_db)):
    """Update restaurant details."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(r, field, value)

    db.commit()
    db.refresh(r)
    return r.to_dict()


@router.patch("/restaurants/{restaurant_id}/status", response_model=dict)
def update_restaurant_status(
    restaurant_id: UUID,
    data: StatusUpdate,
    db: Session = Depends(get_db),
):
    """Toggle restaurant active status."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    r.is_active = data.status == "active"
    db.commit()
    db.refresh(r)
    logger.info(f"Restaurant {restaurant_id} status updated to: {data.status}")
    return r.to_dict()


@router.delete("/restaurants/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Delete a restaurant and its associated owner user."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    owner_id = r.owner_id
    
    # Delete the restaurant
    db.delete(r)
    db.commit()

    # Delete the associated owner user
    if owner_id:
        owner = db.query(User).filter(User.id == owner_id).first()
        if owner:
            db.delete(owner)
            db.commit()

    logger.info(f"Restaurant {restaurant_id} and its owner deleted")


@router.get("/restaurants/{restaurant_id}/analytics", response_model=dict)
def get_analytics(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Aggregate analytics for a restaurant."""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    total = db.query(Reservation).filter(Reservation.restaurant_id == restaurant_id).count()
    confirmed = db.query(Reservation).filter(
        Reservation.restaurant_id == restaurant_id,
        Reservation.status == ReservationStatus.CONFIRMED,
    ).count()
    cancelled = db.query(Reservation).filter(
        Reservation.restaurant_id == restaurant_id,
        Reservation.status == ReservationStatus.CANCELLED,
    ).count()

    avg_party = db.query(func.avg(Reservation.party_size)).filter(
        Reservation.restaurant_id == restaurant_id
    ).scalar() or 0

    return {
        "total_reservations": total,
        "confirmed_reservations": confirmed,
        "cancelled_reservations": cancelled,
        "cancellation_rate": round(cancelled / max(total, 1) * 100, 1),
        "avg_party_size": round(float(avg_party), 1),
    }


@router.get("/analytics", response_model=dict)
def get_global_analytics(db: Session = Depends(get_db)):
    """Global analytics summary for super_admin dashboard."""
    from app.models.reservation import Reservation

    total_restaurants = db.query(Restaurant).count()
    active_restaurants = db.query(Restaurant).filter(Restaurant.is_active == True).count()
    total_reservations = db.query(Reservation).count()

    from datetime import date, timedelta
    from sqlalchemy import cast, Date as SADate
    thirty_days_ago = date.today() - timedelta(days=30)
    by_day_rows = (
        db.query(
            cast(Reservation.created_at, SADate).label("day"),
            func.count(Reservation.id).label("count"),
        )
        .filter(Reservation.created_at >= thirty_days_ago)
        .group_by(cast(Reservation.created_at, SADate))
        .order_by(cast(Reservation.created_at, SADate))
        .all()
    )

    return {
        "total_restaurants": total_restaurants,
        "active_restaurants": active_restaurants,
        "total_reservations": total_reservations,
        "revenue_estimate": 0,
        "reservations_by_day": [{"date": str(r.day), "count": r.count} for r in by_day_rows],
    }
