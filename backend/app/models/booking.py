from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(String, primary_key=True, index=True)
    business_id = Column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    master_id = Column(String, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    client_name = Column(String, nullable=False, index=True)
    client_phone = Column(String, nullable=False)
    client_telegram_id = Column(String, nullable=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    time = Column(String, nullable=False)  # HH:MM
    service_name = Column(String, nullable=False)
    duration = Column(Integer, default=30)  # in minutes
    price = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    status = Column(String, default="new")  # new, confirmed, completed, cancelled, noshow
    review_message_id = Column(Integer, nullable=True)
    
    business = relationship("Business", back_populates="bookings")
    master = relationship("Master", back_populates="bookings")
