def test_hr_admin_can_view_all_employees(client, hr_admin_token):
    response = client.get(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 200

def test_manager_can_view_employees(client, manager_token):
    response = client.get(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert response.status_code == 200

def test_employee_cannot_view_all_employees(client, employee_token):
    response = client.get(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403

def test_manager_cannot_add_employee(client, manager_token):
    response = client.post(
        "/api/v1/employees",
        json={"name": "Test", "email": "test@test.com", "department_id": 1},
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert response.status_code == 403

def test_hr_admin_can_add_employee(client, hr_admin_token):
    response = client.post(
        "/api/v1/employees",
        json={
            "name": "Test Employee",
            "email": "test@example.com",
            "department_id": 1,
            "role": "employee"
        },
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 201

def test_employee_cannot_approve_leave(client, employee_token):
    response = client.post(
        "/api/v1/leave/manager/1/approve",
        json={"comment": "OK"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403

def test_manager_can_approve_leave(client, manager_token):
    # This will return 404 because leave doesn't exist, but NOT 403
    response = client.post(
        "/api/v1/leave/manager/1/approve",
        json={"comment": "OK"},
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert response.status_code != 403
