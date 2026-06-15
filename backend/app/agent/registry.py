from __future__ import annotations

from typing import Any

from app.models.user import User

# ---------------------------------------------------------------------------
# Tool definitions — Anthropic tool_use format
# ---------------------------------------------------------------------------

_ALL_TOOLS: list[dict[str, Any]] = [
    # ── Leave ──────────────────────────────────────────────────────────────
    {
        "name": "get_leave_balance",
        "description": "Return the current leave balance for the logged-in employee, broken down by leave type.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_my_leave_requests",
        "description": "List the employee's own leave requests (most recent first).",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "apply_leave",
        "description": (
            "Submit a leave application for the logged-in employee. "
            "This is a WRITE operation — always present a confirmation summary before calling this tool."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "leave_type": {
                    "type": "string",
                    "enum": ["casual_leave", "sick_leave", "earned_leave", "comp_off"],
                    "description": "Category of leave.",
                },
                "start_date": {"type": "string", "description": "Start date YYYY-MM-DD."},
                "end_date": {"type": "string", "description": "End date YYYY-MM-DD."},
                "reason": {"type": "string", "description": "Optional reason for leave."},
            },
            "required": ["leave_type", "start_date", "end_date"],
        },
    },
    {
        "name": "get_pending_leave_approvals",
        "description": "List all leave requests pending approval for this manager.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "approve_leave_request",
        "description": "Approve a specific pending leave request. WRITE operation — requires confirmation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "leave_id": {"type": "integer", "description": "ID of the leave request to approve."},
                "comment": {"type": "string", "description": "Optional approval comment."},
            },
            "required": ["leave_id"],
        },
    },
    {
        "name": "reject_leave_request",
        "description": "Reject a specific pending leave request. WRITE operation — requires confirmation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "leave_id": {"type": "integer", "description": "ID of the leave request to reject."},
                "comment": {"type": "string", "description": "Optional rejection reason."},
            },
            "required": ["leave_id"],
        },
    },
    # ── Attendance ─────────────────────────────────────────────────────────
    {
        "name": "get_attendance_summary",
        "description": "Return monthly attendance summary (present, absent, late, leave days) for the employee.",
        "input_schema": {
            "type": "object",
            "properties": {
                "month": {"type": "string", "description": "Month in YYYY-MM format, e.g. '2026-05'."},
            },
            "required": ["month"],
        },
    },
    {
        "name": "apply_attendance_regularization",
        "description": (
            "Submit an attendance regularization request for a missed or incorrect punch. "
            "WRITE operation — requires confirmation."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "work_date": {"type": "string", "description": "Date to regularize YYYY-MM-DD."},
                "issue_type": {
                    "type": "string",
                    "enum": ["missing_checkin", "missing_checkout", "wrong_status"],
                },
                "requested_status": {
                    "type": "string",
                    "enum": ["present", "wfh", "half_day"],
                },
                "reason": {"type": "string", "description": "Explanation for the regularization."},
            },
            "required": ["work_date", "issue_type", "requested_status", "reason"],
        },
    },
    {
        "name": "get_pending_regularization_requests",
        "description": "List attendance regularization requests pending this manager's approval.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "approve_regularization_request",
        "description": "Approve an attendance regularization request. WRITE operation — requires confirmation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "request_id": {"type": "integer"},
                "comment": {"type": "string"},
            },
            "required": ["request_id"],
        },
    },
    {
        "name": "reject_regularization_request",
        "description": "Reject an attendance regularization request. WRITE operation — requires confirmation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "request_id": {"type": "integer"},
                "comment": {"type": "string"},
            },
            "required": ["request_id"],
        },
    },
    # ── Payroll ────────────────────────────────────────────────────────────
    {
        "name": "get_my_payslip",
        "description": "Return the latest payslip summary (earnings, deductions, tax, net pay) for the employee.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    # ── Compliance / Policy ────────────────────────────────────────────────
    {
        "name": "search_hr_policies_rag",
        "description": "Semantic search over HR policies using RAG. Returns matching policy content extracted from PDF documents based on meaning, not just exact keyword match.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The natural language question or keyword to search for in HR policies."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_hr_policies",
        "description": "Search the HR policy library by keyword. Returns matching policy titles and content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Keyword(s) to search for, e.g. 'work from home'."},
            },
            "required": ["query"],
        },
    },
    # ── Core HR / Org ──────────────────────────────────────────────────────
    {
        "name": "get_org_hierarchy",
        "description": "Return all departments and designations in the organisation.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "search_employees",
        "description": (
            "List all employees or search/filter the employee directory. "
            "Call with NO arguments to list every employee. "
            "Use 'query' to search by name, email, or employee code. "
            "Use 'role' to filter by employee/manager/hr_admin. "
            "ALWAYS use this tool when the user asks to 'show all employees', 'list employees', "
            "'who works here', 'find employee', or any similar employee directory request."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search across name, email, employee code. Omit to list all."},
                "department_id": {"type": "integer", "description": "Filter by department ID."},
                "role": {"type": "string", "description": "Filter by role: employee, manager, or hr_admin."},
            },
            "required": [],
        },
    },
    {
        "name": "get_employee_profile",
        "description": (
            "Return full profile details for a specific employee, including personal info, "
            "work location, employment type, job history, and emergency contacts. "
            "ALWAYS use this tool when the user asks for an employee's profile, details, or information by ID or name."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "employee_id": {"type": "integer", "description": "ID of the employee."},
            },
            "required": ["employee_id"],
        },
    },
    # ── Recruitment ────────────────────────────────────────────────────────
    {
        "name": "get_recruitment_summary",
        "description": "Return open job positions and the active candidate pipeline.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "hire_candidate",
        "description": (
            "Convert an offered candidate into an active employee record. "
            "WRITE operation — requires confirmation."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "candidate_id": {"type": "integer", "description": "ID of the candidate to hire."},
            },
            "required": ["candidate_id"],
        },
    },
]

# ---------------------------------------------------------------------------
# Which roles may call which tools
# ---------------------------------------------------------------------------

_TOOL_PERMISSIONS: dict[str, set[str]] = {
    "get_leave_balance":                {"employee", "manager", "hr_admin"},
    "get_my_leave_requests":            {"employee", "manager", "hr_admin"},
    "apply_leave":                      {"employee"},
    "get_pending_leave_approvals":      {"manager", "hr_admin"},
    "approve_leave_request":            {"manager", "hr_admin"},
    "reject_leave_request":             {"manager", "hr_admin"},
    "get_attendance_summary":           {"employee", "manager", "hr_admin"},
    "apply_attendance_regularization":  {"employee"},
    "get_pending_regularization_requests": {"manager", "hr_admin"},
    "approve_regularization_request":   {"manager", "hr_admin"},
    "reject_regularization_request":    {"manager", "hr_admin"},
    "get_my_payslip":                   {"employee", "manager", "hr_admin"},
    "search_hr_policies":               {"employee", "manager", "hr_admin"},
    "search_hr_policies_rag":           {"employee", "manager", "hr_admin"},
    "get_org_hierarchy":                {"employee", "manager", "hr_admin"},
    "search_employees":                 {"manager", "hr_admin"},
    "get_employee_profile":             {"manager", "hr_admin"},
    "get_recruitment_summary":          {"manager", "hr_admin"},
    "hire_candidate":                   {"hr_admin"},
}

# Tools that mutate state and must pause for human confirmation
WRITE_TOOLS: set[str] = {
    "apply_leave",
    "approve_leave_request",
    "reject_leave_request",
    "apply_attendance_regularization",
    "approve_regularization_request",
    "reject_regularization_request",
    "hire_candidate",
}

_TOOL_MAP: dict[str, dict] = {t["name"]: t for t in _ALL_TOOLS}


def get_tools_for_user(user: User) -> list[dict]:
    allowed = {name for name, roles in _TOOL_PERMISSIONS.items() if user.role in roles}
    return [_TOOL_MAP[name] for name in allowed if name in _TOOL_MAP]
