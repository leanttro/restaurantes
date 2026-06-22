"""Public and authenticated reservation routes."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.utils.security import get_current_user
from app.schemas.reservation import AvailabilityCheck, ReservationCreate, ReservationStatusUpdate
from app.services.reservation_service import ReservationService
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(tags=["Reservations"])


@router.get("")
def list_reservations(
    restaurant_id: UUID = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all reservations for a restaurant."""
    from app.models.reservation import Reservation
    
    query = db.query(Reservation).filter(Reservation.restaurant_id == restaurant_id)
    total = query.count()
    items = query.order_by(Reservation.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "items": [r.to_dict() for r in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("/check-availability")
def check_availability(data: AvailabilityCheck, db: Session = Depends(get_db)):
    """Return available time slots and active promotions for a given date and party size."""
    svc = ReservationService(db)
    return svc.check_availability(data)


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_reservation(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    # Optional auth — guest checkout works without token
    current_user=Depends(get_current_user) if False else None,  # see note below
):
    """
    Create a new reservation. Works for both authenticated users and guests.
    Guest bookings require guest_name and guest_phone in the payload.
    """
    svc = ReservationService(db)
    reservation = svc.create(data, current_user=None)

    # Send WhatsApp confirmation
    wapp = WhatsAppService(db)
    # Reload relationships before sending
    db.refresh(reservation)
    await wapp.send_confirmation(reservation)

    return reservation.to_dict()


@router.post("/create/auth", status_code=status.HTTP_201_CREATED)
async def create_reservation_authenticated(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create reservation as an authenticated user (pre-fills client data)."""
    svc = ReservationService(db)
    reservation = svc.create(data, current_user=current_user)
    db.refresh(reservation)

    wapp = WhatsAppService(db)
    await wapp.send_confirmation(reservation)

    return reservation.to_dict()


@router.get("/{reservation_id}")
def get_reservation(reservation_id: UUID, db: Session = Depends(get_db)):
    """Get reservation details by ID."""
    svc = ReservationService(db)
    return svc.get_by_id(reservation_id).to_dict()


@router.put("/{reservation_id}/confirm")
def confirm_reservation(reservation_id: UUID, db: Session = Depends(get_db)):
    """Client confirms a pending reservation (via link in WhatsApp message)."""
    svc = ReservationService(db)
    from app.utils.constants import ReservationStatus
    r = svc.update_status(reservation_id, ReservationStatus.CONFIRMED)
    return r.to_dict()


@router.put("/{reservation_id}/cancel")
async def cancel_reservation(
    reservation_id: UUID,
    db: Session = Depends(get_db),
):
    """Cancel a reservation and send WhatsApp notification."""
    from app.utils.constants import ReservationStatus
    svc = ReservationService(db)
    reservation = svc.update_status(reservation_id, ReservationStatus.CANCELLED)

    db.refresh(reservation)
    wapp = WhatsAppService(db)
    await wapp.send_cancellation(reservation)

    return reservation.to_dict()
