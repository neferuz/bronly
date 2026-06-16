from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: int  # 1 to 5 stars
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: str
    booking_id: str
    master_id: str
    business_id: str
    rating: int
    comment: Optional[str] = None
    reply_comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
