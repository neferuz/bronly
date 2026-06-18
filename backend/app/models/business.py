from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone

class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    owner_name = Column(String, nullable=False)
    owner_email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    plain_password = Column(String, nullable=True)
    owner_telegram = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=True)
    logo = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    plan = Column(String, default="free")  # free, pro, enterprise
    is_active = Column(Boolean, default=True)
    commission_rate = Column(Float, default=30.0)  # percentage
    
    # New Branding & Mini App settings
    description = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    telegram = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    primary_color = Column(String, default="#4f46e5")
    schedule = Column(String, nullable=True)
    
    # Custom Telegram Bots Configuration
    client_bot_username = Column(String, nullable=True)
    client_bot_token = Column(String, nullable=True)
    master_bot_username = Column(String, nullable=True)
    master_bot_token = Column(String, nullable=True)
    
    # Business settings
    currency = Column(String, default="сум")
    timezone = Column(String, default="Asia/Tashkent (GMT+5)")
    min_buffer_hours = Column(Integer, default=2)
    max_booking_days = Column(Integer, default=30)
    
    masters = relationship("Master", back_populates="business", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="business", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="business", cascade="all, delete-orphan")
    broadcasts = relationship("BroadcastHistory", back_populates="business", cascade="all, delete-orphan")
