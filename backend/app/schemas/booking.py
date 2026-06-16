from pydantic import BaseModel
from typing import Optional

class BookingBase(BaseModel):
    client_name: str
    client_phone: str
    client_telegram_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    service_name: str
    duration: Optional[int] = 30
    price: int
    comment: Optional[str] = None
    status: Optional[str] = "new"

class BookingCreate(BookingBase):
    business_id: str
    master_id: str

class BookingUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_telegram_id: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    service_name: Optional[str] = None
    duration: Optional[int] = None
    price: Optional[int] = None
    comment: Optional[str] = None
    status: Optional[str] = None

class BookingInDBBase(BookingBase):
    id: str
    business_id: str
    master_id: str

    class Config:
        from_attributes = True

class BookingOut(BookingInDBBase):
    master_name: Optional[str] = None
