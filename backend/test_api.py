import urllib.request, json, sys

try:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=json.dumps({"email": "hr@example.com", "password": "password123"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())["access_token"]
    
    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/recruitment/candidates/3/next-stage",
        data=b"{}",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    )
    res2 = urllib.request.urlopen(req2)
    print("SUCCESS", res2.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR:", e.code, e.read().decode())
