"""Authentication routes: register, login, refresh, me."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.utils.db import get_db
from app.utils.security import get_current_user
from app.schemas.user import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    service = AuthService(db)
    user = service.register(data)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    service = AuthService(db)
    return service.login(data.email, data.password)


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/refresh", response_model=dict)
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new access token from a valid refresh token."""
    service = AuthService(db)
    return service.refresh(data.refresh_token)
