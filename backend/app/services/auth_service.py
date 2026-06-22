"""Authentication business logic."""
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserRegister
from app.utils.security import hash_password, create_access_token, create_refresh_token, decode_token
from app.utils.constants import UserRole

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, data: UserRegister) -> User:
        """Create a new user account."""
        existing = self.db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        # Only super_admin can self-register as super_admin — enforce via operator seeding instead
        if data.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot self-register as super_admin",
            )

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=data.role,
            restaurant_id=data.restaurant_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"New user registered: {user.email} ({user.role})")
        return user

    def login(self, email: str, password: str) -> dict:
        """Validate credentials and return JWT tokens."""
        user = self.db.query(User).filter(User.email == email, User.is_active == True).first()
        if not user or not user.check_password(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        payload = {
            "sub": str(user.id),
            "role": user.role,
            "restaurant_id": str(user.restaurant_id) if user.restaurant_id else None,
        }
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)
        logger.info(f"User logged in: {user.email}")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    def refresh(self, refresh_token: str) -> dict:
        """Issue a new access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        user_id = payload.get("sub")
        user = self.db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        new_payload = {
            "sub": str(user.id),
            "role": user.role,
            "restaurant_id": str(user.restaurant_id) if user.restaurant_id else None,
        }
        return {"access_token": create_access_token(new_payload), "token_type": "bearer"}
