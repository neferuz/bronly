from typing import List, Union, Dict, Any
import uuid
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.master import Master
from app.models.service import Service
from app.schemas.master import MasterCreate, MasterUpdate

class CRUDMaster(CRUDBase[Master, MasterCreate, MasterUpdate]):
    def get_by_business(self, db: Session, *, business_id: str) -> List[Master]:
        return db.query(self.model).filter(self.model.business_id == business_id).all()

    def create(self, db: Session, *, obj_in: MasterCreate) -> Master:
        obj_in_data = obj_in.model_dump(exclude={"services"})
        db_obj = self.model(**obj_in_data)
        if not db_obj.id:
            db_obj.id = str(uuid.uuid4())
            
        if obj_in.services:
            db_services = db.query(Service).filter(Service.id.in_(obj_in.services)).all()
            db_obj.services = db_services
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Master, obj_in: Union[MasterUpdate, Dict[str, Any]]
    ) -> Master:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        services_ids = update_data.pop("services", None)
        
        # update regular fields
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        # update services relationship if provided
        if services_ids is not None:
            db_services = db.query(Service).filter(Service.id.in_(services_ids)).all()
            db_obj.services = db_services
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

crud_master = CRUDMaster(Master)

