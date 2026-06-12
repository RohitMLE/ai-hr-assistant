from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from fastapi.testclient import TestClient

from app.main import app
from scripts.seed import seed


def _login(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


def main() -> None:
    seed()
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200

        hr_headers = _login(client, "hr@example.com")
        manager_headers = _login(client, "manager@example.com")
        employee_headers = _login(client, "vineet@example.com")

        assert client.get("/api/v1/employees", headers=hr_headers).status_code == 200
        assert client.get("/api/v1/employees", headers=manager_headers).status_code == 200
        assert client.get("/api/v1/employees", headers=employee_headers).status_code == 403

        recruitment = client.get("/api/v1/recruitment/dashboard", headers=manager_headers)
        assert recruitment.status_code == 200, recruitment.text
        candidates = recruitment.json()["active_candidates"]
        applied = next(candidate for candidate in candidates if candidate["status"] == "applied")
        offered = next(candidate for candidate in candidates if candidate["status"] == "offered")

        create_job = client.post(
            "/api/v1/recruitment/jobs",
            headers=manager_headers,
            json={
                "title": "Smoke Test HR Analyst",
                "department_id": 2,
                "description": "Temporary smoke-test opening.",
                "status": "open",
            },
        )
        assert create_job.status_code == 200, create_job.text
        assert create_job.json()["title"] == "Smoke Test HR Analyst"

        move_stage = client.post(
            f"/api/v1/recruitment/candidates/{applied['id']}/next-stage",
            headers=manager_headers,
            json={},
        )
        assert move_stage.status_code == 200, move_stage.text
        assert move_stage.json()["status"] == "shortlisted"

        onboarding_dashboard = client.get("/api/v1/onboarding/dashboard", headers=manager_headers)
        assert onboarding_dashboard.status_code == 200, onboarding_dashboard.text
        assert onboarding_dashboard.json()["active_cases"] >= 1

        employee_onboarding = client.get("/api/v1/onboarding/dashboard", headers=employee_headers)
        assert employee_onboarding.status_code == 403

        agent_leave = client.post(
            "/api/v1/agent/chat",
            headers=employee_headers,
            json={"message": "Apply casual leave for 2026-05-24 because family work"},
        )
        assert agent_leave.status_code == 200, agent_leave.text
        assert agent_leave.json()["requires_confirmation"] is True
        assert agent_leave.json()["tool_calls"][0]["tool_name"] == "apply_leave"

        confirm_leave = client.post(
            "/api/v1/agent/chat",
            headers=employee_headers,
            json={"message": "confirm"},
        )
        assert confirm_leave.status_code == 200, confirm_leave.text
        assert confirm_leave.json()["requires_confirmation"] is False
        assert confirm_leave.json()["data"]["status"] == "pending"

        agent_regularization = client.post(
            "/api/v1/agent/chat",
            headers=employee_headers,
            json={"message": "Regularize 2026-05-14 as present because I forgot to punch in"},
        )
        assert agent_regularization.status_code == 200, agent_regularization.text
        assert agent_regularization.json()["requires_confirmation"] is True
        assert agent_regularization.json()["tool_calls"][0]["tool_name"] == "apply_attendance_regularization"

        confirm_regularization = client.post(
            "/api/v1/agent/chat",
            headers=employee_headers,
            json={"message": "yes"},
        )
        assert confirm_regularization.status_code == 200, confirm_regularization.text
        assert confirm_regularization.json()["data"]["status"] == "pending"

        onboarding_cases = client.get("/api/v1/onboarding/cases", headers=manager_headers)
        assert onboarding_cases.status_code == 200, onboarding_cases.text
        cases = onboarding_cases.json()["items"]
        assert cases, "Expected seeded onboarding cases"
        task = next(task for case in cases for task in case["tasks"] if task["status"] != "completed")

        task_update = client.patch(
            f"/api/v1/onboarding/tasks/{task['id']}",
            headers=manager_headers,
            json={"status": "completed", "notes": "Smoke test completion"},
        )
        assert task_update.status_code == 200, task_update.text
        assert task_update.json()["status"] == "completed"

        hire = client.post(
            f"/api/v1/recruitment/candidates/{offered['id']}/hire",
            headers=hr_headers,
        )
        assert hire.status_code == 200, hire.text
        assert hire.json()["role"] == "employee"

        linked_cases = client.get("/api/v1/onboarding/cases", headers=hr_headers).json()["items"]
        linked_case = next(case for case in linked_cases if case["candidate_id"] == offered["id"])
        assert linked_case["employee_id"] == hire.json()["id"]

    print("Phase 1 smoke checks passed.")


if __name__ == "__main__":
    main()
