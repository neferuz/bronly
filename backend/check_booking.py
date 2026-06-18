from app.core.database import SessionLocal
from app.models.business import Business
from app.models.master import Master
from app.models.booking import Booking
db = SessionLocal()
b = db.query(Booking).first()
if b:
    print(f"Booking ID: {b.id}")
    print(f"Business: {b.business.name if b.business else None}, master_bot_token: {bool(b.business.master_bot_token) if b.business else False}")
    print(f"Master: {b.master.name if b.master else None}, telegram_id: {b.master.telegram_id if b.master else None}")
else:
    print("No bookings found")
