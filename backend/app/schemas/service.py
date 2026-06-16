from pydantic import BaseModel
from typing import Optional

class ServiceBase(BaseModel):
    name: str
    category: str
    price: int
    duration: Optional[int] = 30
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = True

class ServiceCreate(ServiceBase):
    business_id: str

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    duration: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceInDBBase(ServiceBase):
    id: str
    business_id: str

    class Config:
        from_attributes = True

class ServiceOut(ServiceInDBBase):
    pass
