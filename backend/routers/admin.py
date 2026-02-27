from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from database import get_db
from auth import get_current_user
from models import User, Team, Tournament, TeamApplication, ApplicationStatus

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Guard ──────────────────────────────────────────────────────────────────────

def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required",
        )
    return current_user


# ── Response schemas ───────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    banned_users: int
    total_teams: int
    active_teams: int
    total_tournaments: int
    new_users_this_month: int


class AdminUserRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str] = None
    city: Optional[str] = None
    roles: List[str] = []
    playing_role: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class AdminTeamRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    city: Optional[str] = None
    home_ground: Optional[str] = None
    captain_name: Optional[str] = None
    captain_email: Optional[str] = None
    current_player_count: int
    max_players: int
    is_active: bool
    is_squad_full: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_superuser: Optional[bool] = None


class AdminTeamUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_squad_full: Optional[bool] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """Return platform-wide statistics."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    banned_users = db.query(func.count(User.id)).filter(User.is_active == False).scalar() or 0
    total_teams = db.query(func.count(Team.id)).scalar() or 0
    active_teams = db.query(func.count(Team.id)).filter(Team.is_active == True).scalar() or 0
    total_tournaments = db.query(func.count(Tournament.id)).scalar() or 0
    new_users = (
        db.query(func.count(User.id))
        .filter(User.created_at >= month_start)
        .scalar()
        or 0
    )

    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        banned_users=banned_users,
        total_teams=total_teams,
        active_teams=active_teams,
        total_tournaments=total_tournaments,
        new_users_this_month=new_users,
    )


@router.get("/users", response_model=List[AdminUserRow])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """List all users with optional search."""
    q = db.query(User)
    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            User.email.ilike(term) | User.full_name.ilike(term)
        )
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [
        AdminUserRow(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            city=u.city,
            roles=list(u.roles or []),
            playing_role=u.playing_role,
            is_active=u.is_active,
            is_verified=u.is_verified,
            is_superuser=u.is_superuser,
            created_at=u.created_at,
            last_login=u.last_login,
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=AdminUserRow)
def update_user(
    user_id: str,
    data: AdminUserUpdate,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """Ban/unban, verify, or promote a user."""
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from demoting themselves
    if str(user.id) == str(admin.id) and data.is_superuser is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own superuser status")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return AdminUserRow(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        city=user.city,
        roles=list(user.roles or []),
        playing_role=user.playing_role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        last_login=user.last_login,
    )


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """Permanently delete a user account."""
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if str(uid) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()


@router.get("/teams", response_model=List[AdminTeamRow])
def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """List all teams with optional search."""
    q = db.query(Team)
    if search:
        q = q.filter(Team.name.ilike(f"%{search}%"))
    teams = q.order_by(Team.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for t in teams:
        captain = db.query(User).filter(User.id == t.captain_id).first()
        result.append(
            AdminTeamRow(
                id=str(t.id),
                name=t.name,
                city=t.city,
                home_ground=t.home_ground,
                captain_name=captain.full_name if captain else None,
                captain_email=captain.email if captain else None,
                current_player_count=t.current_player_count or 0,
                max_players=t.max_players or 15,
                is_active=t.is_active,
                is_squad_full=t.is_squad_full,
                created_at=t.created_at,
            )
        )
    return result


@router.patch("/teams/{team_id}", response_model=AdminTeamRow)
def update_team(
    team_id: str,
    data: AdminTeamUpdate,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """Activate/deactivate a team."""
    try:
        tid = UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID")

    team = db.query(Team).filter(Team.id == tid).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)

    captain = db.query(User).filter(User.id == team.captain_id).first()
    return AdminTeamRow(
        id=str(team.id),
        name=team.name,
        city=team.city,
        home_ground=team.home_ground,
        captain_name=captain.full_name if captain else None,
        captain_email=captain.email if captain else None,
        current_player_count=team.current_player_count or 0,
        max_players=team.max_players or 15,
        is_active=team.is_active,
        is_squad_full=team.is_squad_full,
        created_at=team.created_at,
    )


@router.delete("/teams/{team_id}", status_code=204)
def delete_team(
    team_id: str,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db),
):
    """Permanently delete a team."""
    try:
        tid = UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID")

    team = db.query(Team).filter(Team.id == tid).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    db.delete(team)
    db.commit()
