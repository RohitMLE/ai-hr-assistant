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
