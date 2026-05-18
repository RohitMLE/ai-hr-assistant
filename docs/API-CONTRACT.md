# API Contract

## 1. General

Base path:

```text
/api/v1
```

Content type:

```text
application/json
```

Authentication:

```text
Authorization: Bearer <jwt_access_token>
```

All protected endpoints require a valid JWT.

## 2. Standard Error Shape

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common status codes:

- `400`: Invalid request.
- `401`: Missing or invalid token.
- `403`: Insufficient role or ownership.
- `404`: Resource not found.
- `409`: Conflicting state.
- `422`: Validation error.
- `500`: Unexpected server error.

## 3. Auth

### POST `/auth/login`

Request:

```json
{
  "email": "employee@example.com",
  "password": "password"
}
```

Response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "employee_id": 1,
    "email": "employee@example.com",
    "role": "employee",
    "full_name": "Asha Mehta"
  }
}
```

### GET `/auth/me`

Response:

```json
{
  "id": 1,
  "employee_id": 1,
  "email": "employee@example.com",
  "role": "employee",
  "full_name": "Asha Mehta"
}
```

## 4. Employees

### GET `/employees/me`

Returns the authenticated user's employee profile.

Response:

```json
{
  "id": 1,
  "employee_code": "EMP001",
  "full_name": "Asha Mehta",
  "email": "asha@example.com",
  "department": "Engineering",
  "designation": "Software Engineer",
  "manager_id": 2,
  "employment_status": "active",
  "date_of_joining": "2024-04-01"
}
```

### GET `/employees/{employee_id}`

Allowed for:

- Same employee.
- Manager of the employee.
- HR admin.

### GET `/employees`

Allowed for HR admin.

Query parameters:

- `department_id`
- `employment_status`
- `search`
- `limit`
- `offset`

## 5. Manager

### GET `/manager/direct-reports`

Allowed for manager and HR admin.

Response:

```json
{
  "items": [
    {
      "id": 3,
      "employee_code": "EMP003",
      "full_name": "Ravi Kumar",
      "designation": "QA Engineer",
      "employment_status": "active"
    }
  ]
}
```

## 6. Leave

### GET `/leave/balances/me`

Response:

```json
{
  "employee_id": 1,
  "balances": [
    {
      "leave_type": "annual",
      "total_days": 18,
      "used_days": 4,
      "remaining_days": 14
    }
  ]
}
```

### GET `/leave/requests/me`

Response:

```json
{
  "items": [
    {
      "id": 10,
      "leave_type": "annual",
      "start_date": "2026-06-10",
      "end_date": "2026-06-12",
      "days": 3,
      "reason": "Family event",
      "status": "pending",
      "created_at": "2026-05-18T10:00:00Z"
    }
  ]
}
```

### POST `/leave/requests`

Creates a leave request for the authenticated employee.

Request:

```json
{
  "leave_type": "annual",
  "start_date": "2026-06-10",
  "end_date": "2026-06-12",
  "reason": "Family event"
}
```

Response status: `201`

### GET `/leave/requests/pending`

Allowed for manager and HR admin.

Managers see only direct reports. HR admins see all pending requests.

### POST `/leave/requests/{request_id}/approve`

Allowed for the employee's manager or HR admin.

Request:

```json
{
  "comment": "Approved"
}
```

### POST `/leave/requests/{request_id}/reject`

Allowed for the employee's manager or HR admin.

Request:

```json
{
  "comment": "Insufficient balance"
}
```

## 7. Attendance

### GET `/attendance/me/summary`

Query parameters:

- `month`: `YYYY-MM`

Response:

```json
{
  "employee_id": 1,
  "month": "2026-05",
  "working_days": 22,
  "present_days": 18,
  "absent_days": 1,
  "leave_days": 2,
  "late_days": 3
}
```

### GET `/attendance/{employee_id}/summary`

Allowed for same employee, manager of employee, or HR admin.

## 8. Payroll

### GET `/payroll/me/payslips`

Response:

```json
{
  "items": [
    {
      "id": 7,
      "month": "2026-04",
      "gross_pay": 120000,
      "deductions": 18000,
      "net_pay": 102000,
      "currency": "INR"
    }
  ]
}
```

### GET `/payroll/me/payslips/{payslip_id}`

Returns the authenticated employee's payslip summary.

## 9. HR Policies

### GET `/policies`

Allowed for authenticated users.

Query parameters:

- `category`
- `search`

### GET `/policies/{policy_id}`

Allowed for authenticated users.

### POST `/policies`

Allowed for HR admin.

Request:

```json
{
  "title": "Annual Leave Policy",
  "category": "leave",
  "content": "Employees are eligible for annual leave as per company policy."
}
```

## 10. AI Assistant

### POST `/assistant/chat`

Sends a message to the controlled AI assistant.

Request:

```json
{
  "message": "How many annual leave days do I have left?",
  "conversation_id": "optional-conversation-id"
}
```

Response:

```json
{
  "conversation_id": "conv_123",
  "answer": "You have 14 annual leave days remaining.",
  "tool_calls": [
    {
      "tool_name": "get_my_leave_balance",
      "status": "success"
    }
  ]
}
```

Tool calls are server-controlled and must enforce role and ownership checks.

### GET `/assistant/conversations`

Returns recent conversations for the authenticated user.

### GET `/assistant/audit-logs`

Allowed for HR admin.

Returns assistant tool-call audit logs.

## 11. Role Matrix

| Area | Employee | Manager | HR Admin |
| --- | --- | --- | --- |
| Own profile | Read | Read | Read |
| Other employee profile | No | Direct reports only | Read |
| Own leave | Read/create | Read/create | Read/create |
| Approve leave | No | Direct reports only | Yes |
| Attendance | Own only | Direct reports | All |
| Payroll | Own only | No by default | All summaries |
| Policies | Read | Read | Manage |
| Assistant audit logs | No | No | Read |

