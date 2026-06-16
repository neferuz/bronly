from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import json


class BusinessBase(BaseModel):
    name: str
    owner_name: str
    owner_email: EmailStr
    owner_telegram: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    plan: Optional[str] = "free"
    commission_rate: Optional[float] = 30.0
    
    # New settings fields
    description: Optional[str] = None
    instagram: Optional[str] = None
    telegram: Optional[str] = None
    cover_image: Optional[str] = None
    primary_color: Optional[str] = "#4f46e5"
    currency: Optional[str] = "сум"
    timezone: Optional[str] = "Asia/Tashkent (GMT+5)"
    min_buffer_hours: Optional[int] = 2
    max_booking_days: Optional[int] = 30
    schedule: Optional[str] = None
    
    # Custom Telegram Bots Configuration
    client_bot_username: Optional[str] = None
    client_bot_token: Optional[str] = None
    master_bot_username: Optional[str] = None
    master_bot_token: Optional[str] = None

    @field_validator("schedule")
    @classmethod
    def validate_schedule(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        try:
            parsed = json.loads(v)
            if not isinstance(parsed, list):
                raise ValueError("Schedule must be a JSON array")
            for day in parsed:
                if not isinstance(day, dict):
                    raise ValueError("Each day config must be a JSON object")
                if day.get("isOpen"):
                    open_time = day.get("openTime")
                    close_time = day.get("closeTime")
                    if not open_time or not close_time:
                        raise ValueError(f"openTime and closeTime are required for open day: {day.get('dayName')}")
                    try:
                        from datetime import datetime as dt
                        ot = dt.strptime(open_time, "%H:%M").time()
                        ct = dt.strptime(close_time, "%H:%M").time()
                    except ValueError:
                        raise ValueError(f"Time format must be HH:MM for day: {day.get('dayName')}")
                    if ot >= ct:
                        raise ValueError(f"Время открытия должно быть раньше времени закрытия ({day.get('dayName')})")
        except json.JSONDecodeError:
            raise ValueError("Schedule must be a valid JSON string")
        return v

class BusinessCreate(BusinessBase):
    password: str

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    owner_telegram: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    rating: Optional[float] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    commission_rate: Optional[float] = None
    
    description: Optional[str] = None
    instagram: Optional[str] = None
    telegram: Optional[str] = None
    cover_image: Optional[str] = None
    primary_color: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    min_buffer_hours: Optional[int] = None
    max_booking_days: Optional[int] = None
    schedule: Optional[str] = None
    
    client_bot_username: Optional[str] = None
    client_bot_token: Optional[str] = None
    master_bot_username: Optional[str] = None
    master_bot_token: Optional[str] = None

    @field_validator("schedule")
    @classmethod
    def validate_schedule(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        try:
            parsed = json.loads(v)
            if not isinstance(parsed, list):
                raise ValueError("Schedule must be a JSON array")
            for day in parsed:
                if not isinstance(day, dict):
                    raise ValueError("Each day config must be a JSON object")
                if day.get("isOpen"):
                    open_time = day.get("openTime")
                    close_time = day.get("closeTime")
                    if not open_time or not close_time:
                        raise ValueError(f"openTime and closeTime are required for open day: {day.get('dayName')}")
                    try:
                        from datetime import datetime as dt
                        ot = dt.strptime(open_time, "%H:%M").time()
                        ct = dt.strptime(close_time, "%H:%M").time()
                    except ValueError:
                        raise ValueError(f"Time format must be HH:MM for day: {day.get('dayName')}")
                    if ot >= ct:
                        raise ValueError(f"Время открытия должно быть раньше времени закрытия ({day.get('dayName')})")
        except json.JSONDecodeError:
            raise ValueError("Schedule must be a valid JSON string")
        return v

class BusinessInDBBase(BusinessBase):
    id: str
    rating: float
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BusinessOut(BusinessInDBBase):
    pass
