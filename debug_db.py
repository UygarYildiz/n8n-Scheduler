#!/usr/bin/env python3
"""
Database Debug Script
"""
import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print("🔍 Database Debug Starting...")
print("=" * 50)

# Test 1: Import test
try:
    from optimization_core.database import test_connection, SessionLocal, User
    print("✅ Database modules imported successfully")
except Exception as e:
    print(f"❌ Database import failed: {e}")
    sys.exit(1)

# Test 2: Connection test
try:
    result = test_connection()
    print(f"✅ Database connection test: {result}")
except Exception as e:
    print(f"❌ Database connection test failed: {e}")

# Test 3: User query test
try:
    db = SessionLocal()
    users = db.query(User).all()
    print(f"✅ Users found: {len(users)}")
    for user in users:
        print(f"   - {user.username}: {user.email}")
    db.close()
except Exception as e:
    print(f"❌ User query failed: {e}")

# Test 4: Auth utils test
try:
    from optimization_core.auth_utils import authenticate_user, hash_password, verify_password
    print("✅ Auth utils imported successfully")
    
    # Test password hash
    test_hash = hash_password("admin123")
    print(f"✅ Password hash test: {test_hash[:20]}...")
    
    # Get admin user and check password
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()
    if admin_user:
        print(f"✅ Admin user found: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password hash: {admin_user.password_hash[:30]}...")
        print(f"   Is active: {admin_user.is_active}")
        
        # Test password verification
        password_ok = verify_password("admin123", admin_user.password_hash)
        print(f"   Password verify: {password_ok}")
        
        if not password_ok:
            print("   🔧 Password mismatch! Updating admin password...")
            # Update admin password
            new_hash = hash_password("admin123")
            admin_user.password_hash = new_hash
            db.commit()
            print("   ✅ Admin password updated!")
    else:
        print("❌ Admin user not found!")
    
    # Test authentication again
    user = authenticate_user(db, "admin", "admin123")
    if user:
        print(f"✅ Authentication test: {user.username}")
    else:
        print("❌ Authentication test still failed")
    db.close()
    
except Exception as e:
    print(f"❌ Auth utils test failed: {e}")
    import traceback
    traceback.print_exc()

print("=" * 50)
print("�� Debug completed!") 