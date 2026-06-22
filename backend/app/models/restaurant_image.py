"""RestaurantImage model — photos uploaded to Cloudinary/S3."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.utils.db import Base


class RestaurantImage(Base):
    __tablename__ = "restaurant_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="images")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "image_url": self.image_url,
            "alt_text": self.alt_text,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<RestaurantImage {self.image_url[:40]}>"
