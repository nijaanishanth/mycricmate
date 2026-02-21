from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from models import UserRole, AuthProvider, ApplicationStatus, InvitationStatus, SkillLevel, PlayingRole


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
    is_available: Optional[bool] = None


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


# Team Schemas
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    city: Optional[str] = None
    home_ground: Optional[str] = None
    established_date: Optional[date] = None
    logo_url: Optional[str] = None
    preferred_formats: List[str] = []
    max_players: int = 15


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    name: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    home_ground: Optional[str] = None
    logo_url: Optional[str] = None
    preferred_formats: Optional[List[str]] = None
    is_active: Optional[bool] = None
    max_players: Optional[int] = None


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    captain_id: UUID
    city: Optional[str] = None
    home_ground: Optional[str] = None
    established_date: Optional[date] = None
    logo_url: Optional[str] = None
    preferred_formats: Optional[List[str]] = None
    max_players: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Tournament Schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: str
    city: Optional[str] = None
    venue: Optional[str] = None
    start_date: date
    end_date: date
    registration_deadline: date
    max_teams: int
    entry_fee: int = 0
    prize_pool: int = 0
    logo_url: Optional[str] = None


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    max_teams: Optional[int] = None
    entry_fee: Optional[int] = None
    prize_pool: Optional[int] = None
    logo_url: Optional[str] = None
    is_published: Optional[bool] = None


class TournamentResponse(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organizer_id: UUID
    is_published: bool
    created_at: datetime
    updated_at: datetime


# Application Schemas
class TeamApplicationCreate(BaseModel):
    team_id: UUID
    message: Optional[str] = None


class TeamApplicationUpdate(BaseModel):
    status: ApplicationStatus


class TeamApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    team_id: UUID
    player_id: UUID
    status: str
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# Invitation Schemas
class TeamInvitationCreate(BaseModel):
    player_id: UUID
    message: Optional[str] = None


class TeamInvitationUpdate(BaseModel):
    status: InvitationStatus


class TeamInvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    team_id: UUID
    player_id: UUID
    invited_by: UUID
    status: str
    message: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    updated_at: datetime


# Player Profile Schema
class PlayerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    full_name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    playing_role: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    experience_years: Optional[int] = None
    preferred_formats: List[str] = []
    is_available: bool
    past_tournaments: List[dict] = []


class PlayerProfileUpdate(BaseModel):
    playing_role: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    experience_years: Optional[int] = None
    preferred_formats: Optional[List[str]] = None
    

class AvailabilityToggle(BaseModel):
    is_available: bool


class PlayerAvailabilityCreate(BaseModel):
    date: date
    is_available: bool = True
    notes: Optional[str] = None


class PlayerAvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    player_id: UUID
    date: date
    is_available: bool
    notes: Optional[str] = None
    created_at: datetime
