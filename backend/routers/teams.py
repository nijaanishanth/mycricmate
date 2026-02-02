from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from database import get_db
from models import Team, PlayerRequirement, TeamTournamentParticipation, User, TeamApplication, TeamInvitation, InvitationStatus, ApplicationStatus
from schemas_team_recruitment import (
    PlayerRequirementCreate, 
    PlayerRequirementUpdate, 
    PlayerRequirementResponse,
    TeamTournamentParticipationCreate,
    TeamTournamentParticipationUpdate,
    TeamTournamentParticipationResponse,
    TeamProfileExtended,
    MarkSquadFullRequest
)
from schemas import TeamCreate, TeamUpdate, TeamResponse, TeamApplicationResponse, TeamInvitationCreate, TeamInvitationResponse
from auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team (Captain only)"""
    if "captain" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only captains can create teams"
        )
    
    db_team = Team(
        **team.model_dump(),
        captain_id=current_user.id
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@router.get("/{team_id}", response_model=TeamProfileExtended)
async def get_team_profile(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed team profile with requirements and tournament history"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get player requirements
    requirements = db.query(PlayerRequirement).filter(
        PlayerRequirement.team_id == team_id,
        PlayerRequirement.is_active == True
    ).all()
    
    # Get tournament participations
    participations = db.query(TeamTournamentParticipation).filter(
        TeamTournamentParticipation.team_id == team_id
    ).all()
    
    return {
        **team.__dict__,
        "player_requirements": requirements,
        "tournament_participations": participations
    }


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    team_update: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update team details (Captain only)"""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if db_team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can update team details"
        )
    
    for field, value in team_update.model_dump(exclude_unset=True).items():
        setattr(db_team, field, value)
    
    db.commit()
    db.refresh(db_team)
    return db_team


# Player Requirements Management
@router.post("/{team_id}/requirements", response_model=PlayerRequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_player_requirement(
    team_id: UUID,
    requirement: PlayerRequirementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post a player requirement (Captain only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can post requirements"
        )
    
    db_requirement = PlayerRequirement(
        **requirement.model_dump(),
        team_id=team_id
    )
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


@router.get("/{team_id}/requirements", response_model=List[PlayerRequirementResponse])
async def get_team_requirements(
    team_id: UUID,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all player requirements for a team"""
    query = db.query(PlayerRequirement).filter(PlayerRequirement.team_id == team_id)
    
    if active_only:
        query = query.filter(PlayerRequirement.is_active == True)
    
    return query.all()


@router.put("/requirements/{requirement_id}", response_model=PlayerRequirementResponse)
async def update_player_requirement(
    requirement_id: UUID,
    requirement_update: PlayerRequirementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a player requirement (Captain only)"""
    db_requirement = db.query(PlayerRequirement).filter(PlayerRequirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    team = db.query(Team).filter(Team.id == db_requirement.team_id).first()
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can update requirements"
        )
    
    for field, value in requirement_update.model_dump(exclude_unset=True).items():
        setattr(db_requirement, field, value)
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


@router.delete("/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player_requirement(
    requirement_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a player requirement (Captain only)"""
    db_requirement = db.query(PlayerRequirement).filter(PlayerRequirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    team = db.query(Team).filter(Team.id == db_requirement.team_id).first()
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can delete requirements"
        )
    
    db.delete(db_requirement)
    db.commit()


# Tournament Participation
@router.post("/{team_id}/tournaments", response_model=TeamTournamentParticipationResponse, status_code=status.HTTP_201_CREATED)
async def register_team_for_tournament(
    team_id: UUID,
    participation: TeamTournamentParticipationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register team for a tournament (Captain only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can register for tournaments"
        )
    
    # Check if already registered
    existing = db.query(TeamTournamentParticipation).filter(
        TeamTournamentParticipation.team_id == team_id,
        TeamTournamentParticipation.tournament_id == participation.tournament_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Team already registered for this tournament")
    
    db_participation = TeamTournamentParticipation(
        team_id=team_id,
        tournament_id=participation.tournament_id
    )
    db.add(db_participation)
    db.commit()
    db.refresh(db_participation)
    return db_participation


@router.get("/{team_id}/tournaments", response_model=List[TeamTournamentParticipationResponse])
async def get_team_tournaments(
    team_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all tournaments a team has participated in"""
    return db.query(TeamTournamentParticipation).filter(
        TeamTournamentParticipation.team_id == team_id
    ).all()


# Squad Management
@router.post("/{team_id}/mark-squad-full", response_model=TeamResponse)
async def mark_squad_full(
    team_id: UUID,
    request: MarkSquadFullRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark team squad as full or available (Captain only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can mark squad status"
        )
    
    team.is_squad_full = request.is_squad_full
    db.commit()
    db.refresh(team)
    return team


# Player Invitations
@router.post("/{team_id}/invite", response_model=TeamInvitationResponse, status_code=status.HTTP_201_CREATED)
async def invite_player_to_team(
    team_id: UUID,
    invitation: TeamInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a player to join the team (Captain only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can invite players"
        )
    
    if team.is_squad_full:
        raise HTTPException(status_code=400, detail="Team squad is full")
    
    # Check if player exists
    player = db.query(User).filter(User.id == invitation.player_id).first()
    if not player or "player" not in player.roles:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check for existing pending invitation
    existing = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id,
        TeamInvitation.player_id == invitation.player_id,
        TeamInvitation.status == InvitationStatus.PENDING
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Player already has a pending invitation")
    
    db_invitation = TeamInvitation(
        team_id=team_id,
        player_id=invitation.player_id,
        invited_by=current_user.id,
        message=invitation.message,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation


# Application Management
@router.get("/{team_id}/applications", response_model=List[TeamApplicationResponse])
async def get_team_applications(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all applications to the team (Captain only)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can view applications"
        )
    
    return db.query(TeamApplication).filter(TeamApplication.team_id == team_id).all()


@router.post("/applications/{application_id}/approve", response_model=TeamApplicationResponse)
async def approve_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a player application (Captain only)"""
    application = db.query(TeamApplication).filter(TeamApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    team = db.query(Team).filter(Team.id == application.team_id).first()
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can approve applications"
        )
    
    if team.is_squad_full:
        raise HTTPException(status_code=400, detail="Team squad is full")
    
    application.status = ApplicationStatus.ACCEPTED
    team.current_player_count += 1
    
    # Auto-mark squad as full if max reached
    if team.current_player_count >= team.max_players:
        team.is_squad_full = True
    
    db.commit()
    db.refresh(application)
    return application


@router.post("/applications/{application_id}/reject", response_model=TeamApplicationResponse)
async def reject_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a player application (Captain only)"""
    application = db.query(TeamApplication).filter(TeamApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    team = db.query(Team).filter(Team.id == application.team_id).first()
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team captain can reject applications"
        )
    
    application.status = ApplicationStatus.REJECTED
    db.commit()
    db.refresh(application)
    return application
