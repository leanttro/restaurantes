"""
Reserva de Restaurantes API — FastAPI entry point.

Docs available at /docs (Swagger) and /redoc (ReDoc).
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth, admin, restaurants, reservations, chatbot, whatsapp

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
# Public restaurants listing (used by frontend)
# ──────────────────────────────────────────────
from fastapi import Query as _Query
from app.utils.db import get_db as _get_db
from app.models.restaurant import Restaurant as _Restaurant
from sqlalchemy.orm import Session as _Session

@app.get("/api/restaurants", tags=["Public"])
def list_restaurants_public(
    limit: int = _Query(50, ge=1, le=100),
    db: _Session = Depends(_get_db),
):
    items = db.query(_Restaurant).filter(_Restaurant.is_active == True).limit(limit).all()
    return {"items": [r.to_dict() for r in items], "total": len(items)}

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
