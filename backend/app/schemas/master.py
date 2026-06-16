from pydantic import BaseModel, field_validator
from typing import Optional, List

class MasterBase(BaseModel):
    name: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = True
    description: Optional[str] = None
    telegram_id: Optional[str] = None

class MasterCreate(MasterBase):
    business_id: str
    services: Optional[List[str]] = []

class MasterUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None
    services: Optional[List[str]] = None
    telegram_id: Optional[str] = None

class MasterInDBBase(MasterBase):
    id: str
    business_id: str
    rating: float

    class Config:
        from_attributes = True

class MasterOut(MasterInDBBase):
    services: List[str] = []

    @field_validator("services", mode="before")
    @classmethod
    def serialize_services(cls, v):
        if not v:
            return []
        if isinstance(v, list):
            return [item.id if hasattr(item, "id") else item for item in v]
        return v

