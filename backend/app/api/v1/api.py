from fastapi import APIRouter
from app.api.v1.endpoints import auth, business, masters, bookings, services, public, super_admin, telegram

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(business.router, prefix="/businesses", tags=["businesses"])
api_router.include_router(masters.router, prefix="/masters", tags=["masters"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])


