from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from models import SkillLevel, PlayingRole


# Player Requirement Schemas
class PlayerRequirementCreate(BaseModel):
    required_role: PlayingRole
    skill_level: Optional[SkillLevel] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    preferred_formats: List[str] = []
    availability_start_date: Optional[date] = None
    availability_end_date: Optional[date] = None
    positions_available: int = 1
    description: Optional[str] = None


class PlayerRequirementUpdate(BaseModel):
    required_role: Optional[PlayingRole] = None
    skill_level: Optional[SkillLevel] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    preferred_formats: Optional[List[str]] = None
    availability_start_date: Optional[date] = None
    availability_end_date: Optional[date] = None
    positions_available: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PlayerRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    team_id: UUID
    required_role: str
    skill_level: Optional[str] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    preferred_formats: List[str] = []
    availability_start_date: Optional[date] = None
    availability_end_date: Optional[date] = None
    positions_available: int
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Team Tournament Participation Schemas
class TeamTournamentParticipationCreate(BaseModel):
    tournament_id: UUID


class TeamTournamentParticipationUpdate(BaseModel):
    placement: Optional[int] = None
    is_confirmed: Optional[bool] = None


class TeamTournamentParticipationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    team_id: UUID
    tournament_id: UUID
    placement: Optional[int] = None
    registration_date: datetime
    is_confirmed: bool
    created_at: datetime
    updated_at: datetime


# Team Profile Extended Schema
class TeamProfileExtended(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    captain_id: UUID
    city: Optional[str] = None
    home_ground: Optional[str] = None
    established_date: Optional[date] = None
    logo_url: Optional[str] = None
    preferred_formats: List[str] = []
    is_active: bool
    max_players: int
    current_player_count: int
    is_squad_full: bool
    player_requirements: List[PlayerRequirementResponse] = []
    tournament_participations: List[TeamTournamentParticipationResponse] = []
    created_at: datetime
    updated_at: datetime


# Team Squad Management
class MarkSquadFullRequest(BaseModel):
    is_squad_full: bool
