# Deploying ApplyLine (free-tier first)

This guide deploys:

- **Frontend** → Render Static Site (free)
- **Backend** → Render Web Service (free)
- **Database** → Neon PostgreSQL (free tier)
- **Documents** → any private S3-compatible bucket (credentials required)

> No paid service is required to follow this guide. S3-compatible providers typically have a free tier (for example Cloudflare R2, Backblaze B2, or AWS S3 free tier); check current pricing before signing up. If you do not want to configure object storage yet, set `STORAGE_PROVIDER=local` — but note that Render's filesystem is ephemeral and uploads will be lost on restart. Use that only for evaluation.

---

## 1. Create the database (Neon)

1. Sign up at <https://neon.tech> and create a project.
2. Copy the **connection string** for the pooled endpoint. It looks like:
   ```
   postgresql+psycopg://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require
   ```
   Replace the driver prefix if Neon gives you `postgresql://` — SQLAlchemy needs `postgresql+psycopg://`.
3. Keep this value handy; it becomes `DATABASE_URL` on Render.

---

## 2. Create private object storage

1. Create a private bucket (no public access) on an S3-compatible provider.
2. Create an access key with permission to `PutObject`, `GetObject`, `DeleteObject`, and generate presigned URLs.
3. Note: bucket name, region, endpoint URL (if non-AWS), access key, and secret key.

---

## 3. Deploy the backend on Render

1. Push the repository to GitHub.
2. In Render, create a **Web Service** from that repo.
3. Settings:
   - **Runtime:** Python 3
   - **Build command:**
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start command:**
     ```bash
     cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Root directory:** leave empty (commands above use `backend/` paths). If you set Root Directory to `backend`, drop the `cd backend &&` and use `pip install -r requirements.txt`.
4. Environment variables (Runtime → Environment):

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | The Neon connection string from step 1 |
   | `SECRET_KEY` | A long random string (e.g. `python -c "import secrets; print(secrets.token_urlsafe(48))"`) |
   | `ENVIRONMENT` | `production` |
   | `DEBUG` | `false` |
   | `COOKIE_SECURE` | `true` |
   | `COOKIE_SAMESITE` | `lax` |
   | `CORS_ORIGINS` | `https://YOUR-FRONTEND.onrender.com` |
   | `STORAGE_PROVIDER` | `s3` |
   | `STORAGE_BUCKET` | Your private bucket name |
   | `STORAGE_REGION` | Bucket region |
   | `STORAGE_ENDPOINT_URL` | Custom endpoint, or leave empty for AWS |
   | `STORAGE_ACCESS_KEY` | Access key ID |
   | `STORAGE_SECRET_KEY` | Secret access key |
   | `DOCUMENT_MAX_SIZE_MB` | `10` |

5. After deploy, visit `https://YOUR-API.onrender.com/health` and expect `{"status":"ok",...}`.
6. API docs are at `/docs` (consider restricting them in a hardened deployment by setting `docs_url=None` in `app/main.py`).

**Why run migrations at start?** Alembic is idempotent — `upgrade head` is a no-op when already current. This keeps deploys reproducible without a separate one-off job.

---

## 4. Deploy the frontend on Render

1. Create a **Static Site** from the same repo.
2. Settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`
3. Environment variables:
   - `VITE_API_URL` = `https://YOUR-API.onrender.com` (no trailing `/api`)
4. Add a rewrite rule so client-side routing works:
   - **Rewrite:** `/*` → `/index.html` (status 200)
   - On Render this is configured under the static site's "Redirects/Rewrites" section.

---

## 5. Wire up CORS and cookies

- `CORS_ORIGINS` on the backend must exactly match the frontend origin, including `https://` and no trailing slash.
- `COOKIE_SECURE=true` is required because both sites use HTTPS.
- The refresh cookie is scoped to `/api/auth`; the CSRF cookie is readable by JavaScript so the SPA can send it back as `X-CSRF-Token` on refresh.
- Because the frontend uses an absolute `VITE_API_URL` in production, requests are cross-origin. Axios is configured with `withCredentials: true`, and the backend allows credentials from the configured origin only.

---

## 6. Optional: `render.yaml` blueprint

A `render.yaml` file is included at the repository root. It describes both services and can be used with Render's "Blueprint" deployment. You must still supply the secret environment values in the Render dashboard (they are intentionally not committed). Review the file and replace placeholder service/database names before use.

---

## 7. Production verification checklist

- [ ] `/health` returns 200 with `"status": "ok"`.
- [ ] `GET /openapi.json` lists all `/api/...` routes.
- [ ] Register a new account from the deployed frontend; you land on the dashboard.
- [ ] Refresh the page while logged in — you remain logged in.
- [ ] Create a company and an application; both appear in lists.
- [ ] Move an application on the Kanban board; reload — the status persists and activity shows one status-change record.
- [ ] Schedule an interview; verify it appears on the Calendar in the correct date.
- [ ] Create a reminder; toggle completion.
- [ ] Upload a document; download it and verify the bytes match. Confirm the object is **private** in your storage provider (no public URL).
- [ ] Open two different accounts and verify neither can see the other's records by ID.
- [ ] Log out; the refresh cookie is cleared and the refresh endpoint returns 401.
- [ ] Browser console has no errors; network calls use HTTPS.
- [ ] Cold start: after letting the free service sleep, the first page load shows loading states and recovers without a manual retry.

---

## 8. Local verification before deploying

```bash
# backend
cd backend && pip install -r requirements.txt && python -m alembic upgrade head
python -m pytest -q && python -m ruff check app tests && python -m mypy app

# frontend
cd frontend && npm install && npm test && npm run lint && npm run typecheck && npm run build

# E2E (starts both dev servers)
cd frontend && npx playwright install chromium && npx playwright test
```

All commands above pass in the delivered project.
