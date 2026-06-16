from sqlalchemy import Column, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.service import master_services

class Master(Base):
    __tablename__ = "masters"
    
    id = Column(String, primary_key=True, index=True)
    business_id = Column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    telegram_id = Column(String, nullable=True, unique=True, index=True)
    
    business = relationship("Business", back_populates="masters")
    bookings = relationship("Booking", back_populates="master", cascade="all, delete-orphan")
    services = relationship("Service", secondary=master_services, back_populates="masters")

