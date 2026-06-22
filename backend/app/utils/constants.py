"""Application-wide constants."""

# User roles
class UserRole:
    SUPER_ADMIN = "super_admin"
    RESTAURANT_ADMIN = "restaurant_admin"
    CLIENT = "client"

    ALL = [SUPER_ADMIN, RESTAURANT_ADMIN, CLIENT]


# Reservation statuses
class ReservationStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

    ALL = [PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW]


# Discount types for promotions
class DiscountType:
    PERCENTAGE = "percentage"
    FIXED = "fixed"


# WhatsApp template types
class TemplateType:
    CONFIRMATION = "confirmation"
    REMINDER = "reminder"
    CANCELLATION = "cancellation"
    FEEDBACK = "feedback"


# Conversation statuses
class ConversationStatus:
    ACTIVE = "active"
    COMPLETED = "completed"


# Days of week (0 = Monday, 6 = Sunday)
DAY_NAMES = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
}

# Default Groq fallback models (ordered by preference)
GROQ_FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
]

# Scheduled job types
class JobType:
    REMINDER_1H = "reminder_1h"
    REMINDER_24H = "reminder_24h"
    POST_VISIT_FEEDBACK = "post_visit_feedback"

    ALL = [REMINDER_1H, REMINDER_24H, POST_VISIT_FEEDBACK]


# Scheduled job statuses
class JobStatus:
    PENDING = "pending"
    EXECUTED = "executed"
    FAILED = "failed"

    ALL = [PENDING, EXECUTED, FAILED]


# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
