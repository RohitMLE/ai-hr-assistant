from datetime import date
from decimal import Decimal

from app.models.attendance_record import AttendanceRecord
from app.models.hr_policy import HRPolicy
from app.models.leave_balance import LeaveBalance


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check(client):
    response = client.get("/readiness")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_login_failure_returns_standard_error(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "bad"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_login_success(client, hr_admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": hr_admin_user.email, "password": "pass"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "hr_admin"


def test_employee_profile(client, employee_user, employee_token):
    response = client.get(
        "/api/v1/auth/employee/me",
        headers=auth_header(employee_token),
    )

    assert response.status_code == 200
    assert response.json()["employee_code"] == employee_user.employee_code


def test_leave_balance(client, db_session, employee_user, employee_token):
    db_session.add(
        LeaveBalance(
            user_id=employee_user.id,
            leave_type="casual_leave",
            total_days=Decimal("12.0"),
            used_days=Decimal("2.0"),
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/leave/balance",
        headers=auth_header(employee_token),
    )

    assert response.status_code == 200
    balances = response.json()["balances"]
    assert balances[0]["leave_type"] == "casual_leave"
    assert balances[0]["remaining_days"] == "10.0"


def test_attendance_summary(client, db_session, employee_user, employee_token):
    db_session.add_all(
        [
            AttendanceRecord(
                user_id=employee_user.id,
                work_date=date(2026, 6, 1),
                status="present",
                check_in="09:30",
                check_out="18:00",
            ),
            AttendanceRecord(
                user_id=employee_user.id,
                work_date=date(2026, 6, 2),
                status="absent",
            ),
        ]
    )
    db_session.commit()

    response = client.get(
        "/api/v1/attendance/summary",
        params={"month": "2026-06"},
        headers=auth_header(employee_token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["present_days"] == 1
    assert body["absent_days"] == 1


def test_policy_search(client, db_session, employee_token):
    db_session.add(
        HRPolicy(
            title="Leave Policy",
            category="Time Off",
            content="Employees can request casual leave from their available balance.",
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/compliance/policies/search",
        params={"q": "casual"},
        headers=auth_header(employee_token),
    )

    assert response.status_code == 200
    assert response.json()["items"][0]["title"] == "Leave Policy"


def test_assistant_chat_local_leave_confirmation(client, employee_token):
    response = client.post(
        "/api/v1/agent/chat",
        json={"message": "Apply casual leave for 2026-06-24 because family work"},
        headers=auth_header(employee_token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["requires_confirmation"] is True
    assert body["pending_action_id"] is not None
    assert body["tool_calls"][0]["tool_name"] == "apply_leave"
