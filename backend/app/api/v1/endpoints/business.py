from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_business
from app.models.business import Business
from app.schemas.business import BusinessOut, BusinessCreate, BusinessUpdate
from app.crud.business import crud_business
from app.models.review import Review
from app.schemas.review import ReviewOut

router = APIRouter()


@router.get("/me", response_model=BusinessOut)
def read_business_me(current_business: Business = Depends(get_current_business)):
    """
    Get current logged-in business profile.
    """
    return current_business

from app.core.config import settings
from app.core.telegram_bot import set_bot_webhook, delete_bot_webhook

@router.put("/me", response_model=BusinessOut)
def update_business_me(
    *,
    db: Session = Depends(get_db),
    business_in: BusinessUpdate,
    current_business: Business = Depends(get_current_business)
):
    """
    Update profile/settings for the logged-in business.
    """
    if business_in.owner_email and business_in.owner_email != current_business.owner_email:
        check_business = crud_business.get_by_email(db, email=business_in.owner_email)
        if check_business:
            raise HTTPException(
                status_code=400,
                detail="A business with this email already exists."
            )
            
    old_client_token = current_business.client_bot_token
    old_master_token = current_business.master_bot_token
    
    updated_business = crud_business.update(db, db_obj=current_business, obj_in=business_in)
    
    # Check if client bot token changed
    if business_in.client_bot_token is not None and business_in.client_bot_token != old_client_token:
        if business_in.client_bot_token:
            set_bot_webhook(
                updated_business.id,
                business_in.client_bot_token,
                "client",
                settings.TELEGRAM_WEBHOOK_BASE_URL
            )
        elif old_client_token:
            delete_bot_webhook(old_client_token)
            
    # Check if master bot token changed
    if business_in.master_bot_token is not None and business_in.master_bot_token != old_master_token:
        if business_in.master_bot_token:
            set_bot_webhook(
                updated_business.id,
                business_in.master_bot_token,
                "master",
                settings.TELEGRAM_WEBHOOK_BASE_URL
            )
        elif old_master_token:
            delete_bot_webhook(old_master_token)
            
    return updated_business


@router.get("/", response_model=List[BusinessOut])
def read_businesses(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return crud_business.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=BusinessOut)
def create_business(*, db: Session = Depends(get_db), business_in: BusinessCreate):
    db_business = crud_business.get_by_email(db, email=business_in.owner_email)
    if db_business:
        raise HTTPException(status_code=400, detail="A business with this email already exists.")
    return crud_business.create(db, obj_in=business_in)

@router.get("/{business_id}", response_model=BusinessOut)
def read_business(business_id: str, db: Session = Depends(get_db)):
    business = crud_business.get(db, id=business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@router.get("/me/reviews", response_model=List[ReviewOut])
def read_business_reviews_me(
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Get all reviews left for the currently logged-in business.
    """
    reviews = db.query(Review).filter(Review.business_id == current_business.id).order_by(Review.created_at.desc()).all()
    return reviews


from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class ReviewReplyRequest(BaseModel):
    reply_text: str

@router.post("/me/reviews/{review_id}/reply", response_model=ReviewOut)
def reply_to_business_review(
    review_id: str,
    payload: ReviewReplyRequest,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Reply to a review, save it in the database, and send the reply message to the client via Telegram.
    """
    review = db.query(Review).filter(Review.id == review_id, Review.business_id == current_business.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    review.reply_comment = payload.reply_text
    db.commit()
    db.refresh(review)
    
    # Send telegram message to the client
    try:
        from app.models.booking import Booking
        booking = db.query(Booking).filter(Booking.id == review.booking_id).first()
        if booking and booking.client_telegram_id and current_business.client_bot_token:
            from app.core.telegram_bot import send_telegram_message
            
            # Formulate message
            msg = (
                f"<b>Ответ от {current_business.name}:</b>\n\n"
                f"«{payload.reply_text}»\n\n"
                f"<i>На ваш отзыв об услуге {booking.service_name} у мастера {booking.master.name if booking.master else 'специалиста'}.</i>"
            )
            send_telegram_message(current_business.client_bot_token, booking.client_telegram_id, msg)
    except Exception as e:
        logger.error(f"Failed to send review reply telegram notification: {e}")
        
    return review

@router.delete("/me/reviews/{review_id}/reply", response_model=ReviewOut)
def delete_business_review_reply(
    review_id: str,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Delete the reply comment from a review.
    """
    review = db.query(Review).filter(Review.id == review_id, Review.business_id == current_business.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    review.reply_comment = None
    db.commit()
    db.refresh(review)
    return review

from typing import Optional
from sqlalchemy import func
from datetime import datetime, timedelta

class BroadcastRequest(BaseModel):
    audience: str
    message_text: str
    image_url: Optional[str] = None

@router.post("/me/broadcast")
def send_broadcast_message(
    payload: BroadcastRequest,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Send a broadcast message to clients based on audience filter.
    """
    from app.models.booking import Booking
    from app.models.broadcast import BroadcastHistory
    from app.core.telegram_bot import send_telegram_message, send_telegram_photo
    
    if not current_business.client_bot_token:
        raise HTTPException(status_code=400, detail="Telegram bot token not configured for this business.")

    query = db.query(Booking.client_telegram_id).filter(
        Booking.business_id == current_business.id,
        Booking.client_telegram_id.isnot(None)
    ).group_by(Booking.client_telegram_id)

    if payload.audience == "frequent":
        query = query.having(func.count(Booking.id) >= 3)
    elif payload.audience == "inactive":
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        query = query.having(func.max(Booking.date) < thirty_days_ago)
        
    client_ids = [row[0] for row in query.all()]
    
    if not client_ids:
        return {"status": "success", "sent_count": 0, "message": "No clients match the selected audience."}

    sent_count = 0
    for chat_id in client_ids:
        try:
            if payload.image_url:
                send_telegram_photo(
                    bot_token=current_business.client_bot_token,
                    chat_id=chat_id,
                    photo_url=payload.image_url,
                    caption=payload.message_text
                )
            else:
                send_telegram_message(
                    bot_token=current_business.client_bot_token,
                    chat_id=chat_id,
                    text=payload.message_text
                )
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send broadcast to {chat_id}: {e}")

    # Save to history
    history = BroadcastHistory(
        business_id=current_business.id,
        audience=payload.audience,
        message_text=payload.message_text,
        image_url=payload.image_url,
        sent_count=sent_count
    )
    db.add(history)
    db.commit()

    return {"status": "success", "sent_count": sent_count}

@router.get("/me/broadcasts")
def get_broadcast_history(
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """
    Get the broadcast history for the current business.
    """
    from app.models.broadcast import BroadcastHistory
    history = db.query(BroadcastHistory).filter(BroadcastHistory.business_id == current_business.id).order_by(BroadcastHistory.created_at.desc()).all()
    return history


