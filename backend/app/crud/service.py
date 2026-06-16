from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate

class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    def get_by_business(self, db: Session, *, business_id: str) -> List[Service]:
        return db.query(self.model).filter(self.model.business_id == business_id).all()

crud_service = CRUDService(Service)
