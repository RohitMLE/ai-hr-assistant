# AI HR Assistant MVP Build Spec

## 1. Overview

Build a full-stack MVP for an **AI HR Assistant for a Darwinbox-like HRMS**.

This is a mock HRMS proof of concept. It must not integrate with real Darwinbox, use real employee data, or imply official Darwinbox compatibility.

The MVP should demonstrate how an employee, manager, or HR admin could interact with HRMS data through a controlled AI assistant and a conventional web UI.

## 2. Goals

- Provide a mock HRMS data model for employees, departments, leave, attendance, payroll summaries, and HR policies.
- Provide authenticated role-based access with JWT.
- Provide REST APIs for core HRMS workflows.
- Provide a React + Tailwind frontend for the main workflows.
- Provide a controlled AI assistant that can answer HRMS questions using approved backend tools.
- Prepare for future RAG-based HR policy PDF Q&A.

## 3. Non-Goals

- Do not connect to real Darwinbox.
- Do not build production payroll processing.
- Do not process real employee records.
- Do not implement enterprise SSO in the MVP.
- Do not implement PDF ingestion or vector search in the first build unless requested later.
- Do not let the AI model directly access the database or execute arbitrary tools.

## 4. Target Users

### Employee

Can:

- Log in.
- View personal profile.
- View leave balances.
- View own leave requests.
- Submit a leave request.
- View attendance summary.
- View payslip summary.
- Ask the AI assistant questions about own HR data and policies.

### Manager

Can:

- Use employee features.
- View direct reports.
- View direct reports' pending leave requests.
- Approve or reject leave requests.
- Ask the AI assistant for direct-report summaries within allowed scope.

### HR Admin

Can:

- Use manager features.
- View and manage mock employee records.
- View organization-wide leave and attendance summaries.
- View assistant audit logs.
- Manage mock HR policies.

## 5. MVP Modules

### Authentication

- Email/password login.
- JWT access token.
- Role included in authenticated user context.
- Passwords stored as hashes.

### Employee Directory

- Employee profile.
- Department and manager relationship.
- Employment metadata.
- Mock employee records only.

### Leave Management

- Leave balances by type.
- Leave request creation.
- Leave request status tracking.
- Manager approval and rejection.

### Attendance

- Daily attendance records.
- Monthly attendance summary.
- Late days and absent days summary.

### Payroll Summary

- Monthly payslip summary.
- Earnings, deductions, and net pay.
- No real payroll processing.

### HR Policies

- Basic policy records stored in SQLite.
- Text-based policy Q&A for MVP.
- Future PDF ingestion and RAG.

### AI Assistant

- Chat endpoint accepts a user message.
- Backend determines authenticated user and role.
- AI layer chooses from a small approved tool list.
- Tool calls are validated server-side.
- Responses include concise answers and source/tool metadata where useful.

## 6. Controlled Tool-Calling Layer

The assistant should not directly query the database. It should call backend-owned tools such as:

- `get_my_profile`
- `get_my_leave_balance`
- `get_my_leave_requests`
- `create_leave_request_draft`
- `get_my_attendance_summary`
- `get_my_payslip_summary`
- `search_hr_policies`
- `get_direct_reports`
- `get_pending_leave_requests_for_manager`

Each tool must:

- Receive authenticated user context from the server.
- Enforce role and ownership checks.
- Validate inputs with typed schemas.
- Return structured data.
- Produce an audit log entry.

## 7. Recommended Future Project Structure

Do not create this structure until implementation starts.

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    services/
    ai/
    tools/
    tests/
frontend/
  src/
    api/
    components/
    pages/
    routes/
    state/
    styles/
docs/
```

## 8. Backend Requirements

- Use FastAPI.
- Use SQLAlchemy ORM.
- Use SQLite for local development.
- Use Pydantic schemas for request and response validation.
- Use JWT auth for protected routes.
- Use role-based authorization dependencies.
- Keep business logic in services, not route handlers.
- Keep AI tool execution separate from HTTP controllers.

## 9. Frontend Requirements

- Use React.
- Use Tailwind CSS.
- Provide login flow.
- Store JWT securely enough for MVP constraints.
- Provide role-aware navigation.
- Build dashboard views for employee, manager, and HR admin.
- Provide an assistant chat panel with clear loading, error, and empty states.
- Do not over-style as a marketing landing page; this is an operational HR tool.

## 10. AI Safety Requirements

- The assistant must identify itself as connected only to the mock HRMS.
- It must not claim access to real Darwinbox.
- It must refuse unauthorized data access.
- It must ask for confirmation before creating or changing records.
- It must use tools for factual HRMS answers.
- It must avoid guessing about employee-specific data.
- It must include a clear fallback when data is unavailable.

## 11. Seed Data Requirements

When implementation begins, include mock data for:

- 1 HR admin
- 1 manager
- 3 employees
- 2 departments
- Leave balances
- Leave requests in multiple statuses
- Attendance records for the current and previous month
- Payslip summaries
- HR policy text records

## 12. MVP Acceptance Criteria

- User can log in and receive a JWT.
- Employee can view own HRMS data.
- Manager can act on direct-report leave requests.
- HR admin can view mock organization data.
- Assistant can answer approved HR questions through controlled tools.
- Assistant cannot access unauthorized employee data.
- API and database behavior match the docs in this repository.

