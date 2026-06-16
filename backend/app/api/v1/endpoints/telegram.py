from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.models.business import Business
from app.models.booking import Booking
from app.core.config import settings
from app.core.telegram_bot import (
    send_telegram_message,
    answer_callback_query,
    edit_message_text,
    notify_booking_status_updated
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/webhook/{business_id}/{bot_type}")
async def telegram_webhook(
    business_id: str,
    bot_type: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Unified Telegram Bot Webhook.
    Handles client bot and master bot events dynamically per business.
    """
    try:
        update = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse Telegram webhook JSON: {e}")
        return {"ok": False, "detail": "Invalid JSON"}
        
    logger.info(f"Telegram update for business {business_id} ({bot_type}): {update}")
    
    # 1. Fetch business
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        logger.error(f"Webhook error: Business {business_id} not found")
        return {"ok": False, "detail": "Business not found"}
        
    bot_token = business.client_bot_token if bot_type == "client" else business.master_bot_token
    if not bot_token:
        logger.warning(f"Webhook warning: Bot token for {business_id} ({bot_type}) not configured")
        return {"ok": False, "detail": "Bot token not configured"}

    # Handle Callback Queries (Master Bot buttons)
    if "callback_query" in update:
        cq = update["callback_query"]
        cq_id = cq["id"]
        chat_id = cq["message"]["chat"]["id"]
        message_id = cq["message"]["message_id"]
        data = cq.get("data", "")
        
        if bot_type == "master":
            if data.startswith("confirm_booking_") or data.startswith("cancel_booking_"):
                booking_id = data.split("_")[-1]
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                if not booking:
                    answer_callback_query(bot_token, cq_id, "Запись не найдена")
                    return {"ok": True}
                    
                new_status = "confirmed" if data.startswith("confirm_booking_") else "cancelled"
                booking.status = new_status
                db.add(booking)
                db.commit()
                db.refresh(booking)
                
                status_text = "подтверждена ✅" if new_status == "confirmed" else "отменена ❌"
                answer_callback_query(bot_token, cq_id, f"Запись {status_text}")
                
                # Edit original message to remove buttons and show result status
                orig_text = cq["message"]["text"]
                # Append status to text
                new_text = orig_text + f"\n\n<b>Статус: Запись {status_text}</b>"
                edit_message_text(bot_token, chat_id, message_id, new_text, reply_markup={"inline_keyboard": []})
                
                # Trigger client / master notifications
                notify_booking_status_updated(booking, db)
                
        return {"ok": True}
        
    # Handle Messages (start command)
    if "message" in update:
        msg = update["message"]
        chat_id = msg["chat"]["id"]
        text = msg.get("text", "")
        
        if text.startswith("/start"):
            if bot_type == "client":
                welcome_msg = (
                    f"Привет! Добро пожаловать в <b>{business.name}</b>.\n\n"
                    f"Здесь вы можете быстро записаться на наши услуги онлайн через удобное мини-приложение прямо в Telegram! ✨"
                )
                miniapp_url = f"{settings.CLIENT_MINIAPP_URL}/?b={business_id}&tg_id={chat_id}"
                reply_markup = {
                    "inline_keyboard": [
                        [
                            {"text": "Записаться онлайн 🚀", "web_app": {"url": miniapp_url}}
                        ]
                    ]
                }
                send_telegram_message(bot_token, chat_id, welcome_msg, reply_markup)
            
            elif bot_type == "master":
                welcome_msg = (
                    f"Привет! Вы вошли в бот для мастеров заведения <b>{business.name}</b>.\n\n"
                    f"Здесь вы будете получать уведомления о новых записях и сможете подтверждать или отменять их.\n\n"
                    f"Чтобы открыть свой рабочий кабинет, нажмите на кнопку ниже:"
                )
                
                # Extract start parameter if master profile link was shared
                start_param = ""
                parts = text.split(" ")
                if len(parts) > 1:
                    start_param = parts[1]
                
                # Build master app URL
                master_url = settings.MASTER_MINIAPP_URL
                master_url_param = f"{master_url}/?b={business_id}&tg_id={chat_id}"
                if start_param:
                    master_url_param += f"&tgWebAppStartParam={start_param}"
                
                reply_markup = {
                    "inline_keyboard": [
                        [
                            {"text": "Кабинет мастера 💼", "web_app": {"url": master_url_param}}
                        ]
                    ]
                }
                send_telegram_message(bot_token, chat_id, welcome_msg, reply_markup)
                
    return {"ok": True}
