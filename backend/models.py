from sqlalchemy import Column, String, DateTime, Boolean, Integer, Enum as SQLEnum, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from database import Base


class UserRole(str, enum.Enum):
    PLAYER = "player"
    CAPTAIN = "captain"
    ORGANIZER = "organizer"
    STAFF = "staff"


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    
    # Profile fields
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    discovery_radius = Column(Integer, default=25)  # in miles
    latitude = Column(String, nullable=True)  # For precise location
    longitude = Column(String, nullable=True)  # For precise location
    
    # User roles - can have multiple
    roles = Column(ARRAY(SQLEnum(UserRole)), default=[])
    
    # Player specific
    batting_style = Column(String, nullable=True)
    bowling_style = Column(String, nullable=True)
    playing_role = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    preferred_formats = Column(ARRAY(String), default=[])
    
    # Authentication
    auth_provider = Column(SQLEnum(AuthProvider), default=AuthProvider.EMAIL)
    provider_id = Column(String, nullable=True)  # OAuth provider user ID
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    profile_visible = Column(Boolean, default=True)  # Control visibility in feeds
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<RefreshToken {self.token[:10]}...>"
