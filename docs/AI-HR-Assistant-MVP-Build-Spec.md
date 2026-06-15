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

## 13. Current Repository Audit

The repository now contains an active FastAPI + React implementation in addition to the planning documents. Future work must preserve existing behavior and avoid rebuilding modules that are already present.

### Backend Structure Observed

```text
backend/
  app/
    api/v1/              # Modular FastAPI routers currently included by app/main.py
    agent/               # Controlled tool registry/executor/service
    core/                # Security and configuration
    db/                  # SQLAlchemy base/session/init
    models/              # User, org, employee profile, leave, attendance, payroll, policy, recruitment
    schemas/             # Pydantic request/response schemas
    services/            # Business logic services
  alembic/               # Versioned migrations
  scripts/               # Seed and verification scripts
```

`backend/app/api/routes.py` is an older monolithic route file. The running app imports `backend/app/api/v1/__init__.py`, so new modules should continue the `api/v1/<module>.py` pattern instead of adding to the monolithic file.

### Frontend Structure Observed

```text
frontend/src/
  api/client.js
  api/hrms.js
  api/modules/           # Module-level API wrappers
  auth/AuthContext.jsx
  components/            # Shared layout, protected route, badge, alert, loading, empty state
  pages/                 # Operational HRMS pages
  utils/
```

The frontend uses React routes, role-aware `ProtectedRoute`, Tailwind utility classes, and module API wrappers. Redux is not currently present in the observed files; do not introduce it unless a later implementation need justifies the added complexity.

### Existing Modules Observed

- Auth: JWT login and `/auth/me`.
- RBAC: role strings plus `roles`, `permissions`, and `role_permissions` models. Some routes still use role helpers; future work should converge on backend permission dependencies.
- Core HR: employee list/detail/create/update, documents, bank details, emergency contacts, job history, work locations, employment types, departments, and designations.
- Recruitment: jobs, candidates, offers, dashboard, and candidate-to-employee conversion.
- Onboarding: onboarding cases, default checklist tasks, dashboard, task status updates, and recruitment conversion handoff.
- Attendance: summary and regularization workflows.
- Leave: balance, request creation, employee request history, manager approval/rejection.
- Payroll: payslip summaries.
- Compliance/policy: policy listing/search.
- Audit/AI Agent: audit log access and controlled assistant layer.

### Phase 1 Gaps To Close Before Phase 2

- Normalize endpoint documentation to the active `/api/v1` modular router.
- Move any remaining references away from the legacy monolithic route style.
- Replace placeholder recruitment conversion data with deterministic employee code generation and department name lookup.
- Ensure employee access checks distinguish direct-report access from broad manager access.
- Apply permission names consistently in backend dependencies, not only role checks.
- Add audit log entries for employee creation/update, document verification, and candidate-to-employee conversion.
- Confirm migration coverage for all active SQLAlchemy models and seed reference data for roles, permissions, departments, designations, work locations, and employment types.
- Add focused backend tests for Core HR CRUD, RBAC, and recruitment-to-employee conversion.

## 14. Target HRMS Platform Architecture

```text
HRMS Platform
  Auth & Role Management
  Core HR
  Recruitment
  Onboarding
  Attendance
  Leave
  Payroll
  Travel & Expense
  Performance
  Learning
  Engagement
  Rewards
  Assets
  Helpdesk
  Compliance
  Workforce Planning
  Analytics
  Exit Management
```

Each module should keep the same implementation shape:

- SQLAlchemy models and Alembic migration.
- Pydantic request/response schemas.
- FastAPI router under `backend/app/api/v1`.
- Service layer under `backend/app/services`.
- Backend permission checks using roles and permissions.
- Audit logs for sensitive reads, writes, approvals, conversions, and payroll-facing actions.
- Frontend API wrapper under `frontend/src/api/modules`.
- React page under `frontend/src/pages`, using existing shared UI states.
- Role-aware route and sidebar entry.
- Table/list view, detail view, forms, status badges, loading states, empty states, and error states.

## 15. HR Lifecycle Model

The product should evolve around this lifecycle:

```text
Candidate
  -> Selected Candidate
  -> Offer Released
  -> Employee Onboarded
  -> Active Employee
  -> Attendance / Leave / Payroll / Performance / Travel
  -> Growth / Learning / Rewards
  -> Exit / Full and Final Settlement
```

Recruitment, onboarding, Core HR, payroll, assets, and exit management must share stable employee and candidate identifiers. Do not create duplicate employee master records when extending later modules.

## 16. Module-Wise Architecture

| Module | Core Tables | API Area | Frontend Area | Workflow |
| --- | --- | --- | --- | --- |
| Auth & Roles | `users`, `roles`, `permissions`, `role_permissions` | `/api/v1/auth`, future `/api/v1/roles` | Login, settings | Login, role resolution, permission enforcement |
| Core HR | `users`, `departments`, `designations`, `employee_documents`, `employee_bank_details`, `employee_emergency_contacts`, `employee_job_history`, `work_locations`, `employment_types` | `/api/v1/employees`, `/api/v1/org` | Core HR, Employee Master | Create/update employee, maintain profile, documents, org mapping |
| Recruitment | `jobs`, `candidates`, `offers` | `/api/v1/recruitment` | Recruitment | Job, candidate pipeline, offer, conversion |
| Onboarding | `onboarding_cases`, `onboarding_tasks`, `policy_acknowledgments`, future asset/account requests | `/api/v1/onboarding` | Onboarding | Candidate joined, task checklist, document verification, completion |
| Attendance | `attendance_records`, `attendance_regularization_requests`, future `shifts`, `holidays` | `/api/v1/attendance` | Attendance, Regularization | Clock/record, summary, correction approval |
| Leave | `leave_types`, `leave_balances`, `leave_requests`, future holidays/comp-off | `/api/v1/leave` | Leave, Manager Approvals | Apply, approve/reject, balance update |
| Payroll | `payroll_structures`, `payroll_runs`, `payslips`, future F&F tables | `/api/v1/payroll` | Payroll | Inputs from attendance, leave, overtime, expenses, deductions |
| Travel & Expense | `travel_requests`, `expense_claims`, `expense_items`, `expense_attachments` | `/api/v1/travel-requests`, `/api/v1/expense-claims` | Travel & Expense | Request, approval, bills, finance verification, reimbursement |
| Performance | `performance_cycles`, `performance_goals`, `performance_reviews`, `feedback_requests` | `/api/v1/performance` | Performance | Goals, self review, manager review, ratings, PIP |
| Learning | `learning_courses`, `learning_assignments`, `certifications`, `skills` | `/api/v1/learning` | Learning | Assign courses, track progress, skill matrix |
| Engagement | `announcements`, `surveys`, `polls`, `survey_responses` | `/api/v1/engagement` | Engagement | Announcements, surveys, polls, feedback |
| Rewards | `recognitions`, `reward_points`, `badges` | `/api/v1/rewards` | Rewards | Peer/manager recognition, points, certificates |
| Assets | `assets`, `asset_assignments`, `asset_return_tasks` | `/api/v1/assets` | Assets | Inventory, allocation, return, damage status |
| Helpdesk | `helpdesk_tickets`, `ticket_comments`, `ticket_attachments` | `/api/v1/helpdesk` | Helpdesk | Raise, assign, SLA, comments, resolution |
| Compliance | `hr_policies`, `policy_documents`, `policy_acknowledgments`, `compliance_checklists` | `/api/v1/compliance`, `/api/v1/policies` | Compliance | Policy management, acknowledgments, audit |
| Workforce Planning | `workforce_plans`, `headcount_budgets`, `skill_gap_items` | `/api/v1/workforce-planning` | Workforce Planning | Headcount, budget, skill gap, forecast |
| Analytics | Read models/views over existing tables | `/api/v1/analytics` | Analytics | Charts, dashboards, exports |
| Exit | `exit_requests`, `exit_clearance_tasks`, `final_settlements`, `exit_interviews` | `/api/v1/exits` | Exit Management | Resignation, approval, clearance, F&F, letters |

## 17. Roles And Permission Model

Target roles:

- `super_admin`
- `hr_admin`
- `hr_manager`
- `recruiter`
- `hiring_manager`
- `finance_manager`
- `payroll_manager`
- `department_manager`
- `employee`
- `it_admin_staff`

Initial permissions:

- `view_employee`
- `add_employee`
- `edit_employee`
- `delete_employee`
- `approve_leave`
- `process_payroll`
- `approve_expense`
- `manage_assets`
- `view_reports`
- `manage_recruitment`
- `manage_onboarding`
- `manage_exit`

Permission checks must run on the backend. Frontend role visibility is only a usability layer and must never be the only enforcement point.

## 18. Phase-Wise Implementation Plan

### Phase 1: Core HR Foundation

Status: started in the current codebase.

- Finish auditing the existing route, service, schema, model, migration, seed, and frontend patterns.
- Stabilize Core HR employee master around the active `api/v1` router.
- Complete departments, designations, work locations, employment types, employee documents, bank details, emergency contacts, and job history.
- Harden RBAC with permission dependencies for Core HR routes.
- Preserve existing recruitment, leave, attendance, payroll, compliance, audit, and agent behavior.
- Add backend tests for employee CRUD, sensitive subresources, direct-report access, and HR admin access.

### Phase 2: Recruitment To Onboarding

- Extend existing recruitment without rebuilding it.
- Add job approval workflow, candidate pipeline status history, interview feedback, and richer offer metadata.
- Expand the implemented onboarding cases and task checklists linked to offered/hired candidates.
- Add document verification, policy acknowledgment completion, asset/account request handoffs, and employee-facing onboarding views.

### Phase 3: Attendance And Leave

- Add shifts, holidays, work-from-home, overtime, comp-off, and richer monthly summaries.
- Ensure leave approvals update balances and expose payroll-impact metadata.
- Add team attendance and leave reports for managers and HR admins.

### Phase 4: Payroll Basic

- Add salary structures, payroll runs, payslip generation, payroll approval, and locked payroll periods.
- Consume attendance, leave, overtime, reimbursements, bonus, and deduction inputs.
- Keep this as mock payroll logic and avoid production payroll claims.

### Phase 5: Travel And Expense

- Add travel requests, policy validation placeholders, travel advance, expense claims, bill uploads, approval, finance verification, and reimbursement handoff to payroll.

### Phase 6: Performance, Learning, Engagement, Rewards

- Add goal/KRA/KPI tracking, review cycles, 360 feedback, learning courses, assignments, surveys, announcements, recognitions, and points history.

### Phase 7: Assets, Helpdesk, Compliance, Exit

- Add asset inventory/allocation/return, HR service desk tickets, policy acknowledgments/compliance checklists, resignation, clearance, and full-and-final workflow.

### Phase 8: Workforce Planning, Analytics, Notifications

- Add headcount planning, budgets, skill gap analysis, cross-module dashboards, exportable reports, and notification records.

### Phase 9: Production Foundation

- Standardize the local and Docker runtime on PostgreSQL 16 with Alembic-managed schema creation.
- Keep Docker development hot reload separate from production-style container startup.
- Run pytest against a separate test database, never the development database.
- Persist HR Policy RAG assets with durable storage for uploaded policy PDFs and Chroma vector data.
- Keep seed data idempotent so reruns do not duplicate users, employees, departments, policies, workforce plans, analytics-facing demo data, or notifications.
- Preserve Phase 1-8 user workflows while adding health, readiness, setup, RBAC, and reset documentation.

### Phase 10: Employee Central Upgrade

- Expand Employee Detail into a full Employee Central profile with tabs for timeline, documents, bank details, emergency contacts, job history, probation, and exit status.
- Reuse the existing Core HR models before adding new tables: `EmployeeDocument`, `EmployeeBankDetail`, `EmployeeEmergencyContact`, `EmployeeJobHistory`, `ExitRequest`, and related org metadata are already present.
- Add backend endpoints only where the current employee profile APIs cannot support the UI safely.
- Enforce role checks for sensitive fields such as bank details, documents, compensation-adjacent data, and exit records.
- Add audit events for profile changes, document upload or verification, bank-detail changes, job-history updates, probation status changes, and exit-status transitions.
- Add focused tests for self-service access, manager direct-report access, HR admin access, and forbidden cross-employee access.

## 19. Frontend Navigation Target

The sidebar should eventually include:

- Dashboard
- Core HR
- Recruitment
- Onboarding
- Attendance
- Leave
- Payroll
- Travel & Expense
- Performance
- Learning
- Engagement
- Rewards
- Assets
- Helpdesk
- Compliance
- Workforce Planning
- Analytics
- Exit Management
- Settings

Only expose entries that have working routes or intentional placeholder pages. Placeholder pages should be explicit module shells with empty states, not broken links.
