import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_business
from app.models.business import Business
from app.schemas.master import MasterOut, MasterCreate, MasterUpdate
from app.crud.master import crud_master

router = APIRouter()

@router.get("/", response_model=List[MasterOut])
def read_masters(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve masters belonging to the authenticated business.
    """
    return db.query(crud_master.model).filter(
        crud_master.model.business_id == current_business.id
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=MasterOut)
def create_master(
    *,
    db: Session = Depends(get_db),
    master_in: MasterCreate,
    current_business: Business = Depends(get_current_business)
):
    """
    Create a new master profile associated with the authenticated business.
    """
    master_in.business_id = current_business.id
    return crud_master.create(db, obj_in=master_in)

@router.get("/{master_id}", response_model=MasterOut)
def read_master(
    master_id: str,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve a specific master profile, validating ownership.
    """
    master = crud_master.get(db, id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    if master.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this master profile")
    return master

@router.put("/{master_id}", response_model=MasterOut)
def update_master(
    *,
    db: Session = Depends(get_db),
    master_id: str,
    master_in: MasterUpdate,
    current_business: Business = Depends(get_current_business)
):
    """
    Update a master profile, validating ownership.
    """
    master = crud_master.get(db, id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    if master.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this master profile")
    return crud_master.update(db, db_obj=master, obj_in=master_in)

@router.delete("/{master_id}", response_model=MasterOut)
def delete_master(
    *,
    db: Session = Depends(get_db),
    master_id: str,
    current_business: Business = Depends(get_current_business)
):
    """
    Delete a master profile, validating ownership.
    """
    master = crud_master.get(db, id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    if master.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this master profile")
    return crud_master.remove(db, id=master_id)
