from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict

from database import get_db
from models import User, AuthProvider, RefreshToken
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, 
    RefreshTokenRequest, GoogleOAuthRequest
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    create_refresh_token, verify_token, get_current_user, revoke_refresh_token
)
from oauth import GoogleOAuth
from config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        roles=user_data.roles,
        auth_provider=AuthProvider.EMAIL,
        is_verified=False  # Require email verification
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(db_user.id, db)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id, db)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/google", response_model=Token)
async def google_auth(oauth_data: GoogleOAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth."""
    
    # Exchange code for tokens
    token_response = await GoogleOAuth.exchange_code_for_token(
        oauth_data.code, 
        oauth_data.redirect_uri
    )
    
    # Get user info from Google
    user_info = await GoogleOAuth.get_user_info(token_response["access_token"])
    
    # Check if user exists
    user = db.query(User).filter(User.email == user_info["email"]).first()
    
    if not user:
        # Create new user
        user = User(
            email=user_info["email"],
            full_name=user_info.get("name"),
            avatar_url=user_info.get("picture"),
            auth_provider=AuthProvider.GOOGLE,
            provider_id=user_info["id"],
            is_verified=True,  # Google accounts are pre-verified
            roles=["player"]  # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user
        if user.auth_provider != AuthProvider.GOOGLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered with different provider"
            )
        user.last_login = datetime.utcnow()
        db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id, db)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    
    # Verify refresh token
    token_data = verify_token(token_request.refresh_token, token_type="refresh")
    
    # Check if token exists and is not revoked
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_request.refresh_token,
        RefreshToken.is_revoked == False
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if token is expired
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    
    # Get user
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(user.id, db)
    
    # Revoke old refresh token
    revoke_refresh_token(db, token_request.refresh_token)
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token
    )


@router.post("/logout")
async def logout(
    token_request: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user by revoking refresh token."""
    
    revoke_refresh_token(db, token_request.refresh_token)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.get("/google/url")
async def get_google_auth_url(redirect_uri: str):
    """Get Google OAuth authorization URL."""
    url = GoogleOAuth.get_authorization_url(redirect_uri)
    return {"url": url}
