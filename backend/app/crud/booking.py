from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingUpdate

class CRUDBooking(CRUDBase[Booking, BookingCreate, BookingUpdate]):
    def get_by_business(self, db: Session, *, business_id: str) -> List[Booking]:
        return db.query(self.model).filter(self.model.business_id == business_id).all()

    def get_by_master(self, db: Session, *, master_id: str) -> List[Booking]:
        return db.query(self.model).filter(self.model.master_id == master_id).all()

    def get_by_date(self, db: Session, *, date: str) -> List[Booking]:
        return db.query(self.model).filter(self.model.date == date).all()

crud_booking = CRUDBooking(Booking)
