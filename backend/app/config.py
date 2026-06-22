"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Reserva de Restaurantes API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://user:pass@postgres:5432/reserva"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL: str = "https://your-evolution-api.com"
    EVOLUTION_API_TOKEN: str = ""

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_DEFAULT_TEMPERATURE: float = 0.7
    GROQ_MAX_TOKENS: int = 1024

    # Celery
    CELERY_BROKER_URL: str = "sqla+postgresql://user:pass@postgres:5432/reserva"
    CELERY_RESULT_BACKEND: str = "db+postgresql://user:pass@postgres:5432/reserva"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
