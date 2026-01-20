from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from models import UserRole, AuthProvider


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    roles: List[UserRole] = Field(default=[UserRole.PLAYER])


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleOAuthRequest(BaseModel):
    code: str
    redirect_uri: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    discovery_radius: Optional[int] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    avatar_url: Optional[str] = None
    roles: Optional[List[UserRole]] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    playing_role: Optional[str] = None
    experience_years: Optional[int] = None
    preferred_formats: Optional[List[str]] = None
    profile_visible: Optional[bool] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    discovery_radius: int
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    roles: List[str]
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    playing_role: Optional[str] = None
    experience_years: Optional[int] = None
    preferred_formats: List[str]
    auth_provider: str
    is_verified: bool
    is_active: bool
    profile_visible: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class UserOnboardingUpdate(BaseModel):
    roles: List[UserRole]
    city: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    discovery_radius: int = Field(default=25, ge=5, le=100)  # in miles
