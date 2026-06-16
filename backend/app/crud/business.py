import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate
from app.core.security import get_password_hash

class CRUDBusiness(CRUDBase[Business, BusinessCreate, BusinessUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[Business]:
        return db.query(self.model).filter(self.model.owner_email == email).first()

    def create(self, db: Session, *, obj_in: BusinessCreate) -> Business:
        db_obj = Business(
            id=str(uuid.uuid4()),
            name=obj_in.name,
            slug=obj_in.slug or (obj_in.name.split(' ')[0].lower() if obj_in.name else None),
            owner_name=obj_in.owner_name,
            owner_email=obj_in.owner_email,
            hashed_password=get_password_hash(obj_in.password),
            logo=obj_in.logo,
            address=obj_in.address,
            phone=obj_in.phone,
            plan=obj_in.plan,
            commission_rate=obj_in.commission_rate
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

crud_business = CRUDBusiness(Business)
