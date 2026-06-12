import requests

# 1. Login to get token
login_data = {"username": "hr@example.com", "password": "password123"}
r = requests.post("http://127.0.0.1:8000/api/v1/auth/login", data=login_data)
if r.status_code != 200:
    print("Login failed", r.text)
    exit(1)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 2. Try to move candidate 3 (Ankit Sharma) to next stage
r2 = requests.post("http://127.0.0.1:8000/api/v1/recruitment/candidates/3/next-stage", json={}, headers=headers)
print("Status:", r2.status_code)
print("Response:", r2.text)
