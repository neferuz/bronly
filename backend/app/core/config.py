from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Bronly Backend"
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
        "http://127.0.0.1:3005",
        "http://127.0.0.1:5173",
    ]

    
    # Database URL
    DATABASE_URL: str = "sqlite:///./bronly.db"
    
    # JWT Settings
    SECRET_KEY: str = "supersecretsecuritykeyforbronlyapp2026!!!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Super Admin and Telegram Bot settings
    SUPER_ADMIN_API_KEY: str = "bronly-hq-secret-2026"
    TELEGRAM_WEBHOOK_BASE_URL: str = ""
    CLIENT_MINIAPP_URL: str = "http://localhost:3002"
    MASTER_MINIAPP_URL: str = "http://localhost:3001"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
