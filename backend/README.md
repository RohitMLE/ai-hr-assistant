# Mock Darwinbox-like HRMS Backend

FastAPI backend for the AI HR Assistant POC. This backend is not connected to real Darwinbox.

## Stack

- FastAPI
- SQLite
- SQLAlchemy
- Pydantic
- JWT authentication
- Passlib password hashing

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Seed Data

```bash
python scripts/seed.py
```

Seeded users:

| Role | Email | Password |
| --- | --- | --- |
| employee | `vineet@example.com` | `password123` |
| manager | `manager@example.com` | `password123` |
| hr_admin | `hr@example.com` | `password123` |

## Run

```bash
uvicorn app.main:app --reload
```

Open:

- API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

## Endpoints

- `POST /auth/login`
- `GET /auth/me`
- `GET /employee/me`
- `GET /leave/balance`
- `POST /leave/apply`
- `GET /leave/my-requests`
- `GET /attendance/summary?month=YYYY-MM`
- `GET /manager/leave/pending`
- `POST /manager/leave/{leave_id}/approve`
- `POST /manager/leave/{leave_id}/reject`
- `GET /audit/logs`
- `POST /agent/chat`

## AI HR Assistant

The assistant is rule-based in this phase. It does not use OpenAI, Gemini, RAG, or policy PDFs.

Request:

```json
{
  "message": "How many leaves do I have?"
}
```

Response:

```json
{
  "reply": "string",
  "requires_confirmation": false,
  "pending_action_id": null,
  "data": null
}
```

Supported examples:

- Employee: `How many leaves do I have?`
- Employee: `Show my attendance for May 2026`
- Employee: `Apply casual leave for 24 May`
- Employee: `Show my leave requests`
- Manager: `Show pending leave approvals`
- Manager: `Approve Vineet's leave`
- Manager: `Reject Vineet's leave because project deadline`

Write actions require confirmation. Send `confirm` to execute the latest pending action or `cancel` to cancel it.

## Notes

- Password hashes are stored in SQLite; password hashes are never returned by the API.
- Employees can only access their own profile, leave, and attendance data.
- Managers can only view, approve, or reject leave requests assigned to them.
- Leave balances are reduced only after approval.
- HR admin access is required for audit logs.
- The assistant calls controlled tools; it does not directly access the database.
