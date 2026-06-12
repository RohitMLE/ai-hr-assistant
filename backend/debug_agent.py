import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from fastapi.testclient import TestClient
from app.main import app
from scripts.seed import seed

def _login(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}

def main() -> None:
    seed()
    with TestClient(app) as client:
        employee_headers = _login(client, "vineet@example.com")
        agent_regularization = client.post(
            "/api/v1/agent/chat",
            headers=employee_headers,
            json={"message": "Regularize 2026-05-14 as present because I forgot to punch in"},
        )
        print(agent_regularization.status_code)
        print(agent_regularization.json())

if __name__ == "__main__":
    main()
