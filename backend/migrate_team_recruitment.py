"""
Add team recruitment features: player requirements, tournament participation, and squad management
"""
from sqlalchemy import create_engine, text
from config import settings

def migrate():
    """Run database migrations for team recruitment features"""
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            # Add new columns to teams table
            print("Adding current_player_count and is_squad_full to teams table...")
            conn.execute(text("""
                ALTER TABLE teams 
                ADD COLUMN IF NOT EXISTS current_player_count INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS is_squad_full BOOLEAN DEFAULT FALSE;
            """))
            conn.commit()
            print("✓ Added squad management columns to teams table")
            
            # Create player_requirements table
            print("Creating player_requirements table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS player_requirements (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                    required_role VARCHAR NOT NULL,
                    skill_level VARCHAR,
                    min_experience_years INTEGER,
                    max_experience_years INTEGER,
                    min_age INTEGER,
                    max_age INTEGER,
                    preferred_formats VARCHAR[],
                    availability_start_date DATE,
                    availability_end_date DATE,
                    positions_available INTEGER DEFAULT 1,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✓ Created player_requirements table")
            
            # Create team_tournament_participations table
            print("Creating team_tournament_participations table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS team_tournament_participations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
                    placement INTEGER,
                    registration_date TIMESTAMP DEFAULT NOW(),
                    is_confirmed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT unique_team_tournament UNIQUE (team_id, tournament_id)
                );
            """))
            conn.commit()
            print("✓ Created team_tournament_participations table")
            
            # Create indexes for better query performance
            print("Creating indexes...")
            
            # Index on team_id for player_requirements
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_player_requirements_team_id 
                ON player_requirements(team_id);
            """))
            
            # Index on active requirements
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_player_requirements_active 
                ON player_requirements(team_id, is_active);
            """))
            
            # Index on team_id for tournament participations
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_team_tournament_team_id 
                ON team_tournament_participations(team_id);
            """))
            
            # Index on tournament_id for tournament participations
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_team_tournament_tournament_id 
                ON team_tournament_participations(tournament_id);
            """))
            
            conn.commit()
            print("✓ Created indexes")
            
            print("\n✅ Team recruitment migrations completed successfully!")
            print("\nNew features available:")
            print("  - Player requirements posting")
            print("  - Team tournament participation tracking")
            print("  - Squad management (mark full/available)")
            print("  - Automatic player count tracking")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("=" * 70)
    print("Running Team Recruitment Database Migrations")
    print("=" * 70)
    migrate()
