from datetime import date

from app.models.employee_profile import EmployeeBankDetail, EmployeeDocument
from app.models.exit import ExitRequest


def test_get_employee_detail_self(client, employee_token, employee_user):
    response = client.get(
        f"/api/v1/employees/{employee_user.id}",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "employee@example.com"

def test_get_employee_detail_manager_access(client, manager_token, employee_user):
    response = client.get(
        f"/api/v1/employees/{employee_user.id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert response.status_code == 200

def test_employee_cannot_view_manager_detail(client, employee_token, manager_user):
    response = client.get(
        f"/api/v1/employees/{manager_user.id}",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403

def test_update_employee_by_hr_admin(client, hr_admin_token, employee_user):
    response = client.patch(
        f"/api/v1/employees/{employee_user.id}",
        json={"phone": "+91-9999999999"},
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["phone"] == "+91-9999999999"

def test_employee_cannot_update_employee(client, employee_token, employee_user):
    response = client.patch(
        f"/api/v1/employees/{employee_user.id}",
        json={"phone": "+91-9999999999"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403

def test_add_document(client, employee_token, employee_user):
    response = client.post(
        f"/api/v1/employees/{employee_user.id}/documents",
        json={"doc_type": "id_proof", "file_url": "http://example.com/id.pdf"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 201
    assert response.json()["doc_type"] == "id_proof"


def test_employee_central_self_includes_lifecycle_data(client, db_session, employee_token, employee_user):
    employee_user.date_of_joining = date(2026, 1, 1)
    db_session.add_all(
        [
            EmployeeDocument(
                employee_id=employee_user.id,
                doc_type="id_proof",
                file_name="id-proof.pdf",
                verified=True,
            ),
            EmployeeBankDetail(
                employee_id=employee_user.id,
                bank_name="HDFC Bank",
                account_number="123456789012",
                ifsc_code="HDFC0001234",
                account_holder_name=employee_user.name,
                is_primary=True,
            ),
            ExitRequest(
                employee_id=employee_user.id,
                reason="Relocation",
                requested_last_day=date(2026, 7, 31),
            ),
        ]
    )
    db_session.commit()

    response = client.get(
        "/api/v1/employees/me/central",
        headers={"Authorization": f"Bearer {employee_token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == employee_user.id
    assert body["bank_details"][0]["bank_name"] == "HDFC Bank"
    assert body["probation"]["status"] in {"in_probation", "confirmed"}
    assert body["exit_status"]["status"] == "Pending"
    assert any(item["event_type"] == "document" for item in body["timeline"])


def test_manager_employee_central_hides_direct_report_bank_details(
    client,
    db_session,
    manager_token,
    employee_user,
):
    db_session.add(
        EmployeeBankDetail(
            employee_id=employee_user.id,
            bank_name="HDFC Bank",
            account_number="123456789012",
            ifsc_code="HDFC0001234",
            account_holder_name=employee_user.name,
            is_primary=True,
        )
    )
    db_session.commit()

    response = client.get(
        f"/api/v1/employees/{employee_user.id}",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    assert response.status_code == 200
    assert response.json()["bank_details"] == []
