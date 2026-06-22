"""
Reserva de Restaurantes API — FastAPI entry point.

Docs available at /docs (Swagger) and /redoc (ReDoc).
"""
import logging
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.routes import auth, admin, restaurants, reservations, chatbot, whatsapp
from app.utils.db import get_db
from app.utils.security import require_role, get_current_user
from app.utils.constants import UserRole
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantCreate

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API para plataforma SaaS de reservas de restaurantes com chatbot WhatsApp.\n\n"
        "**Roles:** `super_admin` → gerencia tudo | `restaurant_admin` → gerencia seu restaurante | `client` → faz reservas.\n\n"
        "Autenticação via **Bearer JWT**."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(restaurants.router, prefix="/api/restaurant")
app.include_router(reservations.router, prefix="/api/reservations")
app.include_router(chatbot.router, prefix="/api/chatbot")
app.include_router(whatsapp.router, prefix="/api/whatsapp")


# ──────────────────────────────────────────────
# Public restaurants listing (usado pelo frontend)
# ──────────────────────────────────────────────
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
        query = query.filter(Restaurant.status == status)
    else:
        query = query.filter(Restaurant.is_active == True)
    items = query.limit(limit).all()
    return {"items": [r.to_dict() for r in items], "total": len(items)}


@app.post("/api/restaurants", tags=["Public"], status_code=201)
def create_restaurant_public(
    data: RestaurantCreate,
    owner_email: str = Query(..., description="Email do dono do restaurante"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.SUPER_ADMIN)),
):
    """Cria um novo restaurante. Apenas super_admin."""
    if db.query(Restaurant).filter(Restaurant.slug == data.slug).first():
        raise HTTPException(status_code=409, detail="Slug já está em uso")

    owner = db.query(User).filter(User.email == owner_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Usuário dono não encontrado")

    restaurant = Restaurant(**data.model_dump(), owner_id=owner.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    logger.info(f"Restaurante criado: {restaurant.name}")
    return restaurant.to_dict()


@app.patch("/api/restaurants/{restaurant_id}/status", tags=["Public"])
def set_restaurant_status(
    restaurant_id,
    status: str = Query(..., description="active ou inactive"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.SUPER_ADMIN)),
):
    """Ativa ou desativa um restaurante. Apenas super_admin."""
    from uuid import UUID
    r = db.query(Restaurant).filter(Restaurant.id == UUID(str(restaurant_id))).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    r.status = status
    r.is_active = (status == "active")
    db.commit()
    db.refresh(r)
    return r.to_dict()


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────
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


# ──────────────────────────────────────────────
# Dev server
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
