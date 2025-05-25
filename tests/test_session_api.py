#!/usr/bin/env python3
"""
Session Management API Test Script
Bu script session management endpoint'lerini test eder.
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
            print(f"   User: {result.get('user', {}).get('username', 'unknown')}")
            print(f"   Token type: {result.get('token_type', 'unknown')}")
            
            return result.get('access_token')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ Login Test HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Login Test failed: {e}")
        return None

def test_session_stats(token):
    """Session istatistikleri test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/sessions/stats',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ Session Stats Test:")
            print(f"   Aktif oturum: {result.get('active_sessions', 0)}")
            print(f"   Aktif kullanıcı: {result.get('active_users', 0)}")
            print(f"   Bugünkü giriş: {result.get('today_sessions', 0)}")
            print(f"   Süresi dolmuş: {result.get('expired_sessions', 0)}")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ Session Stats Test HTTP Error {e.code}: {error_body}")
    except Exception as e:
        print(f"❌ Session Stats Test failed: {e}")

def test_user_sessions(token):
    """Kullanıcı oturumları test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/sessions',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ User Sessions Test:")
            print(f"   Toplam oturum: {result.get('total_count', 0)}")
            
            sessions = result.get('sessions', [])
            for i, session in enumerate(sessions[:3]):  # İlk 3 oturumu göster
                print(f"   Oturum {i+1}:")
                print(f"     ID: {session.get('id')}")
                print(f"     Kullanıcı: {session.get('username')}")
                print(f"     Başlangıç: {session.get('created_at', '')[:19]}")
            
            return sessions
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ User Sessions Test HTTP Error {e.code}: {error_body}")
        return []
    except Exception as e:
        print(f"❌ User Sessions Test failed: {e}")
        return []

def test_all_sessions(token):
    """Tüm oturumları test (admin only)"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/sessions/all',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ All Sessions Test:")
            print(f"   Toplam oturum: {result.get('total_count', 0)}")
            print(f"   Aktif kullanıcı: {result.get('active_users', 0)}")
            
            sessions = result.get('sessions', [])
            for i, session in enumerate(sessions[:3]):  # İlk 3 oturumu göster
                print(f"   Oturum {i+1}:")
                print(f"     ID: {session.get('id')}")
                print(f"     Kullanıcı: {session.get('username')} ({session.get('full_name', '')})")
                print(f"     Kurum: {session.get('organization', 'N/A')}")
                print(f"     Rol: {session.get('role', 'N/A')}")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ All Sessions Test HTTP Error {e.code}: {error_body}")
    except Exception as e:
        print(f"❌ All Sessions Test failed: {e}")

def test_profile(token):
    """Profile endpoint test"""
    try:
        req = urllib.request.Request(
            'http://localhost:8000/auth/profile',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ Profile Test:")
            print(f"   User: {result.get('username', 'unknown')}")
            print(f"   Full Name: {result.get('full_name', 'unknown')}")
            print(f"   Organization: {result.get('organization', {}).get('name', 'none')}")
            print(f"   Role: {result.get('role', {}).get('display_name', 'none')}")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ Profile Test HTTP Error {e.code}: {error_body}")
    except Exception as e:
        print(f"❌ Profile Test failed: {e}")

def main():
    print("🔐 Session Management API Test")
    print("=" * 50)
    
    # 1. Login ve token al
    token = test_login()
    if not token:
        print("❌ Login başarısız, testler durduruluyor.")
        return
    
    print("\n" + "=" * 50)
    
    # 2. Profile test
    test_profile(token)
    
    print("\n" + "=" * 50)
    
    # 3. Session stats test
    test_session_stats(token)
    
    print("\n" + "=" * 50)
    
    # 4. User sessions test
    sessions = test_user_sessions(token)
    
    print("\n" + "=" * 50)
    
    # 5. All sessions test (admin only)
    test_all_sessions(token)
    
    print("\n" + "=" * 50)
    print("✅ Tüm testler tamamlandı!")

if __name__ == "__main__":
    main() 