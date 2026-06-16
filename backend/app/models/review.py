from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(String, primary_key=True, index=True)
    booking_id = Column(String, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    master_id = Column(String, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, index=True)
    business_id = Column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(String, nullable=True)
    reply_comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    booking = relationship("Booking")
    master = relationship("Master")
    business = relationship("Business")
