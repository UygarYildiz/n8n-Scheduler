#!/usr/bin/env python3
"""
Admin API Test Script
Bu script admin endpoint'lerini test eder.
"""

import json
import urllib.request
import urllib.error

def test_login():
    """Login endpoint test ve token alma"""
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        data = json.dumps(login_data).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/auth/login',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ Login Test:")
            print(f"   User: {result.get('user', {}).get('full_name')}")
            print(f"   Role: {result.get('user', {}).get('role', {}).get('display_name')}")
            return result.get('access_token')
            
    except urllib.error.HTTPError as e:
        print(f"❌ Login Test Failed: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Login Test Error: {e}")
        return None

def test_get_users(token):
    """Kullanıcıları listele test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/users',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("\n✅ Get Users Test:")
            print(f"   Total Users: {result.get('total_count')}")
            print(f"   Active Users: {result.get('active_count')}")
            
            for user in result.get('users', [])[:3]:  # İlk 3 kullanıcıyı göster
                print(f"   - {user.get('full_name')} ({user.get('email')})")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ Get Users Test Failed: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Get Users Test Error: {e}")
        return False

def test_get_admin_stats(token):
    """Admin istatistikleri test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/admin/stats',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("\n✅ Admin Stats Test:")
            stats = result.get('user_stats', {})
            print(f"   Total Users: {stats.get('total_users')}")
            print(f"   Active Users: {stats.get('active_users')}")
            print(f"   Admin Users: {stats.get('admin_users')}")
            print(f"   Recent Users: {stats.get('recent_users')}")
            print(f"   Active Sessions: {result.get('active_sessions')}")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ Admin Stats Test Failed: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Admin Stats Test Error: {e}")
        return False

def test_get_organizations(token):
    """Organizasyonları listele test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/organizations',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("\n✅ Organizations Test:")
            print(f"   Found {len(result)} organizations:")
            
            for org in result:
                print(f"   - {org.get('name')} ({org.get('type')})")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ Organizations Test Failed: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Organizations Test Error: {e}")
        return False

def test_get_roles(token):
    """Rolleri listele test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/roles',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("\n✅ Roles Test:")
            print(f"   Found {len(result)} roles:")
            
            for role in result:
                print(f"   - {role.get('display_name')} ({role.get('name')})")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ Roles Test Failed: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Roles Test Error: {e}")
        return False

def main():
    print("🚀 Admin API Test Başlatılıyor...\n")
    
    # Login test
    token = test_login()
    if not token:
        print("\n❌ Login başarısız, testler durduruluyor.")
        return
    
    # Diğer testler
    test_get_users(token)
    test_get_admin_stats(token)
    test_get_organizations(token)
    test_get_roles(token)
    
    print("\n🎉 Tüm testler tamamlandı!")

if __name__ == "__main__":
    main() 