"""
Add is_available column to users table and create new tables for player features
"""
from sqlalchemy import create_engine, text
from config import settings

def migrate():
    """Run database migrations"""
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            # Add is_available column to users table
            print("Adding is_available column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
            """))
            conn.commit()
            print("✓ Added is_available column")
            
            # Create teams table
            print("Creating teams table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS teams (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    description TEXT,
                    captain_id UUID NOT NULL REFERENCES users(id),
                    city VARCHAR,
                    home_ground VARCHAR,
                    established_date DATE,
                    logo_url VARCHAR,
                    preferred_formats VARCHAR[],
                    is_active BOOLEAN DEFAULT TRUE,
                    max_players INTEGER DEFAULT 15,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✓ Created teams table")
            
            # Create tournaments table
            print("Creating tournaments table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tournaments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    description TEXT,
                    organizer_id UUID NOT NULL REFERENCES users(id),
                    format VARCHAR NOT NULL,
                    city VARCHAR,
                    venue VARCHAR,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    registration_deadline DATE NOT NULL,
                    max_teams INTEGER NOT NULL,
                    entry_fee INTEGER DEFAULT 0,
                    prize_pool INTEGER DEFAULT 0,
                    logo_url VARCHAR,
                    is_published BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✓ Created tournaments table")
            
            # Create team_applications table
            print("Creating team_applications table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS team_applications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    team_id UUID NOT NULL REFERENCES teams(id),
                    player_id UUID NOT NULL REFERENCES users(id),
                    status VARCHAR NOT NULL DEFAULT 'pending',
                    message TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT unique_team_player_application UNIQUE (team_id, player_id)
                );
            """))
            conn.commit()
            print("✓ Created team_applications table")
            
            # Create team_invitations table
            print("Creating team_invitations table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS team_invitations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    team_id UUID NOT NULL REFERENCES teams(id),
                    player_id UUID NOT NULL REFERENCES users(id),
                    invited_by UUID NOT NULL REFERENCES users(id),
                    status VARCHAR NOT NULL DEFAULT 'pending',
                    message TEXT,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✓ Created team_invitations table")
            
            # Create player_tournaments table
            print("Creating player_tournaments table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS player_tournaments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    player_id UUID NOT NULL REFERENCES users(id),
                    tournament_id UUID NOT NULL REFERENCES tournaments(id),
                    team_id UUID REFERENCES teams(id),
                    placement INTEGER,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✓ Created player_tournaments table")
            
            # Create player_availability table
            print("Creating player_availability table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS player_availability (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    player_id UUID NOT NULL REFERENCES users(id),
                    date DATE NOT NULL,
                    is_available BOOLEAN DEFAULT TRUE,
                    notes VARCHAR,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT unique_player_date UNIQUE (player_id, date)
                );
            """))
            conn.commit()
            print("✓ Created player_availability table")
            
            print("\n✅ All migrations completed successfully!")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("Running Database Migrations")
    print("=" * 60)
    migrate()
