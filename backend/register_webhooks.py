from app.core.database import SessionLocal
from app.models.business import Business
from app.models.master import Master
from app.models.service import Service
from app.models.booking import Booking
from app.core.telegram_bot import set_bot_webhook
from app.core.config import settings

def main():
    db = SessionLocal()
    businesses = db.query(Business).filter(Business.is_active == True).all()
    
    print(f"Found {len(businesses)} active businesses.")
    webhook_base = settings.TELEGRAM_WEBHOOK_BASE_URL or "https://api.bronly-hub.uz"
    print(f"Webhook Base URL: {webhook_base}")
    
    for business in businesses:
        if business.client_bot_token:
            print(f"[{business.name}] Registering client bot: @{business.client_bot_username}")
            set_bot_webhook(business.id, business.client_bot_token, "client", webhook_base)
        else:
            print(f"[{business.name}] No client bot token configured.")
            
        if business.master_bot_token:
            print(f"[{business.name}] Registering master bot: @{business.master_bot_username}")
            set_bot_webhook(business.id, business.master_bot_token, "master", webhook_base)
        else:
            print(f"[{business.name}] No master bot token configured.")

if __name__ == "__main__":
    main()
