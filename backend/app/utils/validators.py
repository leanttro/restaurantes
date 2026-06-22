"""Custom Pydantic validators and helper functions."""
import re
from typing import Optional


def normalize_phone(phone: str) -> str:
    """Strip non-digit characters and ensure Brazilian country code."""
    digits = re.sub(r"\D", "", phone)
    if not digits.startswith("55"):
        digits = "55" + digits
    return digits


def validate_phone(phone: str) -> str:
    """Validate and normalize a Brazilian phone number."""
    normalized = normalize_phone(phone)
    if len(normalized) not in (12, 13):  # 55 + DDD + number (8 or 9 digits)
        raise ValueError("Invalid Brazilian phone number")
    return normalized


def validate_password_strength(password: str) -> str:
    """Enforce minimum password requirements."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    return password
