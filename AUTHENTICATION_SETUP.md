# MyCricMate - OAuth & JWT Authentication Setup Guide

## Overview

This guide will help you set up the complete authentication system for MyCricMate, including:
- Python backend with FastAPI
- PostgreSQL database via Supabase
- JWT authentication
- Google OAuth integration
- React frontend integration

## Prerequisites

- **Python 3.9+** installed
- **Node.js 16+** and npm/bun installed
- **Supabase account** (free tier works)
- **Google Cloud account** for OAuth

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and click **"New Project"**
3. Choose:
   - **Organization**: Your organization or create new
   - **Name**: mycricmate
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free

4. Wait for project to initialize (~2 minutes)

### 1.2 Get Supabase Credentials

1. In your project dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

3. Go to **Settings** > **Database** > **Connection String**
4. Copy the **URI** connection string
5. Replace `[YOUR-PASSWORD]` with your database password

---

## Part 2: Google OAuth Setup

### 2.1 Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** > **New Project**
3. Name: "MyCricMate"
4. Click **Create**

### 2.2 Enable Google+ API

1. In the left menu: **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - **App name**: MyCricMate
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. Skip **Scopes** (click Save and Continue)
6. Add yourself as a test user
7. Click **Save and Continue**, then **Back to Dashboard**

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Choose **Application type**: Web application
4. Name: "MyCricMate Web Client"
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:8080/auth/callback
   ```
6. Click **Create**
7. **IMPORTANT**: Copy your:
   - **Client ID** (e.g., `123456-abc.apps.googleusercontent.com`)
   - **Client Secret** (e.g., `GOCSPX-abc123...`)

---

## Part 3: Backend Setup

### 3.1 Navigate to Backend Directory

```bash
cd backend
```

### 3.2 Create Python Virtual Environment

**On Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**On Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 3.4 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor and fill in:

```env
# Supabase Configuration (from Part 1)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Database Configuration (from Part 1)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# JWT Configuration
SECRET_KEY=REPLACE_THIS_WITH_GENERATED_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth Providers (from Part 2)
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...

# Application Configuration
APP_NAME=MyCricMate
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8000
```

### 3.5 Generate Secret Key

Run this command to generate a secure secret key:

**On Windows (PowerShell):**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**On Mac/Linux:**
```bash
openssl rand -hex 32
```

Copy the output and paste it as your `SECRET_KEY` in `.env`

### 3.6 Initialize Database

The database tables will be created automatically when you first run the server.

### 3.7 Start the Backend Server

```bash
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Visit `http://localhost:8000/docs` to see the API documentation!

---

## Part 4: Frontend Setup

### 4.1 Navigate to Project Root

Open a new terminal and go to the project root:

```bash
cd c:\Users\nijaa\OneDrive\Documents\GitHub\mycricmate
```

### 4.2 Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. The file should contain:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### 4.3 Install Frontend Dependencies (if not already done)

```bash
npm install
```

### 4.4 Start the Frontend

```bash
npm run dev
```

You should see:
```
  VITE v5.4.21  ready in XXX ms

  ➜  Local:   http://localhost:8080/
```

---

## Part 5: Testing the Authentication

### 5.1 Test Email/Password Registration

1. Open `http://localhost:8080` in your browser
2. Click **"Get Started"** or **"Sign up"**
3. Fill in:
   - Full Name
   - Email
   - Password (at least 8 characters)
   - Confirm Password
4. Click **"Create Account"**
5. You should be redirected to the onboarding page

### 5.2 Test Onboarding

1. Select at least one role (Player, Captain, etc.)
2. Click **"Continue"**
3. Enter your city name
4. Adjust the discovery radius slider
5. Click **"Continue"**
6. You should see the completion screen
7. Click **"Start Your Journey"** to go to the dashboard

### 5.3 Test Google OAuth

1. Go back to login page: `http://localhost:8080/login`
2. Click **"Google"** button
3. You'll be redirected to Google login
4. Sign in with your Google account
5. Authorize the app
6. You should be redirected back and logged in!

### 5.4 Test Logout

1. In the dashboard, click your avatar (top right)
2. Click **"Logout"**
3. You should be signed out and redirected to home

---

## Part 6: Verify Everything Works

### 6.1 Check Database

1. Go to your Supabase dashboard
2. Click **Table Editor**
3. You should see two tables:
   - **users** - Contains your registered users
   - **refresh_tokens** - Contains active sessions

### 6.2 Check API Logs

In your backend terminal, you should see logs like:
```
INFO: 127.0.0.1:xxxxx - "POST /auth/register HTTP/1.1" 201 Created
INFO: 127.0.0.1:xxxxx - "GET /auth/me HTTP/1.1" 200 OK
```

### 6.3 Test Token Refresh

1. Log in to the application
2. Wait 30 minutes (or reduce `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env` for testing)
3. Perform an action (navigate to a different page)
4. The app should automatically refresh your token in the background

---

## Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`
**Solution:** Make sure virtual environment is activated and dependencies are installed:
```bash
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**Error:** `pydantic_core._pydantic_core.ValidationError`
**Solution:** Check your `.env` file - all required variables must be filled

### Database connection fails

**Error:** `could not connect to server`
**Solution:**
- Verify `DATABASE_URL` is correct
- Check your database password is correct
- Ensure you copied the full connection string from Supabase

### Google OAuth doesn't work

**Error:** `redirect_uri_mismatch`
**Solution:**
- Go to Google Cloud Console > Credentials
- Edit your OAuth client
- Ensure `http://localhost:8080/auth/callback` is in Authorized redirect URIs
- Must match exactly (no trailing slash)

### CORS errors in browser

**Error:** `Access to fetch... has been blocked by CORS policy`
**Solution:**
- Make sure backend is running on port 8000
- Check `FRONTEND_URL` in backend `.env` matches your frontend URL
- Restart the backend after changing `.env`

### Token errors

**Error:** `Could not validate credentials`
**Solution:**
- Make sure `SECRET_KEY` is set in backend `.env`
- Both frontend and backend must be running
- Clear browser localStorage and try logging in again

---

## Development Tips

### Running Both Servers

Use two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate  # or `source venv/bin/activate` on Mac/Linux
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### View API Documentation

While backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Database Migrations

If you modify the models in `backend/models.py`, you'll need to recreate tables:

1. Stop the backend
2. In Supabase: Table Editor > Delete users and refresh_tokens tables
3. Restart backend - tables will be recreated

For production, use Alembic migrations (see backend README).

### Testing API Endpoints

You can test API endpoints directly using the Swagger UI at `http://localhost:8000/docs`:

1. Click on an endpoint (e.g., POST /auth/register)
2. Click "Try it out"
3. Fill in the request body
4. Click "Execute"
5. See the response

---

## Security Notes

### For Development

- Using `localhost` for OAuth redirect URIs is fine
- HTTP (not HTTPS) is okay for local development
- Test users in Google OAuth are okay

### For Production

Before deploying to production:

1. **Generate new SECRET_KEY** - never use development keys in production
2. **Use HTTPS** - required for OAuth and security
3. **Update OAuth redirect URIs** - add your production domain
4. **Set proper CORS origins** - restrict to your production domain
5. **Use environment variables** - never commit `.env` to git
6. **Enable database backups** in Supabase
7. **Set up monitoring** and logging
8. **Publish OAuth consent screen** in Google Cloud Console
9. **Use strong database passwords**
10. **Enable rate limiting** on API endpoints

---

## Next Steps

Now that authentication is working, you can:

1. **Add password reset** functionality
2. **Implement email verification** via Supabase Auth
3. **Add more OAuth providers** (Facebook, Twitter, etc.)
4. **Create protected routes** in the frontend
5. **Add role-based permissions** for different user types
6. **Implement user profile editing**
7. **Add social features** (teams, tournaments, etc.)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs in the terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure both backend and frontend servers are running

## Success!

You now have a fully functional authentication system with:
- ✅ Email/password registration and login
- ✅ Google OAuth integration
- ✅ JWT token-based authentication
- ✅ Secure password hashing
- ✅ Token refresh mechanism
- ✅ User onboarding flow
- ✅ PostgreSQL database via Supabase

Happy coding! 🏏
