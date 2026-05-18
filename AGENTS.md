# AI HR Assistant Agent Guide

## Project Intent

This repository is for a full-stack MVP of an **AI HR Assistant for a Darwinbox-like HRMS**.

The system is a proof of concept and is **not connected to real Darwinbox**. It models a mock HRMS with realistic HR workflows, employee data, leave data, attendance data, payroll summaries, and HR policy Q&A.

## Current Build Scope

Only documentation and project planning files exist at this stage. Do not add backend, frontend, database migration, seed, or application code until explicitly requested.

Allowed files in this initial phase:

- `AGENTS.md`
- `docs/AI-HR-Assistant-MVP-Build-Spec.md`
- `docs/API-CONTRACT.md`
- `docs/DATABASE-SCHEMA.md`
- `docs/TESTING-CHECKLIST.md`

## Target Tech Stack

- Backend: Python FastAPI
- Database: SQLite
- ORM: SQLAlchemy
- Auth: JWT
- Frontend: React + Tailwind CSS
- AI Agent: controlled tool-calling layer
- Future RAG: HR policy PDF Q&A

## Core Product Principles

- Build a mock Darwinbox-like HRMS for POC workflows.
- Keep the assistant constrained to approved tools and explicit permissions.
- Do not expose or imply access to real Darwinbox APIs.
- Treat HR data as sensitive even in the mock app.
- Prefer simple, inspectable architecture over premature abstraction.
- Keep MVP workflows complete before expanding features.

## Agent Behavior Rules

When implementing future code:

- Read the relevant docs before making changes.
- Follow the API contract and database schema unless the user requests a change.
- Keep backend and frontend responsibilities cleanly separated.
- Do not let the AI assistant directly query the database from arbitrary prompts.
- Route assistant actions through a controlled tool registry.
- Require user authentication for all employee-specific data.
- Require role checks for HR/admin actions.
- Log assistant tool calls for auditability.
- Never invent employee records, balances, payroll values, or policy details.

## MVP Roles

- `employee`: Can view own profile, leave balance, attendance summary, payslip summary, and ask policy questions.
- `manager`: Can view direct-report summaries and pending leave requests.
- `hr_admin`: Can manage mock employees, view broader HR data, and review audit logs.

## Initial Assistant Capabilities

The AI assistant should eventually support:

- Answering questions about the logged-in employee's HR data.
- Summarizing leave balance and recent leave requests.
- Explaining attendance summaries.
- Summarizing payslip components.
- Creating a draft leave request after explicit confirmation.
- Answering policy questions from mock policy content.

The assistant must not:

- Modify records without explicit user confirmation.
- Access another employee's data unless role permissions allow it.
- Execute unrestricted SQL.
- Call external HRMS systems.
- Claim that it is connected to Darwinbox.

## Development Notes

Future project structure should be created only when implementation begins. A likely structure is:

```text
backend/
frontend/
docs/
```

Do not create these application directories yet.

