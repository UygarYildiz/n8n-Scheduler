import urllib.request
import json

# Login
login_data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode()
req = urllib.request.Request('http://localhost:8000/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode())
    token = result['access_token']

# Session stats
req = urllib.request.Request('http://localhost:8000/auth/sessions/stats', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as response:
    stats = json.loads(response.read().decode())
    print('Session Stats:')
    print(f'  Aktif oturum: {stats["active_sessions"]}')
    print(f'  Aktif kullanıcı: {stats["active_users"]}')

# All sessions
req = urllib.request.Request('http://localhost:8000/auth/sessions/all', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as response:
    sessions = json.loads(response.read().decode())
    print(f'\nToplam session: {sessions["total_count"]}')
    for i, session in enumerate(sessions['sessions']):
        print(f'  Session {i+1}: ID={session["id"]}, Created={session["created_at"][:19]}') 