from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_business
from app.models.business import Business
from app.schemas.booking import BookingOut, BookingCreate, BookingUpdate
from app.crud.booking import crud_booking
from app.core.telegram_bot import notify_booking_created, notify_booking_status_updated

router = APIRouter()


@router.get("/", response_model=List[BookingOut])
def read_bookings(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = None,
    master_id: Optional[str] = None,
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve bookings belonging to the authenticated business, optionally filtered by date or master.
    """
    query = db.query(crud_booking.model).filter(
        crud_booking.model.business_id == current_business.id
    )
    if date:
        query = query.filter(crud_booking.model.date == date)
    if master_id:
        query = query.filter(crud_booking.model.master_id == master_id)
        
    return query.order_by(crud_booking.model.date.desc(), crud_booking.model.time.asc()).offset(skip).limit(limit).all()

@router.post("/", response_model=BookingOut)
def create_booking(
    *,
    db: Session = Depends(get_db),
    booking_in: BookingCreate,
    current_business: Business = Depends(get_current_business)
):
    """
    Create a new booking associated with the authenticated business.
    """
    booking_in.business_id = current_business.id
    db_booking = crud_booking.create(db, obj_in=booking_in)
    notify_booking_created(db_booking, db)
    return db_booking


@router.get("/{booking_id}", response_model=BookingOut)
def read_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Retrieve details of a specific booking, validating ownership.
    """
    booking = crud_booking.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this booking")
    return booking

@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(
    *,
    db: Session = Depends(get_db),
    booking_id: str,
    booking_in: BookingUpdate,
    current_business: Business = Depends(get_current_business)
):
    """
    Update booking details, validating ownership.
    """
    booking = crud_booking.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking")
    updated_booking = crud_booking.update(db, db_obj=booking, obj_in=booking_in)
    notify_booking_status_updated(updated_booking, db)
    return updated_booking


@router.put("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    *,
    db: Session = Depends(get_db),
    booking_id: str,
    status_str: str,
    current_business: Business = Depends(get_current_business)
):
    """
    Fast update endpoint for changing booking status.
    """
    booking = crud_booking.get(db, id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking")
    
    valid_statuses = ['new', 'confirmed', 'completed', 'cancelled', 'noshow']
    if status_str not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status value. Must be one of {valid_statuses}")
        
    updated_booking = crud_booking.update(db, db_obj=booking, obj_in={"status": status_str})
    notify_booking_status_updated(updated_booking, db)
    return updated_booking

