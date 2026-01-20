from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Database
    database_url: str
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    
    # Application
    app_name: str = "MyCricMate"
    frontend_url: str = "http://localhost:8080"
    backend_url: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
