import sys
import os
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "/Users/apple/Desktop/bronly/backend")

import app.models.base
import app.models.business
import app.models.master
import app.models.service
import app.models.booking
import app.models.review
from app.core.database import SessionLocal
from app.models.booking import Booking
from app.models.review import Review

db = SessionLocal()

# List of mock reviews to add
mock_data = [
    {
        "booking_id": "mock_b_1",
        "master_id": "m1",
        "client_name": "Сергей Воронов",
        "client_phone": "+998901112233",
        "service": "Мужская стрижка",
        "price": 120000,
        "rating": 5,
        "comment": "Алексей — лучший мастер в Ташкенте! Делаю стрижку и форму бороды только у него.",
        "days_ago": 1
    },
    {
        "booking_id": "mock_b_2",
        "master_id": "m2",
        "client_name": "Дмитрий Ким",
        "client_phone": "+998904445566",
        "service": "Моделирование бороды",
        "price": 80000,
        "rating": 4,
        "comment": "Отличный сервис, Тимур очень аккуратный. Немного задержали начало сеанса, но результат супер.",
        "days_ago": 2
    },
    {
        "booking_id": "mock_b_3",
        "master_id": "m3",
        "client_name": "Сардор Рахимов",
        "client_phone": "+998907778899",
        "service": "Стрижка + Борода",
        "price": 180000,
        "rating": 5,
        "comment": "Иван профи своего дела, рекомендую! Очень классная атмосфера в салоне.",
        "days_ago": 3
    },
    {
        "booking_id": "mock_b_4",
        "master_id": "m4",
        "client_name": "Марат Ахмедов",
        "client_phone": "+998903332211",
        "service": "Мужская стрижка",
        "price": 120000,
        "rating": 3,
        "comment": "Стрижка нормальная, но мастер был немного неразговорчив. В целом ок.",
        "days_ago": 4
    },
    {
        "booking_id": "mock_b_5",
        "master_id": "m1",
        "client_name": "Алишер Усманов",
        "client_phone": "+998909998877",
        "service": "Детская стрижка",
        "price": 100000,
        "rating": 5,
        "comment": "Быстро, стильно, профессионально. Сын остался в восторге от нового образа!",
        "days_ago": 5
    },
    {
        "booking_id": "mock_b_6",
        "master_id": "m2",
        "client_name": "Владимир Ли",
        "client_phone": "+998905556677",
        "service": "Мужская стрижка",
        "price": 120000,
        "rating": 5,
        "comment": "Тимур суперски сделал фейд, переходы плавные, обязательно вернусь.",
        "days_ago": 6
    },
    {
        "booking_id": "mock_b_7",
        "master_id": "m3",
        "client_name": "Константин",
        "client_phone": "+998902221100",
        "service": "Королевское бритье",
        "price": 90000,
        "rating": 4,
        "comment": "Все понравилось, вежливый персонал, качественная косметика. Лицо после бритья как у младенца.",
        "days_ago": 7
    },
    {
        "booking_id": "mock_b_8",
        "master_id": "m4",
        "client_name": "Рустам",
        "client_phone": "+998904443322",
        "service": "Мужская стрижка",
        "price": 120000,
        "rating": 5,
        "comment": "Данияр отлично постриг, дал полезные советы по укладке и выбору воска.",
        "days_ago": 8
    },
    {
        "booking_id": "mock_b_9",
        "master_id": "m2",
        "client_name": "Фарход",
        "client_phone": "+998908889900",
        "service": "Стрижка + Борода",
        "price": 180000,
        "rating": 2,
        "comment": "Не совсем то, что просил. Слишком коротко снял с боков, хотя я просил оставить длину.",
        "days_ago": 9
    }
]

created_bookings = 0
created_reviews = 0

for item in mock_data:
    # 1. Create booking if not exists
    existing_booking = db.query(Booking).filter(Booking.id == item["booking_id"]).first()
    if not existing_booking:
        b_date = (datetime.now(timezone.utc) - timedelta(days=item["days_ago"])).strftime("%Y-%m-%d")
        new_booking = Booking(
            id=item["booking_id"],
            business_id="b1",
            master_id=item["master_id"],
            client_name=item["client_name"],
            client_phone=item["client_phone"],
            client_telegram_id=None,
            date=b_date,
            time="12:00",
            service_name=item["service"],
            duration=45,
            price=item["price"],
            status="completed"
        )
        db.add(new_booking)
        created_bookings += 1
        
    # 2. Create review if not exists
    existing_review = db.query(Review).filter(Review.booking_id == item["booking_id"]).first()
    if not existing_review:
        r_date = datetime.now(timezone.utc) - timedelta(days=item["days_ago"])
        new_review = Review(
            id=str(uuid.uuid4()),
            booking_id=item["booking_id"],
            master_id=item["master_id"],
            business_id="b1",
            rating=item["rating"],
            comment=item["comment"],
            created_at=r_date
        )
        db.add(new_review)
        created_reviews += 1

db.commit()
db.close()

print(f"Done! Created {created_bookings} bookings and {created_reviews} reviews.")
