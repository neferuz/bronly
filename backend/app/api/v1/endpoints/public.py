from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.crud.business import crud_business
from app.crud.master import crud_master
from app.crud.service import crud_service
from app.crud.booking import crud_booking
from app.schemas.business import BusinessOut
from app.schemas.service import ServiceOut
from app.schemas.master import MasterOut
from app.schemas.booking import BookingOut, BookingCreate
from app.models.booking import Booking
from app.models.master import Master
from app.models.review import Review
from app.models.business import Business
from app.schemas.review import ReviewCreate, ReviewOut
from app.core.telegram_bot import notify_booking_created, notify_booking_status_updated



router = APIRouter()

class PublicBookingCreate(BaseModel):
    business_id: str
    master_id: str
    service_id: str
    client_name: str
    client_phone: str
    client_telegram_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    comment: Optional[str] = None

class MasterVerifyResponse(BaseModel):
    status: str
    master: Optional[MasterOut] = None
    message: Optional[str] = None

class MasterLinkRequest(BaseModel):
    business_id: str
    master_id: str
    telegram_id: str

class BookingStatusUpdate(BaseModel):
    status: str
    telegram_id: str

class MasterActiveUpdate(BaseModel):
    is_active: bool
    telegram_id: str

def resolve_business_id(db: Session, business_id: str) -> str:
    # 1. First check if it matches id
    business = db.query(Business).filter(Business.id == business_id).first()
    if business:
        return business.id
    # 2. Check if it matches slug
    business_by_slug = db.query(Business).filter(Business.slug == business_id).first()
    if business_by_slug:
        return business_by_slug.id
    return business_id

@router.get("/businesses/{business_id}", response_model=BusinessOut)
def read_public_business(business_id: str, db: Session = Depends(get_db)):
    """
    Get public info/settings of a business for branding.
    """
    resolved_id = resolve_business_id(db, business_id)
    business = crud_business.get(db, id=resolved_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business.is_active:
        raise HTTPException(status_code=400, detail="Business is inactive")
    return business

@router.get("/businesses/{business_id}/services", response_model=List[ServiceOut])
def read_public_services(business_id: str, db: Session = Depends(get_db)):
    """
    Get active services of a business.
    """
    resolved_id = resolve_business_id(db, business_id)
    services = db.query(crud_service.model).filter(
        crud_service.model.business_id == resolved_id,
        crud_service.model.is_active == True
    ).all()
    return services

@router.get("/businesses/{business_id}/masters", response_model=List[MasterOut])
def read_public_masters(business_id: str, db: Session = Depends(get_db)):
    """
    Get active masters of a business.
    """
    resolved_id = resolve_business_id(db, business_id)
    masters = db.query(crud_master.model).filter(
        crud_master.model.business_id == resolved_id,
        crud_master.model.is_active == True
    ).all()
    return masters

@router.get("/businesses/{business_id}/bookings/busy-slots")
def read_busy_slots(
    business_id: str,
    date: str,
    master_id: str,
    db: Session = Depends(get_db)
):
    """
    Get list of busy times (HH:MM) for a master on a specific date.
    """
    resolved_id = resolve_business_id(db, business_id)
    bookings = db.query(Booking).filter(
        Booking.business_id == resolved_id,
        Booking.master_id == master_id,
        Booking.date == date,
        Booking.status.in_(["new", "confirmed", "completed"])
    ).all()
    return [b.time for b in bookings]

@router.post("/bookings", response_model=BookingOut)
def create_public_booking(
    *,
    db: Session = Depends(get_db),
    booking_in: PublicBookingCreate
):
    """
    Create a new booking as a guest client.
    """
    resolved_id = resolve_business_id(db, booking_in.business_id)
    # 1. Verify business exists
    business = crud_business.get(db, id=resolved_id)
    if not business or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found or inactive")
        
    # 2. Verify master exists and belongs to the business
    master = crud_master.get(db, id=booking_in.master_id)
    if not master or master.business_id != resolved_id or not master.is_active:
        raise HTTPException(status_code=404, detail="Master not found or inactive")
        
    # 3. Verify service exists and belongs to the business
    service = crud_service.get(db, id=booking_in.service_id)
    if not service or service.business_id != resolved_id or not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found or inactive")
        
    # 4. Check if slot is already taken
    existing_booking = db.query(Booking).filter(
        Booking.business_id == resolved_id,
        Booking.master_id == booking_in.master_id,
        Booking.date == booking_in.date,
        Booking.time == booking_in.time,
        Booking.status.in_(["new", "confirmed", "completed"])
    ).first()
    if existing_booking:
        raise HTTPException(status_code=400, detail="This time slot is already booked")
        
    # 5. Build full BookingCreate model
    full_booking = BookingCreate(
        client_name=booking_in.client_name,
        client_phone=booking_in.client_phone,
        client_telegram_id=booking_in.client_telegram_id,
        date=booking_in.date,
        time=booking_in.time,
        service_name=service.name,
        duration=service.duration,
        price=service.price,
        comment=booking_in.comment,
        status="new",
        business_id=resolved_id,
        master_id=booking_in.master_id
    )
    
    db_booking = crud_booking.create(db, obj_in=full_booking)
    notify_booking_created(db_booking, db)
    out = BookingOut.model_validate(db_booking)
    if db_booking.master:
        out.master_name = db_booking.master.name
    return out


@router.get("/bookings/by-phone/{phone}", response_model=List[BookingOut])
def read_bookings_by_phone(phone: str, db: Session = Depends(get_db)):
    """
    Get client's history of bookings by their phone number.
    """
    bookings = db.query(Booking).filter(
        Booking.client_phone == phone
    ).order_by(Booking.date.desc(), Booking.time.desc()).all()
    
    res = []
    for b in bookings:
        out = BookingOut.model_validate(b)
        if b.master:
            out.master_name = b.master.name
        res.append(out)
    return res

@router.get("/masters/verify", response_model=MasterVerifyResponse)
def verify_master(
    business_id: str,
    master_id: Optional[str] = None,
    telegram_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    resolved_id = resolve_business_id(db, business_id)
    
    master = None
    if telegram_id:
        master = db.query(Master).filter(
            Master.telegram_id == telegram_id,
            Master.business_id == resolved_id
        ).first()
        
    if not master and master_id:
        master = db.query(Master).filter(
            Master.id == master_id,
            Master.business_id == resolved_id
        ).first()
        
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    
    if not master.telegram_id:
        return MasterVerifyResponse(status="link_required", master=MasterOut.model_validate(master))
    
    if master.telegram_id == telegram_id:
        return MasterVerifyResponse(status="success", master=MasterOut.model_validate(master))
    
    return MasterVerifyResponse(
        status="unauthorized",
        message="Этот кабинет привязан к другому аккаунту Telegram."
    )

@router.post("/masters/link", response_model=MasterVerifyResponse)
def link_master(
    req: MasterLinkRequest,
    db: Session = Depends(get_db)
):
    resolved_id = resolve_business_id(db, req.business_id)
    master = db.query(Master).filter(
        Master.id == req.master_id,
        Master.business_id == resolved_id
    ).first()
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    
    if master.telegram_id and master.telegram_id != req.telegram_id:
        raise HTTPException(status_code=400, detail="Этот кабинет уже привязан к другому аккаунту Telegram.")
        
    master.telegram_id = req.telegram_id
    db.add(master)
    db.commit()
    db.refresh(master)
    return MasterVerifyResponse(status="success", master=MasterOut.model_validate(master))

@router.get("/masters/{master_id}/bookings", response_model=List[BookingOut])
def read_master_bookings(
    master_id: str,
    business_id: str,
    telegram_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    resolved_id = resolve_business_id(db, business_id)
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master or master.business_id != resolved_id:
        raise HTTPException(status_code=404, detail="Мастер не найден")
        
    if master.telegram_id != telegram_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    query = db.query(Booking).filter(
        Booking.business_id == resolved_id,
        Booking.master_id == master_id
    )
    if date and date != "all":
        query = query.filter(Booking.date == date)
        
    bookings = query.order_by(Booking.date.asc(), Booking.time.asc()).all()
    
    res = []
    for b in bookings:
        out = BookingOut.model_validate(b)
        if b.master:
            out.master_name = b.master.name
        res.append(out)
    return res

@router.patch("/bookings/{booking_id}/status", response_model=BookingOut)
def update_booking_status_public(
    booking_id: str,
    req: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")
        
    if not booking.master or booking.master.telegram_id != req.telegram_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    booking.status = req.status
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    notify_booking_status_updated(booking, db)
    
    out = BookingOut.model_validate(booking)
    if booking.master:
        out.master_name = booking.master.name
    return out


@router.patch("/masters/{master_id}/active", response_model=MasterOut)
def update_master_active_public(
    master_id: str,
    req: MasterActiveUpdate,
    db: Session = Depends(get_db)
):
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
        
    if master.telegram_id != req.telegram_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    master.is_active = req.is_active
    db.add(master)
    db.commit()
    db.refresh(master)
    return master

@router.get("/bookings/{booking_id}", response_model=BookingOut)
def read_public_booking(booking_id: str, db: Session = Depends(get_db)):
    """
    Get public details of a booking (used for reviews).
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    out = BookingOut.model_validate(booking)
    if booking.master:
        out.master_name = booking.master.name
    return out

@router.post("/bookings/{booking_id}/review", response_model=ReviewOut)
def create_booking_review(
    booking_id: str,
    review_in: ReviewCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a review for a completed booking and update the master's average rating.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")
        
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Можно оценить только завершенный визит")
        
    existing_review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Отзыв о данном визите уже отправлен")
        
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(status_code=400, detail="Оценка должна быть от 1 до 5")
        
    import uuid
    db_review = Review(
        id=str(uuid.uuid4()),
        booking_id=booking_id,
        master_id=booking.master_id,
        business_id=booking.business_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Recalculate average rating of the master
    from sqlalchemy import func
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.master_id == booking.master_id).scalar()
    if avg_rating is not None:
        master = db.query(Master).filter(Master.id == booking.master_id).first()
        if master:
            master.rating = round(float(avg_rating), 1)
            db.add(master)
            db.commit()
            
    return db_review

@router.get("/masters/{master_id}/reviews", response_model=List[ReviewOut])
def read_master_reviews(master_id: str, db: Session = Depends(get_db)):
    """
    Get all reviews for a master.
    """
    reviews = db.query(Review).filter(Review.master_id == master_id).order_by(Review.created_at.desc()).all()
    return reviews


class ContactSharedNotification(BaseModel):
    business_id: str
    chat_id: str
    phone: str

@router.post("/telegram/notify-contact-shared")
def notify_contact_shared(
    data: ContactSharedNotification,
    db: Session = Depends(get_db)
):
    resolved_id = resolve_business_id(db, data.business_id)
    business = crud_business.get(db, id=resolved_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if not business.client_bot_token:
        raise HTTPException(status_code=400, detail="Business client bot token not configured")
    
    message = (
        f"✅ <b>Спасибо большое!</b>\n\n"
        f"Ваш номер телефона <b>{data.phone}</b> успешно сохранен. "
        f"Теперь вы можете быстро и удобно записываться к нам онлайн через Mini App! 🚀"
    )
    from app.core.telegram_bot import send_telegram_message
    send_telegram_message(business.client_bot_token, data.chat_id, message)
    return {"ok": True}


