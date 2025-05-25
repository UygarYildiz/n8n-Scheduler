#!/usr/bin/env python3
"""
Detailed API Test Script - Authentication endpoints test with detailed error reporting
"""
import json
import urllib.request
import urllib.parse
import urllib.error
import sys

def test_login_detailed():
    """Detailed login endpoint test"""
    try:
        # Login data
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        print(f"🔍 Attempting login with: {login_data}")
        
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
            print("✅ Login Success!")
            print(f"Response: {json.dumps(result, indent=2)}")
            return result.get('access_token')
            
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        try:
            error_body = e.read().decode()
            print(f"Error details: {error_body}")
            error_json = json.loads(error_body)
            print(f"Parsed error: {json.dumps(error_json, indent=2)}")
        except:
            print("Could not parse error response")
        return None
    except Exception as e:
        print(f"❌ General Error: {e}")
        return None

def test_health_detailed():
    """Detailed health endpoint test"""
    try:
        req = urllib.request.Request('http://localhost:8000/health')
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("✅ Health Check Success!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
    except Exception as e:
        print(f"❌ Health Check failed: {e}")
        return False

def main():
    print("🔍 Detailed API Test Starting...")
    print("=" * 50)
    
    # Test health
    print("Testing health endpoint...")
    test_health_detailed()
    
    print("\n" + "=" * 50)
    
    # Test login
    print("Testing login endpoint...")
    token = test_login_detailed()
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main() 