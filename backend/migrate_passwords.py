"""
Migration script to rehash passwords in the database.
This fixes any passwords that may have been hashed incorrectly.

Run this script once to update existing user passwords.
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from auth import get_password_hash

def migrate_passwords():
    """
    Rehash all passwords in the database.
    
    Note: This requires users to use their ORIGINAL passwords.
    If you don't know the original passwords, you'll need to:
    1. Clear the database and have users re-register, OR
    2. Implement a password reset flow for existing users
    """
    db = SessionLocal()
    try:
        # Get all users with password authentication (not OAuth)
        users = db.query(User).filter(User.hashed_password.isnot(None)).all()
        
        print(f"Found {len(users)} users with password authentication")
        print("\nNOTE: This script cannot rehash existing passwords automatically")
        print("because we don't have access to the original plain text passwords.")
        print("\nOptions:")
        print("1. Drop all users and have them re-register")
        print("2. Implement a password reset flow")
        print("3. If this is a development database, you can delete all users")
        
        response = input("\nDo you want to delete all users? (yes/no): ")
        
        if response.lower() == 'yes':
            for user in users:
                db.delete(user)
            db.commit()
            print(f"Deleted {len(users)} users. They will need to re-register.")
        else:
            print("No changes made. Please implement a password reset flow.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Password Migration Script")
    print("=" * 60)
    migrate_passwords()
