# Player View Implementation Summary

## Overview
Implemented a comprehensive Player View that allows players to manage their profile, search for teams and tournaments, apply to teams, and respond to invitations.

## Backend Implementation

### New Models Added (backend/models.py)

1. **Team** - Represents cricket teams
   - Fields: name, description, captain_id, city, home_ground, logo_url, preferred_formats, etc.

2. **Tournament** - Represents cricket tournaments
   - Fields: name, format, organizer_id, venue, dates, entry_fee, prize_pool, etc.

3. **TeamApplication** - Player applications to join teams
   - Fields: team_id, player_id, status (pending/accepted/rejected/withdrawn), message

4. **TeamInvitation** - Team invitations to players
   - Fields: team_id, player_id, invited_by, status, expires_at

5. **PlayerTournament** - Track past tournaments
   - Fields: player_id, tournament_id, team_id, placement

6. **PlayerAvailability** - Calendar-based availability
   - Fields: player_id, date, is_available, notes

### Updated User Model
- Added `is_available` field for quick availability toggle

### New API Endpoints (backend/routers/players.py)

#### Player Profile
- `GET /players/me/profile` - Get full player profile with past tournaments

#### Availability
- `POST /players/me/availability` - Toggle general availability ON/OFF
- `GET /players/me/availability` - Get availability calendar for date range
- `POST /players/me/availability/calendar` - Set availability for specific date

#### Search Features
- `GET /players/tournaments/search` - Search tournaments by city, format, upcoming
- `GET /players/teams/search` - Search teams by city, format

#### Team Applications
- `POST /players/teams/{team_id}/apply` - Apply to join a team
- `GET /players/me/applications` - Get all player's applications
- `DELETE /players/applications/{application_id}` - Withdraw application

#### Team Invitations
- `GET /players/me/invitations` - Get pending invitations
- `PUT /players/invitations/{invitation_id}` - Accept or decline invitation

## Frontend Implementation

### New Page: PlayerProfile.tsx

Located at: `/player/profile`

#### Features Implemented:

1. **Player Profile Card**
   - Display name, location, avatar
   - Show playing role, batting/bowling style, experience
   - Display preferred formats
   - Availability toggle switch (ON/OFF)

2. **Tournaments Tab**
   - Search tournaments by city
   - View upcoming tournaments with details:
     - Format (T20, ODI, etc.)
     - Location and venue
     - Dates
     - Prize pool
     - Max teams
   - View past tournaments with placement/achievements

3. **Teams Tab**
   - Search teams by city
   - View team details:
     - Name, description
     - Location and home ground
     - Preferred formats
   - Apply to teams with one click

4. **Applications Tab**
   - View all team applications
   - See application status:
     - ⏱️ Pending
     - ✅ Accepted
     - ❌ Rejected
   - Withdraw pending applications

5. **Invitations Tab**
   - View team invitations
   - See invitation details and messages
   - Accept or decline invitations
   - View expiration dates

### Navigation
- Added "Player Profile" link to user dropdown menu in DashboardNav
- Route: `/player/profile`

## Player Profile Information Includes:

✅ Name & location  
✅ Primary role (playing_role)  
✅ Batting style  
✅ Bowling style  
✅ Experience level (experience_years)  
✅ Past tournaments with placement  
✅ Availability calendar  
✅ Preferred formats  

## Functional Requirements Implemented:

✅ Search tournaments (by city, format, upcoming filter)  
✅ Search teams (by city, format)  
✅ Apply to teams  
✅ Receive and respond to invitations  
✅ Toggle availability ON/OFF  

## Database Migration Required

To use these new features, you need to run the backend to create the new database tables:

```powershell
cd backend
python main.py
```

This will automatically create all the new tables:
- teams
- tournaments
- team_applications
- team_invitations
- player_tournaments
- player_availability

## Usage Flow

1. **Player Profile Setup**
   - Player logs in and completes onboarding
   - Sets playing role, batting/bowling style, experience, formats

2. **Search & Apply**
   - Navigate to Player Profile page
   - Search for tournaments or teams
   - Click "Apply" to join teams

3. **Manage Applications**
   - View application status in Applications tab
   - Withdraw pending applications if needed

4. **Handle Invitations**
   - Receive team invitations in Invitations tab
   - Accept or decline before expiration

5. **Availability Management**
   - Toggle availability ON/OFF in profile header
   - Set specific date availability (future enhancement)

## Next Steps / Future Enhancements

1. **Captain/Team Management Views**
   - Create team management interface
   - Review and accept/reject player applications
   - Send invitations to players

2. **Organizer Views**
   - Create and manage tournaments
   - Tournament registration management

3. **Advanced Search**
   - Filter by skill level
   - Distance-based search
   - Advanced availability matching

4. **Notifications**
   - Real-time notifications for invitations
   - Application status updates
   - Tournament announcements

5. **Team Roster Management**
   - View team members
   - Team chat/communication

## API Testing

You can test the API endpoints using the Swagger UI at:
```
http://localhost:8000/docs
```

Or use curl/Postman with these endpoints (requires authentication):
- GET http://localhost:8000/players/me/profile
- POST http://localhost:8000/players/me/availability
- GET http://localhost:8000/players/tournaments/search
- GET http://localhost:8000/players/teams/search
- POST http://localhost:8000/players/teams/{team_id}/apply
