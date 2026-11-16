# ApplyLine

**Your career. Your lifeline.**

ApplyLine is a private, database-backed job and internship application management platform. It helps students, graduates, and job seekers organize everything that happens *after* they find an opportunity: applications, companies, interviews, reminders, documents, and progress analytics.

ApplyLine is **not** a job board, a recruitment platform, or an automatic application system. It contains **no AI functionality of any kind**.

---

## Table of contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Local development](#local-development)
6. [Environment configuration](#environment-configuration)
7. [Database and migrations](#database-and-migrations)
8. [Testing](#testing)
9. [Code quality checks](#code-quality-checks)
10. [Deployment](#deployment)
11. [Free-tier limitations](#free-tier-limitations)
12. [Security considerations](#security-considerations)
13. [Key architectural decisions](#key-architectural-decisions)
14. [Known limitations](#known-limitations)

---

## Features

- **Public landing page** with hero, feature overview, how-it-works, CTAs, and footer.
- **Authentication** — registration, login, logout, HttpOnly refresh cookies, rotating refresh tokens with reuse detection, Argon2 password hashing, profile editing, password change, forgot-password foundation, rate-limited auth endpoints.
- **Dashboard** with six live metric cards plus charts for applications over time, status distribution, conversion funnel, upcoming interviews, and recent activity. Every number comes from the database.
- **Applications** — full CRUD, search, filter by status/priority/type/arrangement/company, sort, pagination, archive, detailed record view, document associations.
- **Kanban board** — drag-and-drop between the eight status columns plus an accessible native `<select>` on every card. Status changes persist and are logged exactly once (idempotent).
- **Companies** — directory with CRUD, search, contact details, and application counts.
- **Interviews** — CRUD, cancel/restore, outcomes, feedback, preparation notes, timezone-aware date/time storage, upcoming list.
- **Calendar** — monthly and weekly views of interviews, follow-up dates, and deadlines. Event times are stored as local date + time + timezone to prevent unexpected shifting.
- **Reminders** — CRUD, completion toggling, categories, optional application links, and duplicate prevention via a deterministic dedupe key.
- **Documents** — upload, rename, categorize, associate with applications, authenticated download, and delete. File extension, MIME type, and size validation. Private S3-compatible object storage abstraction with a local filesystem backend for development.
- **Activity timeline** — backend-generated records for application creation/update/status change/archive, interview scheduling/update, reminder creation, and document upload.
- **Analytics** — applications by status, applications over time, interview/offer/rejection rates, and average response time. Percentages are hidden until at least 3 applications exist, and average response time needs 3 data points.

---

## Technology stack

### Frontend
React 18, TypeScript (strict), Vite 6, Tailwind CSS 3, shadcn-style components built on Radix UI, Lucide React, React Router 6, TanStack Query 5, Zustand 5, React Hook Form, Zod, Recharts, Axios, date-fns.

### Backend
Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic, PostgreSQL (Neon in production), Argon2 (`argon2-cffi`), PyJWT, boto3 (S3-compatible storage).

### Testing
Pytest + HTTPX + aiosqlite (backend), Vitest + React Testing Library (frontend), Playwright (E2E).

### Quality
Ruff, mypy, ESLint, `tsc --noEmit` with strict mode.

---

## Architecture

```
React (Vite)  ──HTTPS──▶  FastAPI REST API  ──SQLAlchemy──▶  PostgreSQL (Neon)
     │                          │
     │                          └──▶  Private S3-compatible object storage (documents)
     └── TanStack Query (server state) + Zustand (auth/UI state)
```

- The browser never talks to the database or the object store directly.
- All validation, authorization, and ownership checks happen on the backend.
- The frontend keeps the short-lived access token in memory; the refresh token lives in an `HttpOnly`, `Secure` (production), `SameSite=Lax/Strict` cookie scoped to `/api/auth`.
- On page reload the app calls the refresh endpoint to restore the session, so refreshing does not log out a valid user.

---

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/         # Thin route modules (auth, applications, ...)
│   │   │   └── router.py
│   │   ├── core/               # Config, security, dependencies, errors, rate limiting
│   │   ├── db/                 # Base, mixins, async session factory
│   │   ├── models/             # SQLAlchemy ORM models and enums
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, domain services, analytics, storage)
│   │   └── main.py
│   ├── alembic/                # Migration environment + versions
│   ├── tests/                  # Pytest suite
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── e2e/                    # Playwright journeys
│   ├── src/
│   │   ├── components/         # ui/, layout/, auth/, shared/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/           # Typed API clients
│   │   ├── stores/             # Zustand stores
│   │   ├── test/               # Vitest tests and setup
│   │   ├── types/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── playwright.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## Local development

### Prerequisites
- Python 3.12+ (3.15 tested)
- Node.js 20+ (22 LTS recommended)
- PostgreSQL for a production-like local setup (a local SQLite file is the zero-setup default)

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # then edit values if needed
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs> · Health: <http://localhost:8000/health>

The default `DATABASE_URL` is `sqlite+aiosqlite:///./applyline.db`, which lets you run immediately. To use PostgreSQL, set `DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/applyline` in `backend/.env` before running migrations.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env                 # leave VITE_API_URL empty to use the Vite proxy
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to `http://localhost:8000`.

To point the frontend at a different API (for example, a deployed backend), set `VITE_API_URL=https://your-api.onrender.com/api` in `frontend/.env`. The client normalizes a bare host to include `/api` automatically.

---

## Environment configuration

See `backend/.env.example` and `frontend/.env.example` for the full list with comments.

### Backend variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `APP_NAME` | Display name | `ApplyLine` |
| `ENVIRONMENT` | `development` / `production` / `testing` | `development` |
| `DEBUG` | Debug flag | `true` |
| `SECRET_KEY` | JWT signing secret — **must be changed in production** | dev placeholder |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh cookie lifetime | `30` |
| `COOKIE_SECURE` | `true` over HTTPS | `false` |
| `COOKIE_SAMESITE` | `lax` / `strict` / `none` | `lax` |
| `DATABASE_URL` | SQLAlchemy async URL | local SQLite |
| `CORS_ORIGINS` | Comma-separated allowed origins | localhost:5173 |
| `STORAGE_PROVIDER` | `local` or `s3` | `local` |
| `STORAGE_LOCAL_PATH` | Dev upload directory | `./uploads` |
| `STORAGE_BUCKET` | Private bucket name | `applyline-documents` |
| `STORAGE_ENDPOINT_URL` | Custom S3 endpoint (optional) | empty |
| `STORAGE_REGION` | S3 region | `us-east-1` |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | S3 credentials | empty |
| `DOCUMENT_MAX_SIZE_MB` | Upload limit | `10` |
| `RATE_LIMIT_PER_MINUTE` | Auth endpoint limit | `10` |

### Frontend variables

Only `VITE_`-prefixed public values are used. No secrets belong here.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Absolute backend **API** URL (ending in `/api`) in production; empty locally uses the `/api` proxy |
| `VITE_API_PROXY` | Local dev proxy target |

---

## Database and migrations

Models: `User`, `RefreshToken`, `Company`, `Application`, `Interview`, `Document`, `Activity`, `Reminder`, plus the `application_documents` association table.

- UUID primary keys stored as 36-character strings for portability.
- Foreign keys with deliberate cascade rules (`CASCADE` for user-owned children, `SET NULL` for references to companies/applications).
- Composite indexes on `(owner_id, status)`, `(owner_id, created_at)`, `(owner_id, due_at)`, etc.
- Timestamps stored in UTC. `created_at`/`updated_at` use Python-side defaults plus server defaults.

Migrations are managed **only** by Alembic. `init_db()` exists solely as a development/test helper and is never called in production.

```bash
# create a revision after changing models
python -m alembic revision --autogenerate -m "describe change"
python -m alembic upgrade head
python -m alembic downgrade -1
```

The initial migration is committed at `backend/alembic/versions/`.

---

## Testing

```bash
# Backend (30 tests)
cd backend && python -m pytest -q

# Frontend unit/component tests (13 tests)
cd frontend && npm test

# End-to-end journey (requires Playwright browser: npx playwright install chromium)
cd frontend && npx playwright test
```

The E2E test covers: landing page → register → create company → create application → change status → dashboard → schedule interview → create reminder → upload/download document → logout. It starts both servers automatically (the database must already be migrated).

---

## Code quality checks

```bash
cd backend
python -m ruff check app tests
python -m mypy app

cd frontend
npm run typecheck
npm run lint
npm run build
```

All of these pass in the delivered project.

---

## Deployment

Target: free-tier Render (frontend static site + backend web service), Neon PostgreSQL, and private S3-compatible object storage. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for exact commands, environment variables, and a production verification checklist. A `render.yaml` blueprint is included.

---

## Free-tier limitations

- Render free web services **spin down when idle**; the first request after inactivity can take ~1 minute. The frontend shows loading/retry states and the API exposes `/health` for monitoring. No artificial keep-alive traffic is generated.
- Render's free PostgreSQL expires, so production data lives in **Neon's free PostgreSQL** instead.
- Render's filesystem is ephemeral. Uploaded files are **never** written there in production — they go to private S3-compatible object storage.
- The in-memory rate limiter works per process. On multiple instances it would need a shared store (e.g. Redis), which is outside the free-tier design.
- No uptime or unlimited free usage is promised.

---

## Security considerations

- Argon2 password hashing; plaintext passwords are never stored.
- Access tokens are short-lived (30 min) and kept in frontend memory.
- Refresh tokens are stored as SHA-256 hashes in PostgreSQL, delivered via `HttpOnly` cookies, rotated on use, and a reused token revokes the entire token family.
- Double-submit CSRF token required for the refresh endpoint.
- Every ORM query for user data includes `owner_id == current_user.id`; cross-user access returns 404. Covered by isolation tests.
- Input validated by Pydantic on the backend and Zod on the frontend.
- SQL injection prevented through SQLAlchemy ORM usage.
- CORS restricted to configured origins; security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS in production, etc.) added to every response.
- File uploads validated by extension, MIME type, and size; downloads require authentication and ownership checks. No permanent public URLs.
- Errors return safe, generic messages; secrets come only from environment variables and `.env` files are gitignored.

---

## Key architectural decisions

1. **SQLite for tests, PostgreSQL for production.** SQLAlchemy models use portable types (string UUIDs, `JSON`, no Postgres-only columns) so the same models run on both. Tests use aiosqlite for speed.
2. **Access token in memory + refresh cookie.** Avoids persisting long-lived tokens in browser storage while surviving page reloads via silent refresh.
3. **Thin routes, services for logic.** Routes only parse/validate and commit; services enforce ownership and generate activity records so behavior cannot be bypassed.
4. **Idempotent status changes.** The Kanban endpoint does nothing (and logs nothing) when the requested status equals the current one, preventing duplicate activity from retried requests.
5. **Timezone-safe events.** Interviews store date, time, and timezone separately; reminders store UTC instants. The calendar groups by local calendar date.
6. **Storage abstraction.** A small `StorageBackend` protocol with local and S3 implementations; changing provider requires no application changes.
7. **Lazy-loaded frontend routes** and a separate chart chunk to keep the initial bundle small. TanStack Query uses a 30-second stale time and no aggressive polling.

---

## Known limitations

- Password reset is a foundation only: the endpoint validates requests and returns a non-enumerating response, but no email is sent because no mail/API credentials were provided. Configure an email provider to complete it.
- The calendar is a read-only aggregation of interviews, follow-ups, and reminders; events are created from their respective pages rather than directly on the calendar.
- Application-level "deadlines" are represented by follow-up dates and deadline-category reminders.
- The backend's auth rate limiter is in-process; use a shared store for multi-instance deployments.
- Recharts 2.x is used for stable React 18 compatibility (its maintenance branch is older but the production build is verified).
