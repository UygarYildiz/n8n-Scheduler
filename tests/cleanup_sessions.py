import urllib.request
import json

# Login
login_data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode()
req = urllib.request.Request('http://localhost:8000/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode())
    token = result['access_token']

# Get all sessions
req = urllib.request.Request('http://localhost:8000/auth/sessions/all', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as response:
    sessions = json.loads(response.read().decode())
    
print(f'Toplam session: {sessions["total_count"]}')

# Keep only the latest session, revoke others
sessions_list = sessions['sessions']
if len(sessions_list) > 1:
    # Sort by created_at (newest first)
    sessions_list.sort(key=lambda x: x['created_at'], reverse=True)
    
    # Keep the first (newest), revoke the rest
    for session in sessions_list[1:]:
        try:
            req = urllib.request.Request(
                f'http://localhost:8000/auth/sessions/{session["id"]}',
                headers={'Authorization': f'Bearer {token}'},
                method='DELETE'
            )
            with urllib.request.urlopen(req) as response:
                print(f'Revoked session {session["id"]} (created: {session["created_at"][:19]})')
        except Exception as e:
            print(f'Failed to revoke session {session["id"]}: {e}')

print('Session cleanup completed!') 