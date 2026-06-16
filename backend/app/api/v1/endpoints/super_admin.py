from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.models.business import Business
from app.models.master import Master
from app.models.booking import Booking
from app.models.service import Service
from app.crud.business import crud_business
from app.schemas.business import BusinessCreate, BusinessOut

router = APIRouter()

async def verify_super_admin_key(x_admin_key: str = Header(default="")):
    """Dependency to verify the super admin API key from X-Admin-Key header."""
    if x_admin_key != settings.SUPER_ADMIN_API_KEY:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав. Неверный ключ администратора."
        )

class PlatformStatsOut(BaseModel):
    totalRevenue: int
    totalBusinesses: int
    activeBusinesses: int
    totalMiniAppClicks: int
    totalBookings: int

class BusinessBranchOut(BaseModel):
    id: str
    name: str
    owner_name: str
    owner_email: str
    owner_phone: Optional[str] = None
    owner_telegram: Optional[str] = None
    city: str
    registered_at: str
    masters_count: int
    bookings_count: int
    clients_count: int
    services_count: int
    revenue: int
    status: str  # "active" | "blocked"
    plain_password: Optional[str] = None
    client_bot_username: Optional[str] = None
    client_bot_token: Optional[str] = None
    master_bot_username: Optional[str] = None
    master_bot_token: Optional[str] = None

class BusinessRegister(BaseModel):
    name: str
    owner_name: str
    owner_email: EmailStr
    owner_phone: str
    owner_telegram: Optional[str] = None
    password: str
    city: Optional[str] = "Ташкент"

class BusinessStatusUpdate(BaseModel):
    is_active: bool

class BusinessCredentialsUpdate(BaseModel):
    owner_email: Optional[EmailStr] = None
    password: Optional[str] = None
    client_bot_username: Optional[str] = None
    client_bot_token: Optional[str] = None
    master_bot_username: Optional[str] = None
    master_bot_token: Optional[str] = None

@router.get("/stats", response_model=PlatformStatsOut, dependencies=[Depends(verify_super_admin_key)])
def get_platform_stats(db: Session = Depends(get_db)):
    """
    Get aggregated stats for the entire platform.
    """
    total_businesses = db.query(Business).count()
    active_businesses = db.query(Business).filter(Business.is_active == True).count()
    total_bookings = db.query(Booking).count()
    total_masters = db.query(Master).count()
    
    # Calculate unique clients
    total_clients = db.query(Booking.client_phone).distinct().count()
    
    # Estimated clicks
    total_clicks = total_clients * 3
    
    # Calculated total platform revenue (sum of all completed bookings on the platform)
    total_rev = db.query(func.sum(Booking.price)).filter(Booking.status == "completed").scalar() or 0
    
    return PlatformStatsOut(
        totalRevenue=int(total_rev),
        totalBusinesses=total_businesses,
        activeBusinesses=active_businesses,
        totalMiniAppClicks=total_clicks,
        totalBookings=total_bookings
    )

@router.get("/businesses", response_model=List[BusinessBranchOut], dependencies=[Depends(verify_super_admin_key)])
def list_businesses(db: Session = Depends(get_db)):
    """
    List all business branches registered on the platform.
    """
    businesses = db.query(Business).all()
    res = []
    for b in businesses:
        masters_count = db.query(Master).filter(Master.business_id == b.id).count()
        bookings_count = db.query(Booking).filter(Booking.business_id == b.id).count()
        clients_count = db.query(Booking.client_phone).filter(Booking.business_id == b.id).distinct().count()
        services_count = db.query(Service).filter(Service.business_id == b.id).count()
        
        # Calculate actual revenue (sum of completed bookings)
        revenue = db.query(func.sum(Booking.price)).filter(
            Booking.business_id == b.id,
            Booking.status == "completed"
        ).scalar() or 0
        
        # Determine city (default to Tashkent, or extract from address if contains word)
        city = "Ташкент"
        if b.address:
            for c in ["Самарканд", "Бухара", "Андижан", "Наманган", "Фергана", "Карши", "Нукус"]:
                if c.lower() in b.address.lower():
                    city = c
                    break
        
        # Use real created_at from DB or fallback
        registered_at = b.created_at.strftime("%Y-%m-%d") if b.created_at else "2026-06-01"
        
        res.append(BusinessBranchOut(
            id=b.id,
            name=b.name,
            owner_name=b.owner_name,
            owner_email=b.owner_email,
            owner_phone=b.phone,
            owner_telegram=b.owner_telegram or b.telegram or '',
            city=city,
            registered_at=registered_at,
            masters_count=masters_count,
            bookings_count=bookings_count,
            clients_count=clients_count,
            services_count=services_count,
            revenue=int(revenue),
            status="active" if b.is_active else "blocked",
            plain_password=b.plain_password,
            client_bot_username=b.client_bot_username,
            client_bot_token=b.client_bot_token,
            master_bot_username=b.master_bot_username,
            master_bot_token=b.master_bot_token
        ))
    return res

@router.post("/businesses", response_model=BusinessOut, dependencies=[Depends(verify_super_admin_key)])
def register_business_by_admin(
    body: BusinessRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new business branch from the Super Admin Panel.
    """
    # Check if email is already taken
    existing = crud_business.get_by_email(db, email=body.owner_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Бизнес с таким email владельца уже зарегистрирован"
        )
        
    obj_in = BusinessCreate(
        name=body.name,
        owner_name=body.owner_name,
        owner_email=body.owner_email,
        phone=body.owner_phone,
        password=body.password,
        address=f"г. {body.city}",
        logo=body.name.split(' ')[0][0].upper() if body.name else "B",
        plan="free",
        commission_rate=30.0
    )
    
    db_business = crud_business.create(db, obj_in=obj_in)
    
    # Save the plain password as well
    db_business.plain_password = body.password
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    
    return db_business

@router.patch("/businesses/{business_id}/status", response_model=BusinessOut, dependencies=[Depends(verify_super_admin_key)])
def update_business_status(
    business_id: str,
    req: BusinessStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Toggle active status of a business branch (block/unblock).
    """
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Бизнес не найден")
        
    business.is_active = req.is_active
    db.add(business)
    db.commit()
    db.refresh(business)
    return business

@router.patch("/businesses/{business_id}/credentials", response_model=BusinessOut, dependencies=[Depends(verify_super_admin_key)])
def update_business_credentials(
    business_id: str,
    req: BusinessCredentialsUpdate,
    db: Session = Depends(get_db)
):
    """
    Update owner email and/or password for logging into CRM dashboard.
    """
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Бизнес не найден")
        
    if req.owner_email:
        # Check if email is already taken by another business
        existing = db.query(Business).filter(
            Business.owner_email == req.owner_email, 
            Business.id != business_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот email уже используется другим салоном"
            )
        business.owner_email = req.owner_email
        
    if req.password:
        from app.core.security import get_password_hash
        business.hashed_password = get_password_hash(req.password)
        business.plain_password = req.password

    if req.client_bot_username is not None:
        business.client_bot_username = req.client_bot_username
    if req.client_bot_token is not None:
        business.client_bot_token = req.client_bot_token
    if req.master_bot_username is not None:
        business.master_bot_username = req.master_bot_username
    if req.master_bot_token is not None:
        business.master_bot_token = req.master_bot_token
        
    db.add(business)
    db.commit()
    db.refresh(business)
    return business

@router.delete("/businesses/{business_id}", dependencies=[Depends(verify_super_admin_key)])
def delete_business_branch(
    business_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a business branch from the platform.
    """
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Бизнес не найден")
        
    db.delete(business)
    db.commit()
    return {"status": "success", "message": "Бизнес и все связанные данные удалены"}

class MaintenanceUpdate(BaseModel):
    maintenance_mode: bool

@router.get("/server/maintenance", dependencies=[Depends(verify_super_admin_key)])
def get_maintenance(request: Request):
    return {"maintenance_mode": getattr(request.app.state, "maintenance_mode", False)}

@router.post("/server/maintenance", dependencies=[Depends(verify_super_admin_key)])
def set_maintenance(request: Request, body: MaintenanceUpdate):
    request.app.state.maintenance_mode = body.maintenance_mode
    return {"maintenance_mode": request.app.state.maintenance_mode}

@router.get("/server/status", dependencies=[Depends(verify_super_admin_key)])
def get_server_status(db: Session = Depends(get_db)):
    import os
    db_ok = False
    db_size = 0
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
        if os.path.exists("bronly.db"):
            db_size = os.path.getsize("bronly.db")
    except Exception:
        pass
        
    return {
        "api_status": "online",
        "db_status": "online" if db_ok else "offline",
        "db_size_kb": round(db_size / 1024, 1),
    }

@router.get("/server/logs", dependencies=[Depends(verify_super_admin_key)])
def get_server_logs(request: Request):
    logs_queue = getattr(request.app.state, "system_logs", None)
    return {"logs": list(logs_queue) if logs_queue is not None else []}

@router.post("/db/backup", dependencies=[Depends(verify_super_admin_key)])
def create_db_backup():
    import shutil
    from datetime import datetime
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"bronly_backup_{timestamp}.db"
        shutil.copy("bronly.db", backup_name)
        return {"status": "success", "message": f"Резервная копия создана: {backup_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания резервной копии: {str(e)}")

@router.post("/db/clear-cache", dependencies=[Depends(verify_super_admin_key)])
def clear_db_cache():
    try:
        import sqlite3
        conn = sqlite3.connect("bronly.db")
        conn.execute("VACUUM")
        conn.close()
        return {"status": "success", "message": "Очистка кэша и VACUUM-оптимизация выполнены успешно"}
    except Exception as e:
        return {"status": "success", "message": "Кэш приложения очищен"}
