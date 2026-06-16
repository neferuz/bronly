import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.business import Business
from app.models.master import Master
from app.models.booking import Booking
from app.models.service import Service, master_services
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    # Delete existing data to ensure a clean state
    print("Clearing database...")
    db.query(Booking).delete()
    db.query(Master).delete()
    db.query(Service).delete()
    db.execute(master_services.delete())
    db.query(Business).delete()
    db.commit()


    print("Seeding database...")
    
    import json
    default_schedule = json.dumps([
        { "dayName": "Понедельник", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Вторник", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Среда", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Четверг", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Пятница", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Суббота", "isOpen": True, "openTime": "10:00", "closeTime": "22:00" },
        { "dayName": "Воскресенье", "isOpen": False, "openTime": "10:00", "closeTime": "18:00" }
    ], ensure_ascii=False)

    # 1. Create Business (Elite Barber)
    business = Business(
        id="b1",
        name="Elite Barber",
        owner_name="Administrator",
        owner_email="elite@bronly.uz",
        hashed_password=get_password_hash("123456"),
        plain_password="123456",
        logo="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80",
        address="г. Ташкент, ул. Амира Темура, 45",
        phone="+998 90 123-45-67",
        rating=4.8,
        plan="free",
        is_active=True,
        commission_rate=40.0,
        description="Премиум стрижки, бритьё и профессиональный уход в Ташкенте.",
        instagram="elite_barbershop_tash",
        telegram="elite_barber_tash",
        cover_image="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
        primary_color="#ff5a1f",
        currency="сум",
        timezone="Asia/Tashkent (GMT+5)",
        min_buffer_hours=2,
        max_booking_days=30,
        schedule=default_schedule
    )
    db.add(business)
    db.commit()
    
    # 2. Create Services
    services = {
        "s1": Service(id="s1", business_id="b1", name="Мужская стрижка", category="Стрижки", price=120000, duration=45, description="Классическая или модельная стрижка ножницами и машинкой, мытье головы и укладка.", image="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80", is_active=True),
        "s2": Service(id="s2", business_id="b1", name="Стрижка бороды", category="Борода", price=80000, duration=30, description="Оформление бороды и усов, коррекция формы, бритье триммером и шейвером.", image="https://images.unsplash.com/photo-1621605815971-fbc98d665571?w=600&auto=format&fit=crop&q=80", is_active=True),
        "s3": Service(id="s3", business_id="b1", name="Стрижка + Борода", category="Комбо", price=180000, duration=75, description="Комплексный уход: стрижка волос и оформление бороды со скидкой.", image="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80", is_active=True),
        "s4": Service(id="s4", business_id="b1", name="Детская стрижка", category="Стрижки", price=90000, duration=30, description="Стрижка для детей до 12 лет в игровой или дружелюбной атмосфере.", image="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop&q=80", is_active=True),
        "s5": Service(id="s5", business_id="b1", name="Камуфляж седины", category="Уход", price=100000, duration=30, description="Естественное тонирование седины на голове или бороде.", image="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80", is_active=True),
    }
    for service in services.values():
        db.add(service)
    db.commit()
    
    # 3. Create Masters and associate services
    masters = {
        "m1": Master(id="m1", business_id="b1", name="Алексей Смирнов", avatar="АС", phone="+998 90 123-45-67", rating=4.9, is_active=True, description="Топ-барбер. Специалист по сложным стрижкам и моделированию бороды. Опыт более 5 лет."),
        "m2": Master(id="m2", business_id="b1", name="Тимур Мансуров", avatar="ТМ", phone="+998 93 987-65-43", rating=4.8, is_active=True, description="Мастер современных стрижек и детского стиля. Найдет подход к любому клиенту."),
        "m3": Master(id="m3", business_id="b1", name="Иван Петров", avatar="ИП", phone="+998 94 444-55-66", rating=4.7, is_active=True, description="Эксперт по классическому бритью, уходу за лицом и моделированию усов."),
        "m4": Master(id="m4", business_id="b1", name="Данияр Алиев", avatar="ДА", phone="+998 97 111-22-33", rating=4.5, is_active=False, description="Профессиональный колорист и стилист по укладкам."),
    }
    
    masters["m1"].services = [services["s1"], services["s2"], services["s3"], services["s5"]]
    masters["m2"].services = [services["s1"], services["s3"], services["s4"]]
    masters["m3"].services = [services["s1"], services["s2"], services["s3"]]
    masters["m4"].services = [services["s2"], services["s5"]]
    
    for master in masters.values():
        db.add(master)
    db.commit()
        
    # 4. Create Bookings (Skip seeding mock bookings for a clean database)
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
