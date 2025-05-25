import requests

# Login
login_response = requests.post('http://localhost:8000/auth/login', json={
    'username': 'admin',
    'password': 'admin123'
})

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Test users endpoint
    headers = {'Authorization': f'Bearer {token}'}
    users_response = requests.get('http://localhost:8000/auth/users', headers=headers)
    
    print(f"Users endpoint status: {users_response.status_code}")
    if users_response.status_code == 200:
        data = users_response.json()
        print(f"✅ Users found: {data.get('total_count')}")
    else:
        print(f"❌ Users error: {users_response.text}")
        
    # Test admin stats
    stats_response = requests.get('http://localhost:8000/auth/admin/stats', headers=headers)
    print(f"Stats endpoint status: {stats_response.status_code}")
    if stats_response.status_code == 200:
        data = stats_response.json()
        print(f"✅ Stats: {data.get('user_stats')}")
    else:
        print(f"❌ Stats error: {stats_response.text}")
        
else:
    print(f"❌ Login failed: {login_response.text}") 