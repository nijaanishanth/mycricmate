from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime, timedelta
from uuid import UUID

from database import get_db
from auth import get_current_user
from models import (
    User, Team, Tournament, TeamApplication, TeamInvitation, 
    PlayerTournament, PlayerAvailability, ApplicationStatus, InvitationStatus
)
from schemas import (
    UserResponse, TeamResponse, TournamentResponse,
    TeamApplicationCreate, TeamApplicationResponse, TeamApplicationUpdate,
    TeamInvitationResponse, TeamInvitationUpdate,
    AvailabilityToggle, WeeklyAvailabilityUpdate, PlayerAvailabilityCreate, PlayerAvailabilityResponse,
    PlayerProfileResponse, PlayerProfileUpdate,
    DiscoverPlayerCard, DiscoverTeamCard,
)

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/discover", response_model=List[DiscoverPlayerCard])
def discover_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return available players for captains to swipe on (excludes the caller)."""
    players = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active == True,
            User.profile_visible == True,
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        DiscoverPlayerCard(
            id=str(p.id),
            full_name=p.full_name or p.email,
            avatar_url=p.avatar_url,
            city=p.city,
            playing_role=p.playing_role,
            batting_style=p.batting_style,
            bowling_style=p.bowling_style,
            experience_years=p.experience_years,
            preferred_formats=list(p.preferred_formats or []),
            is_available=p.is_available,
        )
        for p in players
    ]


@router.get("/discover/teams", response_model=List[DiscoverTeamCard])
def discover_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return active teams for players to swipe on (excludes teams the caller captains)."""
    teams = (
        db.query(Team)
        .filter(
            Team.is_active == True,
            Team.is_squad_full == False,
            Team.captain_id != current_user.id,
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for t in teams:
        captain = db.query(User).filter(User.id == t.captain_id).first()
        result.append(
            DiscoverTeamCard(
                id=str(t.id),
                name=t.name,
                logo_url=t.logo_url,
                city=t.city,
                home_ground=t.home_ground,
                description=t.description,
                preferred_formats=list(t.preferred_formats or []),
                current_player_count=t.current_player_count or 0,
                max_players=t.max_players or 15,
                captain_name=captain.full_name if captain else None,
                captain_id=str(t.captain_id) if t.captain_id else None,
            )
        )
    return result


@router.get("/me/profile", response_model=PlayerProfileResponse)
def get_player_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current player's full profile including past tournaments"""
    # Get past tournaments
    past_tournaments = db.query(PlayerTournament).filter(
        PlayerTournament.player_id == current_user.id
    ).all()
    
    tournament_data = []
    for pt in past_tournaments:
        tournament = db.query(Tournament).filter(Tournament.id == pt.tournament_id).first()
        if tournament:
            tournament_data.append({
                "id": str(tournament.id),
                "name": tournament.name,
                "format": tournament.format,
                "placement": pt.placement,
                "date": tournament.start_date.isoformat()
            })
    
    profile_data = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "city": current_user.city,
        "playing_role": current_user.playing_role,
        "batting_style": current_user.batting_style,
        "bowling_style": current_user.bowling_style,
        "experience_years": current_user.experience_years,
        "preferred_formats": current_user.preferred_formats or [],
        "is_available": current_user.is_available,
        "past_tournaments": tournament_data
    }
    
    return profile_data


@router.put("/me/profile", response_model=PlayerProfileResponse)
def update_player_profile(
    profile_update: PlayerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current player's profile"""
    # Update the user fields
    for field, value in profile_update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    # Return the full profile
    return get_player_profile(current_user, db)


@router.post("/me/availability", response_model=dict)
def toggle_availability(
    availability: AvailabilityToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle player's general availability status"""
    current_user.is_available = availability.is_available
    db.commit()
    
    return {
        "message": f"Availability set to {'available' if availability.is_available else 'unavailable'}",
        "is_available": current_user.is_available
    }


@router.get("/me/availability/weekly", response_model=dict)
def get_weekly_availability(
    current_user: User = Depends(get_current_user),
):
    """Get the player's weekly availability schedule."""
    return {"schedule": current_user.weekly_availability or {}}


@router.put("/me/availability/weekly", response_model=dict)
def set_weekly_availability(
    payload: WeeklyAvailabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save the player's weekly availability schedule."""
    current_user.weekly_availability = payload.schedule
    # If any slots are set, mark the player as generally available
    has_slots = any(len(slots) > 0 for slots in payload.schedule.values())
    current_user.is_available = has_slots
    db.commit()
    return {
        "message": "Weekly availability updated",
        "schedule": current_user.weekly_availability,
        "is_available": current_user.is_available,
    }


@router.get("/me/availability", response_model=List[PlayerAvailabilityResponse])
def get_my_availability(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get player's availability calendar for date range"""
    from datetime import datetime
    
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    availabilities = db.query(PlayerAvailability).filter(
        and_(
            PlayerAvailability.player_id == current_user.id,
            PlayerAvailability.date >= start,
            PlayerAvailability.date <= end
        )
    ).all()
    
    return availabilities


@router.post("/me/availability/calendar", response_model=PlayerAvailabilityResponse)
def set_date_availability(
    availability: PlayerAvailabilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set availability for a specific date"""
    # Check if already exists
    existing = db.query(PlayerAvailability).filter(
        and_(
            PlayerAvailability.player_id == current_user.id,
            PlayerAvailability.date == availability.date
        )
    ).first()
    
    if existing:
        existing.is_available = availability.is_available
        existing.notes = availability.notes
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    new_availability = PlayerAvailability(
        player_id=current_user.id,
        date=availability.date,
        is_available=availability.is_available,
        notes=availability.notes
    )
    db.add(new_availability)
    db.commit()
    db.refresh(new_availability)
    
    return new_availability


@router.get("/tournaments/search", response_model=List[TournamentResponse])
def search_tournaments(
    city: str = Query(None, description="Filter by city"),
    format: str = Query(None, description="Filter by format (T20, ODI, etc.)"),
    upcoming: bool = Query(True, description="Show only upcoming tournaments"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search for tournaments"""
    query = db.query(Tournament).filter(Tournament.is_published == True)
    
    if upcoming:
        query = query.filter(Tournament.start_date >= datetime.utcnow().date())
    
    if city:
        query = query.filter(Tournament.city.ilike(f"%{city}%"))
    
    if format:
        query = query.filter(Tournament.format == format)
    
    tournaments = query.order_by(Tournament.start_date).all()
    return tournaments


@router.get("/teams/search", response_model=List[TeamResponse])
def search_teams(
    city: str = Query(None, description="Filter by city"),
    format: str = Query(None, description="Filter by preferred format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search for teams"""
    query = db.query(Team).filter(Team.is_active == True)
    
    if city:
        query = query.filter(Team.city.ilike(f"%{city}%"))
    
    if format:
        query = query.filter(Team.preferred_formats.contains([format]))
    
    teams = query.all()
    return teams


@router.post("/teams/{team_id}/apply", response_model=TeamApplicationResponse)
def apply_to_team(
    team_id: UUID,
    application: TeamApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply to join a team"""
    # Verify team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if already applied
    existing = db.query(TeamApplication).filter(
        and_(
            TeamApplication.team_id == team_id,
            TeamApplication.player_id == current_user.id,
            TeamApplication.status == ApplicationStatus.PENDING
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this team")
    
    new_application = TeamApplication(
        team_id=team_id,
        player_id=current_user.id,
        message=application.message,
        status=ApplicationStatus.PENDING
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    return new_application


@router.get("/me/applications", response_model=List[TeamApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all team applications by the current player"""
    applications = db.query(TeamApplication).filter(
        TeamApplication.player_id == current_user.id
    ).order_by(TeamApplication.created_at.desc()).all()
    
    return applications


@router.delete("/applications/{application_id}")
def withdraw_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Withdraw a team application"""
    application = db.query(TeamApplication).filter(
        and_(
            TeamApplication.id == application_id,
            TeamApplication.player_id == current_user.id
        )
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only withdraw pending applications")
    
    application.status = ApplicationStatus.WITHDRAWN
    db.commit()
    
    return {"message": "Application withdrawn successfully"}


@router.get("/me/invitations", response_model=List[TeamInvitationResponse])
def get_my_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all team invitations for the current player"""
    invitations = db.query(TeamInvitation).filter(
        and_(
            TeamInvitation.player_id == current_user.id,
            TeamInvitation.status == InvitationStatus.PENDING,
            TeamInvitation.expires_at > datetime.utcnow()
        )
    ).order_by(TeamInvitation.created_at.desc()).all()
    
    return invitations


@router.put("/invitations/{invitation_id}", response_model=TeamInvitationResponse)
def respond_to_invitation(
    invitation_id: UUID,
    response: TeamInvitationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or decline a team invitation"""
    invitation = db.query(TeamInvitation).filter(
        and_(
            TeamInvitation.id == invitation_id,
            TeamInvitation.player_id == current_user.id
        )
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invitation has already been responded to")
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = InvitationStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    invitation.status = response.status
    db.commit()
    db.refresh(invitation)
    
    return invitation


# ── Swipe-right endpoints (mutual match logic) ────────────────────────────────

@router.post("/teams/{team_id}/swipe-right")
def player_swipe_right_on_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Player swipes right on a team.
    Records a TeamApplication. If the team's captain has already invited this
    player (i.e. swiped right on them), returns matched=True.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Idempotent: don't create a second application
    existing = db.query(TeamApplication).filter(
        TeamApplication.team_id == team_id,
        TeamApplication.player_id == current_user.id,
    ).first()
    if not existing:
        new_app = TeamApplication(
            team_id=team_id,
            player_id=current_user.id,
            status=ApplicationStatus.PENDING,
        )
        db.add(new_app)
        db.commit()

    # Check if the captain has already swiped right on this player
    captain_liked = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id,
        TeamInvitation.player_id == current_user.id,
        TeamInvitation.status == InvitationStatus.PENDING,
    ).first()

    return {
        "matched": captain_liked is not None,
        "team_id": str(team_id),
        "captain_id": str(team.captain_id) if team.captain_id else None,
        "team_name": team.name,
    }


@router.post("/players/{player_id}/swipe-right")
def captain_swipe_right_on_player(
    player_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Captain swipes right on a player.
    Records a TeamInvitation for the captain's team. If the player has already
    applied to this team (i.e. swiped right on it), returns matched=True.
    """
    # Captain must have a team
    team = db.query(Team).filter(Team.captain_id == current_user.id).first()
    if not team:
        raise HTTPException(status_code=400, detail="You must have a team to invite players")

    player = db.query(User).filter(User.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Idempotent: don't create a duplicate invitation
    existing = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team.id,
        TeamInvitation.player_id == player_id,
        TeamInvitation.status == InvitationStatus.PENDING,
    ).first()
    if not existing:
        new_inv = TeamInvitation(
            team_id=team.id,
            player_id=player_id,
            invited_by=current_user.id,
            status=InvitationStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(days=30),
        )
        db.add(new_inv)
        db.commit()

    # Check if the player has already applied to this team
    player_liked = db.query(TeamApplication).filter(
        TeamApplication.team_id == team.id,
        TeamApplication.player_id == player_id,
        TeamApplication.status == ApplicationStatus.PENDING,
    ).first()

    return {
        "matched": player_liked is not None,
        "player_id": str(player_id),
        "player_name": player.full_name,
    }
