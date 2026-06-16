from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_business
from app.models.business import Business
from app.schemas.service import ServiceOut, ServiceCreate, ServiceUpdate
from app.crud.service import crud_service

router = APIRouter()

@router.get("/", response_model=List[ServiceOut])
def read_services(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve services belonging to the authenticated business.
    """
    return db.query(crud_service.model).filter(
        crud_service.model.business_id == current_business.id
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=ServiceOut)
def create_service(
    *,
    db: Session = Depends(get_db),
    service_in: ServiceCreate,
    current_business: Business = Depends(get_current_business)
):
    """
    Create a new service associated with the authenticated business.
    """
    service_in.business_id = current_business.id
    return crud_service.create(db, obj_in=service_in)

@router.get("/{service_id}", response_model=ServiceOut)
def read_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve a specific service, validating ownership.
    """
    service = crud_service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this service")
    return service

@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    *,
    db: Session = Depends(get_db),
    service_id: str,
    service_in: ServiceUpdate,
    current_business: Business = Depends(get_current_business)
):
    """
    Update a service, validating ownership.
    """
    service = crud_service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this service")
    return crud_service.update(db, db_obj=service, obj_in=service_in)

@router.delete("/{service_id}", response_model=ServiceOut)
def delete_service(
    *,
    db: Session = Depends(get_db),
    service_id: str,
    current_business: Business = Depends(get_current_business)
):
    """
    Delete a service, validating ownership.
    """
    service = crud_service.get(db, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this service")
    return crud_service.remove(db, id=service_id)
