# Testing Checklist

## 1. Scope

Use this checklist when the MVP implementation begins. It covers backend, frontend, authentication, authorization, AI assistant behavior, and mock HRMS workflows.

## 2. Backend Tests

### Authentication

- Login succeeds with valid credentials.
- Login fails with invalid password.
- Login fails for inactive users.
- Protected endpoints reject missing JWT.
- Protected endpoints reject invalid JWT.
- `/auth/me` returns the authenticated user.

### Authorization

- Employee can access own profile.
- Employee cannot access another employee's profile.
- Manager can access direct reports.
- Manager cannot access non-report employees.
- HR admin can access all mock employee records.
- Role checks return `403` instead of leaking records.

### Employee Directory

- Employee profile response matches API contract.
- Employee list supports search and filters for HR admin.
- Invalid employee IDs return `404`.

### Leave

- Employee can fetch own leave balance.
- Employee can fetch own leave requests.
- Employee can create a valid leave request.
- Leave request rejects invalid date ranges.
- Leave request rejects unsupported leave type.
- Manager can view pending leave requests for direct reports.
- Manager can approve direct-report leave requests.
- Manager can reject direct-report leave requests.
- Manager cannot approve unrelated employee leave requests.
- Approved leave updates or validates against leave balance according to chosen implementation rule.

### Attendance

- Employee can view own monthly attendance summary.
- Manager can view direct-report attendance summary.
- HR admin can view any employee attendance summary.
- Summary counts present, absent, leave, and late days correctly.

### Payroll

- Employee can view own payslip summaries.
- Employee cannot view another employee's payslip.
- HR admin can view payroll summaries if the final implementation allows it.
- Payslip values are returned as summaries only.

### HR Policies

- Authenticated users can list active policies.
- Search returns relevant policies.
- HR admin can create or update policies.
- Non-admin users cannot manage policies.

## 3. AI Assistant Tests

### Tool Control

- Assistant only calls registered tools.
- Tool calls receive server-side authenticated user context.
- Tool calls enforce ownership and role checks.
- Unauthorized tool calls are denied and audited.
- Tool inputs are validated before execution.
- Tool outputs are sanitized before being sent to the model.

### Employee Questions

- Assistant answers own leave balance using `get_my_leave_balance`.
- Assistant answers own attendance summary using `get_my_attendance_summary`.
- Assistant answers own payslip summary using `get_my_payslip_summary`.
- Assistant does not guess when data is missing.
- Assistant states that it is using mock HRMS data when relevant.

### Manager Questions

- Manager can ask for direct-report leave summaries.
- Manager cannot ask for employees outside their reporting line.
- Assistant handles denied access gracefully.

### HR Policy Questions

- Assistant searches policy text for relevant answers.
- Assistant cites or names the policy source where possible.
- Assistant does not invent policy details not present in stored policy text.

### Mutating Actions

- Assistant asks for confirmation before creating a leave request.
- Assistant does not approve, reject, or create records from a single ambiguous prompt.
- Confirmed leave request creation is audited.

## 4. Frontend Tests

### Login

- Login page submits credentials.
- Successful login stores auth state.
- Failed login shows an error.
- Logout clears auth state.

### Navigation

- Employee sees employee navigation only.
- Manager sees manager views.
- HR admin sees admin views.
- Unauthorized screens are not accessible by route changes.

### Employee Dashboard

- Profile card renders.
- Leave balance renders.
- Recent leave requests render.
- Attendance summary renders.
- Payslip summary renders.
- Loading and empty states render correctly.

### Manager Dashboard

- Direct reports render.
- Pending leave requests render.
- Approve and reject actions update the UI.
- Error states are visible for failed actions.

### Assistant Chat

- User can send a message.
- Loading state appears while waiting.
- Assistant answer renders.
- Tool metadata can be shown in a minimal way if included.
- Error state appears for failed assistant requests.
- Chat does not expose hidden system prompts or raw sensitive tool outputs.

## 5. Integration Tests

- Login, fetch profile, and fetch dashboard data.
- Employee creates leave request, manager approves it, employee sees updated status.
- Assistant answers leave balance from the same data shown in the dashboard.
- Manager access boundaries are enforced across API and assistant.
- HR admin can view audit logs after assistant tool calls.

## 6. Security Checks

- Passwords are hashed, not stored in plain text.
- JWT secret is loaded from environment configuration.
- CORS is restricted to the frontend origin in non-local environments.
- API does not return password hashes.
- API does not return another employee's sensitive data without authorization.
- Assistant audit logs do not store unnecessary sensitive payloads.
- Error messages do not expose stack traces in normal API responses.

## 7. Manual MVP Acceptance

- Start backend successfully.
- Start frontend successfully.
- Seed mock users and HRMS data.
- Log in as employee, manager, and HR admin.
- Complete core workflows for each role.
- Verify assistant refuses unauthorized access.
- Verify the product clearly remains a mock Darwinbox-like HRMS POC.

## 8. HRMS Expansion Test Rules

Use these rules for every new HRMS module after Phase 1.

- API tests cover list, create, detail, update, status transition, invalid payload, not found, and forbidden cases.
- Permission tests cover employee, manager/department manager, HR/admin owner roles, and unrelated users.
- Workflow tests verify legal status transitions and reject skipped or repeated approvals.
- Frontend tests cover loading, empty, error, success, validation, role-hidden controls, and unauthorized route access.
- Audit tests verify sensitive reads/writes and approvals create usable audit records without storing unnecessary sensitive payloads.
- Seed tests verify mock fixtures are deterministic and do not imply real Darwinbox data.

## 9. Phase 1 Core HR Tests To Add First

- Run `PYTHONPYCACHEPREFIX=/tmp/ai-hr-pycache backend/.venv/bin/python backend/scripts/phase1_smoke.py` after migrations or Phase 1 route changes.
- HR admin can create an employee with department, designation, work location, employment type, manager, joining date, and contact fields.
- Employee code generation is deterministic and unique.
- HR admin can update employee master fields.
- Manager can view only direct-report detail, documents, emergency contacts, and job history.
- Manager cannot view unrelated employee sensitive detail.
- Employee can view own allowed subresources.
- Employee cannot verify documents or edit restricted profile fields.
- Bank details are visible only to the employee and HR admin.
- Candidate-to-employee conversion creates one employee record, links department data correctly, and cannot duplicate an existing employee.
- Core HR writes and candidate conversion create audit logs.

## 10. Future Module Test Matrix

| Module | Required Workflow Tests |
| --- | --- |
| Onboarding | Accepted candidate creates onboarding case; checklist completion changes status; document rejection blocks completion |
| Attendance | Clock/record summary is correct; regularization approval updates summary; manager cannot approve unrelated correction |
| Leave | Balance validation; approval/rejection transitions; payroll-impact metadata after approval |
| Payroll | Payroll run uses locked inputs; payslip is visible only to owner/authorized payroll roles; approved run cannot be silently changed |
| Travel & Expense | Travel approval gates expense claim; finance verification gates reimbursement; attachment metadata validation |
| Performance | Goal creation, self review, manager review, final rating, and locked cycle behavior |
| Learning | Course assignment, progress update, completion, certificate metadata validation |
| Engagement | Survey/poll visibility, one response per user, anonymous result handling if enabled |
| Rewards | Recognition creation, points ledger entry, no self-award where disallowed |
| Assets | Assignment, return, damage status, employee asset visibility |
| Helpdesk | Ticket create, assign, comment, resolve, SLA state |
| Compliance | Policy publish, acknowledgment, report visibility, inactive policy hiding |
| Workforce Planning | Department plan creation, approval, budget/headcount validation |
| Analytics | Counts match source records and respect role filters |
| Exit | Resignation, approval, clearance tasks, asset return, final settlement readiness |
