# Mock Darwinbox-like HRMS Frontend

React + Vite + Tailwind CSS frontend for the AI HR Assistant POC.

This frontend talks to the FastAPI backend. AI chat is rule-based in this phase and does not include RAG.

## Backend URL

```text
http://127.0.0.1:8000
```

## Install

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Test Login Credentials

| Role | Email | Password |
| --- | --- | --- |
| Employee | `vineet@example.com` | `password123` |
| Manager | `manager@example.com` | `password123` |
| HR Admin | `hr@example.com` | `password123` |

## Implemented Views

- Login
- Employee dashboard
- Leave apply and leave balance
- Attendance summary
- My leave requests
- Manager approvals
- HR admin audit logs
- AI Assistant chat
- Role-based navigation and protected routes

## AI Assistant Examples

Employee prompts:

- `How many leaves do I have?`
- `Show my attendance for May 2026`
- `Apply casual leave for 24 May`
- `Show my leave requests`

Manager prompts:

- `Show pending leave approvals`
- `Approve Vineet's leave`
- `Reject Vineet's leave because project deadline`

Write actions show Confirm and Cancel buttons before the backend executes them.
