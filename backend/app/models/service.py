from sqlalchemy import Table, Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

master_services = Table(
    "master_services",
    Base.metadata,
    Column("master_id", String, ForeignKey("masters.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", String, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True)
)

class Service(Base):
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, index=True)
    business_id = Column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    price = Column(Integer, nullable=False)
    duration = Column(Integer, default=30)  # in minutes
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)  # URL or base64 image
    is_active = Column(Boolean, default=True)
    
    business = relationship("Business", back_populates="services")
    masters = relationship("Master", secondary=master_services, back_populates="services")
