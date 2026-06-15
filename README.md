# AI HRMS Foundation

Full-stack MVP foundation for a mock Darwinbox-like AI HR Assistant, built with FastAPI, React, PostgreSQL 16, SQLAlchemy, Alembic, JWT auth, and a controlled assistant tool layer.

The app is a proof of concept. It does not connect to real Darwinbox APIs or external HRMS systems.

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ for local backend development
- Node.js 20+ for local frontend development

## Environment Files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Keep real secrets out of committed env files. `backend/.env.example` defaults to local PostgreSQL ports exposed by Docker Compose.

## Docker Development Setup

The default compose file runs PostgreSQL 16, a separate PostgreSQL test database, the FastAPI backend with hot reload, and the Vite frontend with hot reload.

```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python scripts/seed.py
```

Open the app at `http://localhost:5173`. The API is available at `http://localhost:8000`, with `/health` and `/readiness` for health checks.

## Production-Style Docker Startup

Use the production compose file when you want container startup without source bind mounts or backend reload:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python scripts/seed.py
```

The frontend container serves the built Vite app via `npm run preview`.

## Local Setup Without Docker App Containers

Use Docker only for databases, then run backend/frontend directly on the host:

```bash
docker compose up -d postgres postgres_test
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## Database Migration And Seed Data

Fresh PostgreSQL setup:

```bash
docker compose up -d postgres
cd backend
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

The seed script is idempotent for baseline demo data. Rerunning it will not duplicate default users, employees, departments, policies, notifications, workforce planning records, or analytics-facing baseline records.

## Testing

Pytest is configured to use `TEST_DATABASE_URL`, which defaults to the separate `postgres_test` database on port `5433`.

```bash
docker compose up -d postgres_test
cd backend
TEST_DATABASE_URL=postgresql://hr_user:hr_password@localhost:5433/hrms_test pytest tests/
```

Inside Docker:

```bash
docker compose exec backend pytest tests/
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `hr@example.com` | `password123` |
| Manager | `manager@example.com` | `password123` |
| Employee | `vineet@example.com` | `password123` |

## HR Policy RAG Storage

Policy metadata and uploaded PDF paths are stored in PostgreSQL. Uploaded policy PDFs are stored under `POLICY_UPLOAD_DIR` and Chroma vector data is stored under `CHROMA_DB_PATH`.

Docker persists both paths with named volumes:

- `policy_uploads` mounted at `/app/uploads`
- `chroma_data` mounted at `/app/chroma_db`

## Reset And Rollback Safety

To wipe local Docker databases and recreated seed data from scratch:

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python scripts/seed.py
```

`docker compose down -v` destroys named volumes, including PostgreSQL data, uploaded policy files, and Chroma vector data. Use it only for local reset workflows.
