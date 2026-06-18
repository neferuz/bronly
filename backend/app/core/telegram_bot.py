import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def set_bot_webhook(business_id: str, bot_token: str, bot_type: str, webhook_base_url: str):
    """
    Register a webhook for a business bot with Telegram.
    """
    if not bot_token or not webhook_base_url:
        logger.warning(f"Cannot set webhook for {business_id}: bot_token or webhook_base_url not provided")
        return
    
    url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    webhook_url = f"{webhook_base_url}/api/v1/telegram/webhook/{business_id}/{bot_type}"
    try:
        with httpx.Client() as client:
            resp = client.post(url, json={"url": webhook_url})
            logger.info(f"Telegram setWebhook for {business_id} ({bot_type}): {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Failed to set webhook for {business_id} ({bot_type}): {e}")

def delete_bot_webhook(bot_token: str):
    """
    Delete a webhook for a bot token.
    """
    if not bot_token:
        return
    url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
    try:
        with httpx.Client() as client:
            resp = client.post(url)
            logger.info(f"Telegram deleteWebhook response: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Failed to delete webhook: {e}")

def send_telegram_message(bot_token: str, chat_id: str, text: str, reply_markup: dict = None):
    """
    Send HTML-formatted text message using bot token.
    """
    if not bot_token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        with httpx.Client() as client:
            resp = client.post(url, json=payload)
            if not resp.is_success:
                logger.error(f"Telegram sendMessage failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Failed to send telegram message to {chat_id}: {e}")

def send_telegram_photo(bot_token: str, chat_id: str, photo_url: str, caption: str = "", reply_markup: dict = None):
    """
    Send a photo with an optional caption.
    """
    if not bot_token or not chat_id:
        return
    
    url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
    payload = {
        "chat_id": chat_id,
        "photo": photo_url,
        "caption": caption,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
        
    try:
        with httpx.Client() as client:
            resp = client.post(url, json=payload)
            if not resp.is_success:
                logger.error(f"Telegram sendPhoto failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Failed to send telegram photo to {chat_id}: {e}")

def answer_callback_query(bot_token: str, callback_query_id: str, text: str = None):
    """
    Acknowledge Telegram callback query.
    """
    if not bot_token:
        return
    url = f"https://api.telegram.org/bot{bot_token}/answerCallbackQuery"
    payload = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
    try:
        with httpx.Client() as client:
            client.post(url, json=payload)
    except Exception as e:
        logger.error(f"Failed to answer callback query: {e}")

def edit_message_text(bot_token: str, chat_id: str, message_id: int, text: str, reply_markup: dict = None):
    """
    Edit existing bot message.
    """
    if not bot_token:
        return
    url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    try:
        with httpx.Client() as client:
            client.post(url, json=payload)
    except Exception as e:
        logger.error(f"Failed to edit message text: {e}")

def notify_booking_created(booking, db):
    """
    Send interactive notification to the master about a new booking.
    """
    # booking instances are passed dynamically
    business = booking.business
    if not business or not business.master_bot_token:
        return
    master = booking.master
    if not master or not master.telegram_id:
        return
    
    currency = business.currency or "сум"
    msg = (
        f"<b>🆕 Новая запись!</b>\n\n"
        f"👤 Клиент: <b>{booking.client_name}</b>\n"
        f"📞 Телефон: {booking.client_phone}\n"
        f"✂️ Услуга: {booking.service_name}\n"
        f"📅 Дата: {booking.date}\n"
        f"⏰ Время: {booking.time}\n"
        f"💰 Стоимость: {booking.price} {currency}\n"
    )
    if booking.comment:
        msg += f"💬 Комментарий: {booking.comment}\n"
        
    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "Подтвердить ✅", "callback_data": f"confirm_booking_{booking.id}"},
                {"text": "Отменить ❌", "callback_data": f"cancel_booking_{booking.id}"}
            ]
        ]
    }
    send_telegram_message(business.master_bot_token, master.telegram_id, msg, reply_markup)

def notify_booking_status_updated(booking, db):
    """
    Send update notifications to client and master on status changes.
    """
    business = booking.business
    if not business:
        return
    
    status_ru = {
        "new": "Новая",
        "confirmed": "Подтверждена ✅",
        "completed": "Завершена 🎉",
        "cancelled": "Отменена ❌",
        "noshow": "Не явился ⚠️"
    }.get(booking.status, booking.status)
    
    master = booking.master
    
    # 1. Notify client
    if business.client_bot_token and booking.client_telegram_id:
        if booking.status == "completed":
            client_msg = (
                f"<b>Спасибо за ваш визит в {business.name}!</b>\n\n"
                f"Как прошел ваш сеанс у мастера <b>{master.name if master else 'специалиста'}</b>?\n"
                f"Пожалуйста, оцените качество услуг, это поможет нам стать лучше. ⭐"
            )
            review_url = f"{settings.CLIENT_MINIAPP_URL}/review?b={business.id}&booking_id={booking.id}"
            reply_markup = {
                "inline_keyboard": [
                    [
                        {"text": "Оценить визит ⭐", "web_app": {"url": review_url}}
                    ]
                ]
            }
            send_telegram_message(business.client_bot_token, booking.client_telegram_id, client_msg, reply_markup)
        else:
            client_msg = (
                f"<b>Статус вашей записи в {business.name} обновлен!</b>\n\n"
                f"✂️ Услуга: {booking.service_name}\n"
                f"📅 Дата: {booking.date}\n"
                f"⏰ Время: {booking.time}\n"
                f"📊 Новый статус: <b>{status_ru}</b>\n"
            )
            send_telegram_message(business.client_bot_token, booking.client_telegram_id, client_msg)
        
    # 2. Notify master
    if business.master_bot_token and master and master.telegram_id:
        master_msg = (
            f"<b>Статус записи изменен!</b>\n\n"
            f"👤 Клиент: {booking.client_name}\n"
            f"✂️ Услуга: {booking.service_name}\n"
            f"📅 Дата: {booking.date}\n"
            f"⏰ Время: {booking.time}\n"
            f"📊 Новый статус: <b>{status_ru}</b>\n"
        )
        send_telegram_message(business.master_bot_token, master.telegram_id, master_msg)

