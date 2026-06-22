"""
Reserva de Restaurantes API — FastAPI entry point.
"""
import logging
from fastapi import FastAPI, Depends, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.routes import auth, admin, restaurants, reservations, chatbot, whatsapp
from app.utils.db import get_db
from app.utils.security import require_role, get_current_user
from app.utils.constants import UserRole
from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/auth")
app.include_router(admin.router,        prefix="/api/admin")
app.include_router(reservations.router, prefix="/api/reservations")
app.include_router(restaurants.router,  prefix="/api/restaurants")
app.include_router(whatsapp.router,     prefix="/api/restaurants")

# CORRIGIDO: chatbot montado com {restaurant_id} no prefixo
# Isso garante que /chatbot/settings NÃO conflita com /{restaurant_id} inline
app.include_router(
    chatbot.router,
    prefix="/api/restaurants/{restaurant_id}",
)

# ── Rotas inline — DEPOIS dos routers ─────────────────────

@app.get("/api/restaurants", tags=["Public"])
def list_restaurants_public(
    limit: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)
    if search:
        query = query.filter(Restaurant.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Restaurant.is_active == (status == "active"))
    else:
        query = query.filter(Restaurant.is_active == True)
    items = query.limit(limit).all()
    return {"items": [r.to_dict() for r in items], "total": len(items)}


@app.get("/api/restaurants/{restaurant_id}/analytics", tags=["Restaurants"])
def get_restaurant_analytics(
    restaurant_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from uuid import UUID
    from app.models.reservation import Reservation

    try:
        uid = UUID(restaurant_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="restaurant_id inválido")

    r = db.query(Restaurant).filter(Restaurant.id == uid).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    is_super = current_user.role == UserRole.SUPER_ADMIN
    is_owner = str(r.owner_id) == str(current_user.id)
    if not (is_super or is_owner):
        raise HTTPException(status_code=403, detail="Acesso negado")

    from app.models.reservation import Reservation
    total = db.query(Reservation).filter(Reservation.restaurant_id == r.id).count()
    confirmed = db.query(Reservation).filter(
        Reservation.restaurant_id == r.id,
        Reservation.status == "confirmed",
    ).count()
    return {
        "restaurant_id": str(r.id),
        "total_reservations": total,
        "confirmed_reservations": confirmed,
    }


@app.post("/api/restaurants", tags=["Public"], status_code=201)
def create_restaurant_public(
    data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.SUPER_ADMIN)),
):
    if db.query(Restaurant).filter(Restaurant.slug == data.slug).first():
        raise HTTPException(status_code=409, detail="Slug já está em uso")
    restaurant = Restaurant(**data.model_dump(), owner_id=current_user.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant.to_dict()


class StatusUpdate(BaseModel):
    status: str


@app.patch("/api/restaurants/{restaurant_id}/status", tags=["Public"])
def set_restaurant_status(
    restaurant_id: str,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.SUPER_ADMIN)),
):
    from uuid import UUID
    r = db.query(Restaurant).filter(Restaurant.id == UUID(restaurant_id)).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    r.is_active = (data.status == "active")
    db.commit()
    db.refresh(r)
    return r.to_dict()


# Rota genérica por slug/UUID — ÚLTIMA, para não engolir sub-paths
@app.get("/api/restaurants/{restaurant_id}", tags=["Public"])
def get_restaurant_public(restaurant_id: str, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.slug == restaurant_id).first()
    if not r:
        try:
            from uuid import UUID
            r = db.query(Restaurant).filter(Restaurant.id == UUID(restaurant_id)).first()
        except ValueError:
            pass
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return r.to_dict()


# ── Health ─────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}", "status": "ok"}


@app.get("/health", tags=["Health"])
def health():
    from app.utils.db import engine
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {"api": "ok", "database": "ok" if db_ok else "error"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
