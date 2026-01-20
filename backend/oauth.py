import httpx
from typing import Dict, Optional
from fastapi import HTTPException, status
from config import settings


class GoogleOAuth:
    """Google OAuth handler."""
    
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    @staticmethod
    async def exchange_code_for_token(code: str, redirect_uri: str) -> Dict:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            data = {
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
            
            response = await client.post(GoogleOAuth.TOKEN_URL, data=data)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            return response.json()
    
    @staticmethod
    async def get_user_info(access_token: str) -> Dict:
        """Get user information from Google."""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(GoogleOAuth.USER_INFO_URL, headers=headers)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google"
                )
            
            return response.json()
    
    @staticmethod
    def get_authorization_url(redirect_uri: str) -> str:
        """Generate Google OAuth authorization URL."""
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"
