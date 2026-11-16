"""Top-level API router aggregating all feature routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    activities,
    analytics,
    applications,
    auth,
    companies,
    documents,
    interviews,
    reminders,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(applications.router)
api_router.include_router(companies.router)
api_router.include_router(interviews.router)
api_router.include_router(reminders.router)
api_router.include_router(documents.router)
api_router.include_router(activities.router)
api_router.include_router(analytics.router)
