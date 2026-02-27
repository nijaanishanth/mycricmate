"""
Seed script: populates the database with test players and teams for swipe discovery.
Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
"""
import uuid
from datetime import datetime
from database import engine
from sqlalchemy import text

SEED_USERS = [
    {
        "id": str(uuid.uuid4()),
        "email": "rahul.sharma@test.com",
        "full_name": "Rahul Sharma",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "All-Rounder",
        "batting_style": "Right-handed",
        "bowling_style": "Right-arm medium",
        "experience_years": 5,
        "city": "Mumbai, Maharashtra, India",
        "is_available": True,
        "preferred_formats": ["T20", "ODI"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "vikram.patel@test.com",
        "full_name": "Vikram Patel",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "Bowler",
        "batting_style": "Left-handed",
        "bowling_style": "Left-arm spin",
        "experience_years": 3,
        "city": "Pune, Maharashtra, India",
        "is_available": True,
        "preferred_formats": ["T20"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "arjun.singh@test.com",
        "full_name": "Arjun Singh",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "wicket-keeper",
        "batting_style": "Right-handed",
        "bowling_style": None,
        "experience_years": 7,
        "city": "Delhi, India",
        "is_available": True,
        "preferred_formats": ["T20", "ODI", "Test"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "priya.menon@test.com",
        "full_name": "Priya Menon",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "Batsman",
        "batting_style": "Right-handed",
        "bowling_style": "Right-arm off-spin",
        "experience_years": 4,
        "city": "Chennai, Tamil Nadu, India",
        "is_available": True,
        "preferred_formats": ["T20", "T10"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "karan.mehta@test.com",
        "full_name": "Karan Mehta",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "Bowler",
        "batting_style": "Left-handed",
        "bowling_style": "Right-arm fast",
        "experience_years": 6,
        "city": "Bengaluru, Karnataka, India",
        "is_available": True,
        "preferred_formats": ["ODI", "Test"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "siddharth.rao@test.com",
        "full_name": "Siddharth Rao",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["PLAYER"],
        "playing_role": "All-Rounder",
        "batting_style": "Left-handed",
        "bowling_style": "Left-arm medium-fast",
        "experience_years": 8,
        "city": "Hyderabad, Telangana, India",
        "is_available": False,
        "preferred_formats": ["T20", "ODI"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    # Seed captain user for team creation
    {
        "id": str(uuid.uuid4()),
        "email": "captain.demo@test.com",
        "full_name": "Demo Captain",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["CAPTAIN"],
        "playing_role": "Batsman",
        "batting_style": "Right-handed",
        "bowling_style": None,
        "experience_years": 10,
        "city": "Mumbai, Maharashtra, India",
        "is_available": True,
        "preferred_formats": ["T20", "ODI"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=CaptainDemo",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "captain.pune@test.com",
        "full_name": "Aditya Kulkarni",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["CAPTAIN"],
        "playing_role": "Batsman",
        "batting_style": "Right-handed",
        "bowling_style": None,
        "experience_years": 9,
        "city": "Pune, Maharashtra, India",
        "is_available": True,
        "preferred_formats": ["T20", "T10"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "captain.delhi@test.com",
        "full_name": "Rajesh Gupta",
        "hashed_password": "$2b$12$placeholder",
        "roles": ["CAPTAIN"],
        "playing_role": "All-Rounder",
        "batting_style": "Right-handed",
        "bowling_style": "Right-arm medium",
        "experience_years": 12,
        "city": "Delhi, India",
        "is_available": True,
        "preferred_formats": ["ODI", "Test"],
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
        "auth_provider": "EMAIL",
        "is_verified": True,
        "is_active": True,
        "profile_visible": True,
    },
]

# Map email -> id for team captain foreign keys
captain_ids = {u["email"]: u["id"] for u in SEED_USERS if "CAPTAIN" in u["roles"]}

SEED_TEAMS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Mumbai Warriors",
        "description": "Professional cricket team looking for skilled all-rounders and fast bowlers. We compete in local T20 leagues.",
        "captain_id": captain_ids["captain.demo@test.com"],
        "city": "Mumbai, Maharashtra, India",
        "home_ground": "Wankhede Stadium, Mumbai",
        "preferred_formats": ["T20", "ODI"],
        "logo_url": "https://api.dicebear.com/7.x/initials/svg?seed=MW&backgroundColor=1a1a2e",
        "max_players": 15,
        "current_player_count": 8,
        "is_squad_full": False,
        "is_active": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Pune Strikers",
        "description": "Competitive team seeking wicket-keepers and opening batsmen for the upcoming T20 season.",
        "captain_id": captain_ids["captain.pune@test.com"],
        "city": "Pune, Maharashtra, India",
        "home_ground": "MCA International Stadium, Pune",
        "preferred_formats": ["T20", "T10"],
        "logo_url": "https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=16213e",
        "max_players": 14,
        "current_player_count": 10,
        "is_squad_full": False,
        "is_active": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Delhi Dynamites",
        "description": "Premier league team with a strong winning record. Looking for experienced spinners and top-order batsmen.",
        "captain_id": captain_ids["captain.delhi@test.com"],
        "city": "Delhi, India",
        "home_ground": "Arun Jaitley Stadium, Delhi",
        "preferred_formats": ["ODI", "Test"],
        "logo_url": "https://api.dicebear.com/7.x/initials/svg?seed=DD&backgroundColor=0f3460",
        "max_players": 18,
        "current_player_count": 12,
        "is_squad_full": False,
        "is_active": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Bengaluru Blasters",
        "description": "Young and energetic team from the Silicon Valley of India. We play for passion and fun.",
        "captain_id": captain_ids["captain.demo@test.com"],  # reuse demo captain
        "city": "Bengaluru, Karnataka, India",
        "home_ground": "M. Chinnaswamy Stadium, Bengaluru",
        "preferred_formats": ["T20", "T10"],
        "logo_url": "https://api.dicebear.com/7.x/initials/svg?seed=BB&backgroundColor=533483",
        "max_players": 15,
        "current_player_count": 6,
        "is_squad_full": False,
        "is_active": True,
    },
]


def seed():
    with engine.begin() as conn:
        inserted_users = 0
        for u in SEED_USERS:
            roles_pg = "{" + ",".join(u["roles"]) + "}"
            formats_pg = "{" + ",".join(u["preferred_formats"]) + "}"
            result = conn.execute(text("""
                INSERT INTO users (
                    id, email, full_name, hashed_password, roles,
                    playing_role, batting_style, bowling_style, experience_years,
                    city, is_available, preferred_formats,
                    avatar_url, auth_provider, is_verified, is_active, profile_visible,
                    created_at, updated_at
                ) VALUES (
                    :id, :email, :full_name, :hashed_password, :roles,
                    :playing_role, :batting_style, :bowling_style, :experience_years,
                    :city, :is_available, :formats,
                    :avatar_url, :auth_provider, :is_verified, :is_active, :profile_visible,
                    NOW(), NOW()
                )
                ON CONFLICT (email) DO NOTHING
            """), {
                "id": u["id"],
                "email": u["email"],
                "full_name": u["full_name"],
                "hashed_password": u["hashed_password"],
                "roles": roles_pg,
                "playing_role": u["playing_role"],
                "batting_style": u["batting_style"],
                "bowling_style": u.get("bowling_style"),
                "experience_years": u["experience_years"],
                "city": u["city"],
                "is_available": u["is_available"],
                "formats": formats_pg,
                "avatar_url": u["avatar_url"],
                "auth_provider": u["auth_provider"],
                "is_verified": u["is_verified"],
                "is_active": u["is_active"],
                "profile_visible": u["profile_visible"],
            })
            inserted_users += result.rowcount

        print(f"Inserted {inserted_users} users")

        # Re-read captain IDs from DB in case they already existed
        for u in SEED_USERS:
            if "CAPTAIN" in u["roles"]:
                row = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": u["email"]}
                ).fetchone()
                if row:
                    captain_ids[u["email"]] = str(row[0])

        # Update team captain_ids with refreshed values
        SEED_TEAMS[0]["captain_id"] = captain_ids["captain.demo@test.com"]
        SEED_TEAMS[1]["captain_id"] = captain_ids["captain.pune@test.com"]
        SEED_TEAMS[2]["captain_id"] = captain_ids["captain.delhi@test.com"]
        SEED_TEAMS[3]["captain_id"] = captain_ids["captain.demo@test.com"]

        inserted_teams = 0
        for t in SEED_TEAMS:
            formats_pg = "{" + ",".join(t["preferred_formats"]) + "}"
            result = conn.execute(text("""
                INSERT INTO teams (
                    id, name, description, captain_id, city, home_ground,
                    preferred_formats, logo_url, max_players, current_player_count,
                    is_squad_full, is_active, created_at, updated_at
                ) VALUES (
                    :id, :name, :description, :captain_id, :city, :home_ground,
                    :formats, :logo_url, :max_players, :current_player_count,
                    :is_squad_full, :is_active, NOW(), NOW()
                )
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "captain_id": t["captain_id"],
                "city": t["city"],
                "home_ground": t["home_ground"],
                "formats": formats_pg,
                "logo_url": t["logo_url"],
                "max_players": t["max_players"],
                "current_player_count": t["current_player_count"],
                "is_squad_full": t["is_squad_full"],
                "is_active": t["is_active"],
            })
            inserted_teams += result.rowcount

        print(f"Inserted {inserted_teams} teams")

    print("Seed complete.")


if __name__ == "__main__":
    seed()
