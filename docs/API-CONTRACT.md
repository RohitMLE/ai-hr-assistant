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

## 11. Active Modular API Areas

The active FastAPI app includes routers from `backend/app/api/v1`. New work should add one router per HRMS module and include it from `backend/app/api/v1/__init__.py`.

Current implemented or partially implemented areas:

| Area | Active Prefix | Notes |
| --- | --- | --- |
| Auth | `/api/v1/auth` | Login and current user. |
| Employees | `/api/v1/employees` | Core HR employee master and sensitive subresources. |
| Org | `/api/v1/org` | Departments, designations, and hierarchy reference data. |
| Recruitment | `/api/v1/recruitment` | Dashboard and candidate-to-employee conversion. |
| Onboarding | `/api/v1/onboarding` | Cases, checklist tasks, dashboard, and task status updates. |
| Attendance | `/api/v1/attendance` | Summary and regularization workflows. |
| Leave | `/api/v1/leave` | Balances, requests, and manager decisions. |
| Payroll | `/api/v1/payroll` | Payslip summary workflows. |
| Compliance | `/api/v1/compliance` | Policy/compliance workflows. |
| Audit | `/api/v1/audit` | HR admin audit log access. |
| Agent | `/api/v1/agent` | Controlled assistant chat. |

Legacy route files or endpoint names should not be expanded. Prefer the modular prefixes above and update callers incrementally when contracts change.

## 12. HRMS Expansion Endpoint Map

Use REST APIs with versioned module prefixes. Each write, approval, conversion, payroll-facing action, and sensitive HR read should validate permissions on the backend and emit an audit log where appropriate.

| Module | Endpoint Family | Key Endpoints |
| --- | --- | --- |
| Core HR | `/api/v1/employees` | `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, document/bank/contact/job-history subresources |
| Org | `/api/v1/org` | `GET /hierarchy`, future departments/designations CRUD |
| Recruitment | `/api/v1/recruitment` | Jobs, candidates, interviews, offers, candidate hire conversion |
| Onboarding | `/api/v1/onboarding` | Cases, checklist tasks, document verification, policy acknowledgments |
| Attendance | `/api/v1/attendance` | My/team summary, clock records, regularization, shift/holiday references |
| Leave | `/api/v1/leave` | Types, balances, requests, approvals, comp-off, encashment |
| Payroll | `/api/v1/payroll` | Salary structures, runs, payslips, approvals, full-and-final settlement |
| Travel | `/api/v1/travel-requests` | Travel request creation, approval, status tracking |
| Expense | `/api/v1/expense-claims` | Claim creation, bill attachment metadata, manager approval, finance verification |
| Performance | `/api/v1/performance` | Goals, cycles, self reviews, manager reviews, feedback |
| Learning | `/api/v1/learning` | Courses, assignments, progress, certifications, skills |
| Engagement | `/api/v1/engagement` | Announcements, surveys, polls, responses |
| Rewards | `/api/v1/rewards` | Recognition feed, badges, points history |
| Assets | `/api/v1/assets` | Inventory, assignment, return, damage status |
| Helpdesk | `/api/v1/helpdesk` | Tickets, comments, SLA status, assignment |
| Compliance | `/api/v1/compliance` and `/api/v1/policies` | Policies, acknowledgments, checklists |
| Workforce Planning | `/api/v1/workforce-planning` | Headcount plans, budgets, skill gaps, forecasts |
| Analytics | `/api/v1/analytics` | Department counts, trends, funnels, cost summaries |
| Exit | `/api/v1/exits` | Resignation, approval, clearance, F&F, letters |

## 13. Endpoint Design Rules

- Keep route handlers thin; delegate business rules to `backend/app/services`.
- Use Pydantic schemas for every request and response shape.
- Do not allow unrestricted SQL, dynamic model access, or prompt-driven database queries.
- Enforce ownership, reporting-line, role, and permission checks server-side.
- Keep file upload endpoints restricted to validated metadata until real storage is explicitly introduced.
- Return `403` for unauthorized access without leaking whether sensitive records exist.
- Use status transitions rather than free-form status mutation for approvals and workflow steps.
- Keep mock payroll, mock HRMS, and non-Darwinbox wording clear in API descriptions.

## 14. Role Matrix

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

Future roles such as `super_admin`, `hr_manager`, `recruiter`, `hiring_manager`, `finance_manager`, `payroll_manager`, `department_manager`, and `it_admin_staff` should be backed by `roles`, `permissions`, and `role_permissions`, not hardcoded frontend checks alone.
