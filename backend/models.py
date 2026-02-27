from sqlalchemy import Column, String, DateTime, Boolean, Integer, Enum as SQLEnum, ARRAY, ForeignKey, Text, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PROFESSIONAL = "professional"


class PlayingRole(str, enum.Enum):
    BATSMAN = "batsman"
    BOWLER = "bowler"
    ALL_ROUNDER = "all-rounder"
    WICKET_KEEPER = "wicket-keeper"


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
    is_available = Column(Boolean, default=True)  # Player availability toggle
    # Weekly schedule: { "monday": ["morning","afternoon"], "tuesday": ["evening"], ... }
    weekly_availability = Column(JSON, nullable=True, default=None)
    
    # Authentication
    auth_provider = Column(SQLEnum(AuthProvider), default=AuthProvider.EMAIL)
    provider_id = Column(String, nullable=True)  # OAuth provider user ID
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)  # Platform admin / owner
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


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    captain_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    city = Column(String, nullable=True)
    home_ground = Column(String, nullable=True)
    established_date = Column(Date, nullable=True)
    logo_url = Column(String, nullable=True)
    preferred_formats = Column(ARRAY(String), default=[])
    is_active = Column(Boolean, default=True)
    max_players = Column(Integer, default=15)
    current_player_count = Column(Integer, default=0)
    is_squad_full = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Team {self.name}>"


class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    organizer_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    format = Column(String, nullable=False)  # T20, T10, ODI, etc.
    city = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_deadline = Column(Date, nullable=False)
    max_teams = Column(Integer, nullable=False)
    entry_fee = Column(Integer, default=0)
    prize_pool = Column(Integer, default=0)
    logo_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Tournament {self.name}>"


class TeamApplication(Base):
    __tablename__ = "team_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=False)
    player_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<TeamApplication player={self.player_id} team={self.team_id}>"


class TeamInvitation(Base):
    __tablename__ = "team_invitations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=False)
    player_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING)
    message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<TeamInvitation player={self.player_id} team={self.team_id}>"


class PlayerTournament(Base):
    """Track tournaments a player has participated in"""
    __tablename__ = "player_tournaments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey('tournaments.id'), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=True)
    placement = Column(Integer, nullable=True)  # 1st, 2nd, 3rd, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<PlayerTournament player={self.player_id} tournament={self.tournament_id}>"


class PlayerAvailability(Base):
    """Track player availability for specific dates"""
    __tablename__ = "player_availability"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False)
    is_available = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PlayerAvailability player={self.player_id} date={self.date}>"


class PlayerRequirement(Base):
    """Team's player recruitment requirements"""
    __tablename__ = "player_requirements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=False)
    required_role = Column(SQLEnum(PlayingRole), nullable=False)
    skill_level = Column(SQLEnum(SkillLevel), nullable=True)
    min_experience_years = Column(Integer, nullable=True)
    max_experience_years = Column(Integer, nullable=True)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    preferred_formats = Column(ARRAY(String), default=[])
    availability_start_date = Column(Date, nullable=True)
    availability_end_date = Column(Date, nullable=True)
    positions_available = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PlayerRequirement team={self.team_id} role={self.required_role}>"


class TeamTournamentParticipation(Base):
    """Track tournaments a team has participated in"""
    __tablename__ = "team_tournament_participations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=False)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey('tournaments.id'), nullable=False)
    placement = Column(Integer, nullable=True)  # 1st, 2nd, 3rd, etc.
    registration_date = Column(DateTime, default=datetime.utcnow)
    is_confirmed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<TeamTournamentParticipation team={self.team_id} tournament={self.tournament_id}>"


class Conversation(Base):
    """A direct-message thread between exactly two users."""
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The two participants — always store with user_a_id < user_b_id (string compare) for uniqueness
    user_a_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    user_b_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")

    def __repr__(self):
        return f"<Conversation {self.user_a_id} <-> {self.user_b_id}>"


class Message(Base):
    """A single chat message in a conversation."""
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id'), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message sender={self.sender_id} conv={self.conversation_id}>"
