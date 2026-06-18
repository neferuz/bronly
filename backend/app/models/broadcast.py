from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class BroadcastHistory(Base):
    __tablename__ = "broadcast_history"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    audience = Column(String, nullable=False)
    message_text = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    sent_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="broadcasts")
