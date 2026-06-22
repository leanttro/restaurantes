"""ScheduledJob model — tracks Celery reminder/automation jobs per reservation."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base
from app.utils.constants import JobType, JobStatus


class ScheduledJob(Base):
    __tablename__ = "scheduled_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reservations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_type = Column(
        Enum(*JobType.ALL, name="job_type_enum"),
        nullable=False,
    )
    scheduled_for = Column(DateTime, nullable=False, index=True)
    executed_at = Column(DateTime, nullable=True)
    status = Column(
        Enum(*JobStatus.ALL, name="job_status_enum"),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    reservation = relationship("Reservation", back_populates="scheduled_jobs")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "reservation_id": str(self.reservation_id),
            "job_type": self.job_type,
            "scheduled_for": self.scheduled_for.isoformat(),
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<ScheduledJob {self.job_type} {self.status} @ {self.scheduled_for}>"
