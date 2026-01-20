# MyCricMate Backend

Python backend for MyCricMate using FastAPI, PostgreSQL, and Supabase.

## Features

- ✅ JWT Authentication
- ✅ Google OAuth Integration
- ✅ PostgreSQL Database with SQLAlchemy
- ✅ Supabase Integration
- ✅ Secure Password Hashing
- ✅ Refresh Token Rotation
- ✅ Role-Based Access (Player, Captain, Organizer, Staff)

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings > API
3. Copy `.env.example` to `.env` and fill in your Supabase credentials

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:8080/auth/callback`
   - Your production URL
6. Copy Client ID and Secret to `.env`

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the following variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string (use Supabase's)
- `SECRET_KEY` - Generate with: `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### 5. Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## API Endpoints

### Authentication

- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Login with Google OAuth
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke refresh token)
- `GET /auth/me` - Get current user
- `GET /auth/google/url` - Get Google OAuth URL

### Users

- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `POST /users/me/onboarding` - Complete onboarding
- `GET /users/{user_id}` - Get user by ID

## Database Schema

### Users Table
- `id` - UUID (Primary Key)
- `email` - String (Unique, Indexed)
- `full_name` - String
- `hashed_password` - String (Nullable for OAuth)
- `avatar_url` - String
- `phone` - String
- `city` - String
- `discovery_radius` - Integer
- `roles` - Array of UserRole enum
- `batting_style`, `bowling_style`, `playing_role` - Player fields
- `experience_years` - Integer
- `preferred_formats` - Array of strings
- `auth_provider` - Enum (EMAIL, GOOGLE)
- `provider_id` - String (OAuth provider ID)
- `is_verified`, `is_active` - Boolean
- `created_at`, `updated_at`, `last_login` - DateTime

### Refresh Tokens Table
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key)
- `token` - String (Unique, Indexed)
- `expires_at` - DateTime
- `is_revoked` - Boolean
- `created_at` - DateTime

## Security Features

1. **Password Hashing**: Bcrypt with salt
2. **JWT Tokens**: Short-lived access tokens (30 min)
3. **Refresh Tokens**: Long-lived (7 days), stored in DB
4. **Token Rotation**: New refresh token on each refresh
5. **Token Revocation**: Logout revokes refresh tokens
6. **OAuth Integration**: Secure Google OAuth flow
7. **CORS**: Configured for frontend origin
8. **Input Validation**: Pydantic schemas

## Development

### Run with Auto-reload

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations

If you need to modify the database schema:

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## Production Deployment

1. Set up a production PostgreSQL database (or use Supabase)
2. Update environment variables for production
3. Use a production ASGI server like Gunicorn:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

4. Set up HTTPS/SSL
5. Configure proper CORS origins
6. Set up monitoring and logging
