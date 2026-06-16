import sys
import os
import uuid
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.business import Business
from app.models.master import Master
from app.models.booking import Booking
from app.models.service import Service, master_services
from app.models.review import Review

def seed_m19():
    db = SessionLocal()
    
    business_id = "15fa1770-6964-4141-bbfa-377e2fab846e"
    print(f"Targeting business {business_id} (M19)...")
    
    # Verify business exists
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        print("Error: Business M19 not found!")
        db.close()
        return

    # Clear existing reviews, bookings, masters, and services for this business
    print("Clearing existing data for M19...")
    db.query(Review).filter(Review.business_id == business_id).delete()
    db.query(Booking).filter(Booking.business_id == business_id).delete()
    
    # Delete association rows in master_services for this business's masters
    master_ids = [m.id for m in db.query(Master).filter(Master.business_id == business_id).all()]
    if master_ids:
        db.execute(master_services.delete().where(master_services.c.master_id.in_(master_ids)))
        
    db.query(Master).filter(Master.business_id == business_id).delete()
    db.query(Service).filter(Service.business_id == business_id).delete()
    db.commit()

    # Update Business Settings
    default_schedule = json.dumps([
        { "dayName": "Понедельник", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Вторник", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Среда", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Четверг", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Пятница", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Суббота", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Воскресенье", "isOpen": True, "openTime": "10:00", "closeTime": "20:00" }
    ], ensure_ascii=False)

    business.logo = "https://images.unsplash.com/photo-1621605815971-fbc98d665571?w=600&auto=format&fit=crop&q=80"
    business.cover_image = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"
    business.description = "Современный барбершоп M19 в Ташкенте. Профессиональные стрижки, оформление бороды и качественный уход."
    business.phone = "+998 90 999-19-19"
    business.address = "г. Ташкент, пр. Амира Темура, 19"
    business.primary_color = "#f59e0b"
    business.instagram = "m19_barbershop"
    business.telegram = "m19_barber"
    business.schedule = default_schedule
    
    db.add(business)
    db.commit()
    print("Business settings updated.")

    # Create Services
    services_data = [
        {
            "id": "m19_s1",
            "name": "Мужская стрижка",
            "category": "Стрижки",
            "price": 130000,
            "duration": 45,
            "description": "Стрижка любой сложности от классики до креатива. Включает мытье головы премиум-шампунем и укладку профессиональными средствами.",
            "image": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "m19_s2",
            "name": "Моделирование бороды",
            "category": "Борода",
            "price": 90000,
            "duration": 30,
            "description": "Создание формы бороды с учетом геометрии лица. Распаривание, бритье опасной бритвой, уход с использованием премиального масла.",
            "image": "https://images.unsplash.com/photo-1621605815971-fbc98d665571?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "m19_s3",
            "name": "Комплекс Стрижка + Борода",
            "category": "Комбо",
            "price": 200000,
            "duration": 75,
            "description": "Полный комплекс по уходу за волосами и бородой. Идеальный выбор для тех, кто ценит свое время и стиль.",
            "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "m19_s4",
            "name": "Детская стрижка (до 12 лет)",
            "category": "Стрижки",
            "price": 100000,
            "duration": 30,
            "description": "Быстро, аккуратно и с улыбкой. Стрижка для юных джентльменов в комфортной атмосфере.",
            "image": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "m19_s5",
            "name": "Удаление волос воском",
            "category": "Уход",
            "price": 40000,
            "duration": 15,
            "description": "Удаление нежелательных волос в зоне носа, ушей и бровей горячим воском.",
            "image": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80"
        }
    ]

    services = {}
    for sd in services_data:
        service = Service(
            id=sd["id"],
            business_id=business_id,
            name=sd["name"],
            category=sd["category"],
            price=sd["price"],
            duration=sd["duration"],
            description=sd["description"],
            image=sd["image"],
            is_active=True
        )
        db.add(service)
        services[sd["id"]] = service
    db.commit()
    print("Services seeded.")

    # Create Masters
    masters_data = [
        {
            "id": "m19_m1",
            "name": "Артур Каримов",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
            "phone": "+998 90 111-22-33",
            "rating": 4.9,
            "description": "Топ-мастер. Опыт работы более 6 лет. Специализируется на классических и современных стрижках, а также королевском бритье.",
            "services": ["m19_s1", "m19_s2", "m19_s3", "m19_s5"]
        },
        {
            "id": "m19_m2",
            "name": "Рустам Алиев",
            "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
            "phone": "+998 90 444-55-66",
            "rating": 4.8,
            "description": "Барбер-стилист. Эксперт в области моделирования бороды и усов. Поможет подобрать индивидуальный уход и косметику.",
            "services": ["m19_s1", "m19_s2", "m19_s3"]
        },
        {
            "id": "m19_m3",
            "name": "Сардор Мирзаев",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            "phone": "+998 90 777-88-99",
            "rating": 4.7,
            "description": "Младший барбер. Аккуратный, внимательный к деталям. Отлично делает детские стрижки и классический фейд.",
            "services": ["m19_s1", "m19_s4", "m19_s5"]
        }
    ]

    for md in masters_data:
        master = Master(
            id=md["id"],
            business_id=business_id,
            name=md["name"],
            avatar=md["avatar"],
            phone=md["phone"],
            rating=md["rating"],
            description=md["description"],
            is_active=True
        )
        master.services = [services[sid] for sid in md["services"]]
        db.add(master)
    db.commit()
    print("Masters seeded.")

    # Create Bookings and Reviews
    bookings_reviews = [
        {
            "client_name": "Дмитрий",
            "client_phone": "+998 90 123-45-01",
            "master_id": "m19_m1",
            "service_name": "Мужская стрижка",
            "price": 130000,
            "date": "2026-06-14",
            "time": "12:00",
            "rating": 5,
            "comment": "Отличная стрижка! Артур настоящий профессионал своего дела, теперь буду ходить только к нему."
        },
        {
            "client_name": "Шерзод",
            "client_phone": "+998 93 123-45-02",
            "master_id": "m19_m2",
            "service_name": "Моделирование бороды",
            "price": 90000,
            "date": "2026-06-15",
            "time": "15:30",
            "rating": 5,
            "comment": "Очень круто оформили бороду! Рустам мастерски владеет опасной бритвой, отличный сервис и чай."
        },
        {
            "client_name": "Мария (мама Тимура)",
            "client_phone": "+998 94 123-45-03",
            "master_id": "m19_m3",
            "service_name": "Детская стрижка (до 12 лет)",
            "price": 100000,
            "date": "2026-06-16",
            "time": "11:00",
            "rating": 5,
            "comment": "Сардор отлично постриг сына. Ребенок в восторге, сидел спокойно. Огромное спасибо за подход к детям!"
        },
        {
            "client_name": "Владислав",
            "client_phone": "+998 95 123-45-04",
            "master_id": "m19_m1",
            "service_name": "Комплекс Стрижка + Борода",
            "price": 200000,
            "date": "2026-06-16",
            "time": "17:00",
            "rating": 4,
            "comment": "Хороший салон, качественная работа. Стрижка отличная, бороду сделали аккуратно. Немного задержали начало сеанса, но результат того стоил."
        }
    ]

    for item in bookings_reviews:
        booking_id = str(uuid.uuid4())
        booking = Booking(
            id=booking_id,
            business_id=business_id,
            master_id=item["master_id"],
            client_name=item["client_name"],
            client_phone=item["client_phone"],
            date=item["date"],
            time=item["time"],
            service_name=item["service_name"],
            duration=45,
            price=item["price"],
            status="completed"
        )
        db.add(booking)
        db.commit()
        
        review_id = str(uuid.uuid4())
        review = Review(
            id=review_id,
            booking_id=booking_id,
            master_id=item["master_id"],
            business_id=business_id,
            rating=item["rating"],
            comment=item["comment"],
            reply_comment=None,
            created_at=datetime.now(timezone.utc)
        )
        db.add(review)
        db.commit()
        
    print("Bookings and reviews seeded.")
    
    # Recalculate average rating of the business based on reviews
    avg_rating = db.query(Review.rating).filter(Review.business_id == business_id).all()
    if avg_rating:
        ratings = [r[0] for r in avg_rating]
        business.rating = round(sum(ratings) / len(ratings), 1)
        db.add(business)
        db.commit()
        print(f"Recalculated business rating: {business.rating}")
        
    db.close()
    print("Seeding of M19 completed successfully!")

if __name__ == "__main__":
    seed_m19()
