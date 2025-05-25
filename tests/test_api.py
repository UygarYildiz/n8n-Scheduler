#!/usr/bin/env python3
"""
API Test Script - Authentication endpoints test
"""
import json
import urllib.request
import urllib.parse
import sys

def test_health():
    """Health endpoint test"""
    try:
        req = urllib.request.Request('http://localhost:8000/health')
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("✅ Health Check:")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Database: {data.get('database_connection', 'unknown')}")
            print(f"   Message: {data.get('message', 'N/A')}")
            return True
    except Exception as e:
        print(f"❌ Health Check failed: {e}")
        return False

def test_login():
    """Login endpoint test"""
    try:
        # Login data
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        # Prepare request
        data = json.dumps(login_data).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/auth/login',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Send request
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ Login Test:")
            print(f"   Token type: {result.get('token_type', 'unknown')}")
            print(f"   Expires in: {result.get('expires_in', 'unknown')} seconds")
            print(f"   User: {result.get('user', {}).get('username', 'unknown')}")
            print(f"   Organization: {result.get('user', {}).get('organization', {}).get('name', 'none')}")
            print(f"   Role: {result.get('user', {}).get('role', {}).get('display_name', 'none')}")
            
            return result.get('access_token')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ Login Test HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Login Test failed: {e}")
        return None

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
            print(f"   Full name: {result.get('full_name', 'unknown')}")
            print(f"   Email: {result.get('email', 'unknown')}")
            print(f"   Active: {result.get('is_active', 'unknown')}")
            return True
    except Exception as e:
        print(f"❌ Profile Test failed: {e}")
        return False

def main():
    print("🚀 API Authentication Test Starting...")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("API is not running or unhealthy!")
        sys.exit(1)
    
    print()
    
    # Test login
    token = test_login()
    if not token:
        print("Login failed!")
        sys.exit(1)
    
    print()
    
    # Test profile
    test_profile(token)
    
    print()
    print("=" * 50)
    print("🎉 All tests completed!")

if __name__ == "__main__":
    main() 